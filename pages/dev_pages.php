<?php

define("_VALID_PHP", true);
require_once '../core/autoload.php';


if (!$user->logged_in || !$user->is_superAdmin()) {
    http_response_code(403);
    die('Forbidden');
}

$lang = $_GET['lang'] ?? 'bg';
$skip = ['header', 'footer'];

$files = glob(BASEPATH . 'static/pages/' . $lang . '/*.html') ?: [];
$pages = [];

foreach ($files as $file) {
    $name = basename($file, '.html');
    if (!in_array($name, $skip)) {
        $pages[] = $name;
    }
}

header('Content-Type: application/json');
echo json_encode(array_values($pages));
