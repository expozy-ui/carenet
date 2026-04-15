<?php
ob_start();
define("_VALID_PHP", true);
require_once("core/autoload.php");
$id = $_GET['id'] ?? null;

/**
 * Escape value for iCalendar (RFC 5545)
 */
function icsEscape(string $text): string
{
    $text = str_replace("\\", "\\\\", $text);
    $text = str_replace(";",  "\\;",  $text);
    $text = str_replace(",",  "\\,",  $text);
    $text = str_replace(["\r\n", "\n", "\r"], "\\n", $text);
    return $text;
}

/**
 * Fold a single iCalendar content line to max 75 octets (bytes).
 * Continuation lines start with one SPACE and are also max 75 octets total.
 */
function icsFold(string $line, int $limit = 75): string
{
    $out   = '';
    $enc   = 'UTF-8';
    $first = true;

    while (strlen($line) > $limit) {
        $chunk = mb_strcut($line, 0, $limit, $enc);
        $out  .= $chunk . "\r\n";
        $line  = ' ' . mb_strcut($line, strlen($chunk), null, $enc);
        if ($first) {
            $limit = 74; // space (1) + 74 = 75
            $first = false;
        }
    }

    return $out . $line . "\r\n";
}

/**
 * Build a folded iCalendar property line.
 */
function icsLine(string $name, string $value, array $params = []): string
{
    $p = '';
    foreach ($params as $k => $v) {
        $p .= ';' . $k . '=' . $v;
    }
    return icsFold($name . $p . ':' . icsEscape($value));
}

/**
 * Local time (Europe/Sofia) → UTC iCal format Ymd\THis\Z
 */
function toIcsUtc(string $dateYmd, string $timeHm, string $tz = 'Europe/Sofia'): string
{
    $dt = new DateTime($dateYmd . ' ' . $timeHm . ':00', new DateTimeZone($tz));
    $dt->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Ymd\THis\Z');
}

// ── 1) Appointments ─────────────────────────────────────────────────────
$params = ['from_today' => 1, 'no_pagination' => 1];

if ($id) {
    $params['id'] = $id;
}

$app = Api::data($params)->get()->my_doctors_appointments();
$appointments = is_array($app) ? $app : [];

// ── 2) ICS header ───────────────────────────────────────────────────────
$dtstamp = (new DateTime('now', new DateTimeZone('UTC')))->format('Ymd\THis\Z');

$ics  = "BEGIN:VCALENDAR\r\n";
$ics .= "VERSION:2.0\r\n";
$ics .= "PRODID:-//SuperCare//Appointments//BG\r\n";
$ics .= "CALSCALE:GREGORIAN\r\n";
$ics .= "METHOD:PUBLISH\r\n";
$ics .= "X-WR-CALNAME:SuperCare\r\n";
$ics .= "X-WR-TIMEZONE:Europe/Sofia\r\n";

// ── 3) VEVENT per appointment ───────────────────────────────────────────
foreach ($appointments as $a) {

    $serviceTitle =
        $a['service']['title']
        ?? $a['cabinet']['services'][0]['service']['title']
        ?? 'Преглед';

    $date      = $a['date']       ?? null;
    $timeStart = $a['time_start'] ?? null;
    $timeEnd   = $a['time_end']   ?? null;

    if (!$date || !$timeStart) {
        continue;
    }

    // Fallback: calculate end from interval
    if (!$timeEnd) {
        $interval = (int) ($a['interval'] ?? 30);
        $tmp = new DateTime($date . ' ' . $timeStart . ':00', new DateTimeZone('Europe/Sofia'));
        $tmp->modify("+{$interval} minutes");
        $timeEnd = $tmp->format('H:i');
    }
    if (!$timeEnd) {
        continue;
    }

    $dtstart = toIcsUtc($date, $timeStart);
    $dtend   = toIcsUtc($date, $timeEnd);

    // Stable UID
    $idPart = $a['id'] ?? md5($date . $timeStart . $serviceTitle);
    $uid    = "appointment-" . $idPart . "@supercare";

    // Location
    $address  = $a['cabinet']['address'] ?? '';
    $isOnline = !empty($a['cabinet']['online']);
    $location = trim($address);
    if ($isOnline) {
        $location = $location ? ($location . " - Online") : "Online";
    }

    // Description
    $patientNames =
        $a['client']['user_info']['names']
        ?? trim(
            ($a['client']['user_info']['first_name'] ?? '') . ' ' .
            ($a['client']['user_info']['last_name']  ?? '')
        );

    $patientPhone = $a['client']['user_info']['phone'] ?? '';
    $price        = $a['price']                        ?? '';
    $onlineUrl    = $a['cabinet']['online_url']        ?? '';

    $descLines   = [];
    $descLines[] = "Услуга: " . $serviceTitle;
    if ($patientNames)          $descLines[] = "Пациент: "  . $patientNames;
    if ($patientPhone)          $descLines[] = "Телефон: "  . $patientPhone;
    if ($price !== '')          $descLines[] = "Цена: "     . $price . " €";
    if ($isOnline && $onlineUrl) $descLines[] = "Линк: "    . $onlineUrl;

    $description = implode("\n", $descLines);

    // ── Event ───────────────────────────────────────────────────────────
    $ics .= "BEGIN:VEVENT\r\n";
    $ics .= icsLine('UID',      $uid);
    $ics .= icsLine('DTSTAMP',  $dtstamp);
    $ics .= icsLine('DTSTART',  $dtstart);
    $ics .= icsLine('DTEND',    $dtend);
    $ics .= icsLine('SUMMARY',  $serviceTitle);

    if ($location) {
        $ics .= icsLine('LOCATION', $location);
    }

    $ics .= icsLine('DESCRIPTION', $description);
    $ics .= "STATUS:CONFIRMED\r\n";
    $ics .= "TRANSP:OPAQUE\r\n";

    // Alarm 15 min before
    $ics .= "BEGIN:VALARM\r\n";
    $ics .= "TRIGGER:-PT15M\r\n";
    $ics .= "ACTION:DISPLAY\r\n";
    $ics .= icsLine('DESCRIPTION', $serviceTitle);
    $ics .= "END:VALARM\r\n";

    $ics .= "END:VEVENT\r\n";
}

$ics .= "END:VCALENDAR\r\n";


// ── 4) Output ───────────────────────────────────────────────────────────
ob_end_clean();

header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename="appointments.ics"');
header('Content-Length: ' . strlen($ics));

echo $ics;
exit;