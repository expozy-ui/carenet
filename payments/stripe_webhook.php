<?php
define( "_VALID_PHP", true);

require_once( "../core/autoload.php");

$payload = file_get_contents('php://input');
$stripe_signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if (empty($payload)) {
    http_response_code(400);
    die(json_encode(['error' => 'Empty payload']));
}

$data = [
    'payload'          => $payload,
    'stripe_signature' => $stripe_signature,
];

$result = Api::data($data)->post()->stripe_webhook();


if(isset($result['status']) && $result['status'] == 1){
	http_response_code(200);
	echo json_encode($result ?? ['status' => 1]);
} else {
	echo json_encode(['status' => 0, 'error' => $result]);
	http_response_code(400);
}

