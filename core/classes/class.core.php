<?php
if (!defined("_VALID_PHP")) { die('Direct access to this location is not allowed.'); }

/** =========================================================
 * Class FrontCore
 * ========================================================== */
class FrontCore
{

	public $id = 0;//'1';

	function __construct()
	{
		$this->get_settings();
		$this->get_id();
		$this->site_name = 'carenet';
	}


	/** =========================================================
	 * Function : get_settings()
	 * ========================================================== */
	private function get_settings()
	{
		//$current_url = parse_url(get_url($_SERVER));
		//$current_url = 'https://' . $current_url['host'];

		$rows = Api::cache(false)->get()->settings();

		if(is_array($rows) === false ){
			
			DDos::change_status(1);
			redirect_to('/maintenance');
		}

		$this->site_id = $rows['id']?? 1;

		if(isset($rows['id'])){
			unset($rows['id']);
		} else {
			d($rows);
		}

		if($rows) {
			foreach ($rows as $key => $row) {
				$this->{$key} = $row;
			}
		}

	
		if(isset($this->core_url) === false || empty($this->core_url)){
			$this->core_url = CORE_URL;
		}
		
		
	}

	public function get_web(){
		$this->web = Api::get()->settings_web();
	}


	/** =======================================================
	 * Function : get_id()
	 * @return mixed
	========================================================== */
	private function get_id()
	{
		if (isset($_GET['id'])) {
			$id = ((int)$_GET['id']) ? (int)$_GET['id'] : false;
			$id = sanitize($id);

			if ($id == false) {
				$this->error("Invalid Method", "Core::get_id()");
			} else
				return $this->id = $id;
		}
	}


	/** =======================================================
	 * Function : error()
	 *
	 * @param $message
	 * @param $source
	========================================================== */
	public function error($message, $source)
	{
		$error_msg = '<div>';
			$error_msg .= '<span>System ERROR!</span><br />';
			$error_msg .= 'System Error : ' . $message . ' <br />';
			$error_msg .= 'More Information : <br />';
			$error_msg .= '<ul>';
				$error_msg .= '<li>Date : ' . date("F j, Y, g:i a") . '</li>';
				$error_msg .= '<li>Function : ' . $source . '</li>';
				$error_msg .= '<li>Script : ' . $_SERVER['REQUEST_URI'] . '</li>';
			$error_msg .= '</ul>';
		$error_msg .= '&lsaquo; <a href="javascript:history.go(-1)"><strong>Go Back</strong></a>';
		$error_msg .= '</div>';

		//print $error_msg;
		die($error_msg);
	}
}
?>