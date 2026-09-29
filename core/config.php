<?php
if (!defined("_VALID_PHP")) { die('Direct access to this location is not allowed.'); }

define('APP_NAME',				'expozy');

/* PHP Config
========================================== */
//error_reporting(-1);
//error_reporting(E_ALL);

//ini_set('display_errors',			1);
ini_set('error_log',				BASEPATH . 'error_log'); // path to server-writable log file
//ini_set('memory_limit',			'1024M');
setlocale(LC_ALL,					'bg_BG.utf8');


/* Directoires
========================================== */
define('CORE_URL',				'https://core.expozy.com/');

define('API_DIR',					'core/');
define('CLASSES_DIR',				'core/classes/');
define('HELPERS_DIR',				'core/helpers/');
define('PLUGINS_DIR',				'core/plugins/');
define('PAGES_DIR',					'pages/');
define('JS_VERSION',				'88');


/* DEV MODE
========================================== */
define('DEV_MODE', true);


/* SAAS
 ========================================= */
require_once 'saas_key.php';
?>
