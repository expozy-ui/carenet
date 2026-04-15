<?php
define( "_VALID_PHP", true);

require_once( "../core/autoload.php");


$row = array('lang' => $_GET['lang']??'en');
if(isset($_GET["order_id"])){
	$row['order_id'] = (int)$_GET["order_id"];
}
if(isset($_GET["deposit_id"])){
	$row['deposit_id'] = (int)$_GET["deposit_id"];
}
if(isset($_GET["doctor_id"])){
	$row['doctor_id'] = (int)$_GET["doctor_id"];
}

$result = Api::data($row)->post()->payment_confirm();

if(isset($result['redirect'])){
    header('Location: '.$result['redirect']);
}

