<?php
if (!defined("_VALID_PHP")) { die('Direct access to this location is not allowed.'); }

/** =========================================================
 * Class GitOps
 * ========================================================== */
class GitOps
{ 
	
		public static function get_current_repo_name():string{
				$output = shell_exec("git remote get-url origin");
				$curent_repo = trim(basename($output));
				
				return $curent_repo;
		}
		
		
		public static function get_repo(string $token, string $repo_name){
			
				$owner = self::get_current_repo_owner();
				$repo = Api::data(['github_token' => $token, 'github_route' => 'repo', 'repo_name'=>$repo_name ,'repo_owner' => $owner])->get()->git();
				
			
				return $repo;
		}
		
				
		public static function change_repo_visibility(string $token,  string $visibility){ 
			
				$repo_name = self::get_current_repo_name();
				
				if($repo_name == 'frontend.expozy.git'){
					return false;
				}
				
				$owner = self::get_current_repo_owner();
				$repo = Api::data(['github_token' => $token, 'github_route' => 'change_visibility', 'repo_name'=>$repo_name, 'owner' => $owner, 'visibility' =>$visibility])->post()->git();
				
			
				return $repo;
		}
		 
		public static function download_other_repo(string $repo){
				//delete all files
				self::deleteFiles(BASEPATH);
				$git_clone = "git clone {$repo} tmp && mv tmp/.git . && rm -rf tmp && git reset --hard";
				shell_exec($git_clone);
		}
		
		public static function change_saas_key(string $key):void {
				$file = BASEPATH."core/saas_key.php";

				// get file content
				$content = file_get_contents($file);

				// replace key
				$newContent = preg_replace('/define\("SAAS_KEY",".*?"\);/', 'define("SAAS_KEY","' . $key . '");', $content, 1);

				// save new content
				file_put_contents($file, $newContent);
		}
		
		public static function upload_repo(string $github_token):string {
				global $core;
				
				$owner =  self::get_current_repo_owner();
				$create = Api::data(['github_token'=> $github_token,'github_route' => 'create_repo', 'owner' =>$owner, 'repo_name' => $core->site_name])->post()->git();
				$r0 = htmlspecialchars(print_r($create, true));

				$r1 = shell_exec("git add . 2>&1");
				$r2 = shell_exec('git commit -m "new commit" 2>&1');
				$r3 = shell_exec("git remote set-url origin https://{$github_token}@github.com/{$owner}/{$core->site_name}.git 2>&1");
				$r4 = shell_exec('git push -u origin main 2>&1');

				return str_replace($github_token, '***', "create_repo: {$r0}</br>{$r1}</br>{$r2}</br>{$r3}</br>push: {$r4}</br>");
		}
		
		private static function deleteFiles($target) {
	
			$files = scandir($target);
			foreach($files as $file){
				if(is_dir($file)){
					 shell_exec("rm -r " . escapeshellarg($file));
				} elseif(is_file($file)) {
					 unlink($file);
				}
			}
		}
		
		private static function get_current_repo_owner(){
				$repository_url = shell_exec("git remote get-url origin");
				
				$tmp = explode("/", str_replace("https://", "", $repository_url) );
				
				
				return $tmp[1];
				
		}
		
		public static function pull_repo():string {
				$r1 = shell_exec("git pull");
				
				return "{$r1}";
		}
		
		public static function install_saas_key():void {				
				$filepath = "/tmp/expozy/frontkeys/{$_SERVER['HTTP_HOST']}";
				
				if(file_exists($filepath) === false) return;

				// get file content
				$content = file_get_contents($filepath);

				self::change_saas_key($content);
		}
		
		private static function _install_template(array $template){
			if(isset($template['github_folder']) && !empty($template['github_folder']) ){

					$zipUrl = 'https://github.com/expozy-ui/Alpine-Expozy-StoreFront_templates/archive/refs/heads/main.zip';

					shell_exec("wget -q -O repo.zip $zipUrl");

					shell_exec("unzip -q repo.zip -d tmp_repo");

					$repoFolder = 'tmp_repo/Alpine-Expozy-StoreFront_templates-main';

					$folder = escapeshellarg($template['github_folder']);
					shell_exec("cp -r $repoFolder/$folder/static ./");

					shell_exec("rm -rf tmp_repo repo.zip");

				}
		}
		
		public static function get_my_saas_template(string $saas_key):void {
				$template = Api::data(['saas_key' => $saas_key])->get()->my_saas_template();
				self::_install_template($template);
				
		}
		
		public static function get_saas_template(int $id):array {
				return $template = Api::id($id)->data(['lang'=>'en'])->get()->saas_templates();
		}
		
		public static function get_saas_templates():array {
				return $template = Api::data(['lang'=>'en'])->get()->saas_templates();
		}
		
		
		public static function change_saas_template(int $template_id){
			$template = GitOps::get_saas_template($template_id);
			
			//remove old template
			rename("static", "static_".time());
			//get new template
			self::_install_template($template);
		}

} 
?>
