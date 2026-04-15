<?php
if (!defined("_VALID_PHP")) { die('Direct access to this location is not allowed.'); }

/** =========================================================
 * Function : get()
 *
 * @param $var
 *
 * @return mixed
========================================================== */
function get($var)
{
	if (isset($_GET[$var]))
		return htmlspecialchars($_GET[$var], ENT_QUOTES | ENT_HTML5, 'UTF-8');;
}


/** =========================================================
 * Function : post()
 *
 * @param $var
 *
 * @return mixed
========================================================== */
function post($var)
{
	if (isset($_POST[$var]))
		return $_POST[$var];
}

?>