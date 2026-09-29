<?php
define( "_VALID_PHP", true);
/**** get repo if folder is empty ****/
if(file_exists('.htaccess') === false){
	@unlink('index.html');
	@unlink('index.php');
	exec('rm -rf .git 2>&1', $out, $code);
	exec('rm -rf tmp 2>&1', $out, $code);
	$git_clone = "git clone https://github.com/expozy-ui/frontend.expozy.git tmp && mv tmp/.git . && rm -rf tmp && git reset --hard && rm -rf static";
	$output = exec($git_clone, $out, $code);

	if(isset($_GET['saas_key'])){
		require_once( "core/autoload.php");
		require_once(BASEPATH.'core/classes/class.gitops.php');
		GitOps::change_saas_key($_GET['saas_key']);
		
		get_template($_GET['saas_key']);
	}
	
	
	die();
}



require_once( "core/autoload.php");
require_once(BASEPATH.'core/classes/class.gitops.php');


/************ Login **********/
if(post('login')){
	$res = $user->login(post('email'), post('password'));
	header('Location: /gitops.php');
	die();
}
  

/**** Check access level ****/
if($user->is_admin() === false){
	echo '	<form method="post">
					   <input type="hidden" name="login"  value="1" />
					   <input type="text" placeholder="Email" name="email"/>
					   <input type="password" placeholder="password" name="password"/>
					   <button>LOGIN</button>
			</form>';
	die('Please login first!');
}

/******** Change saas key ************/
if(post('saas_key')){
	GitOps::change_saas_key(post('saas_key'));
	
	$user->logout();
	header('Location: /gitops.php');
	die();
}
 

/*********** Change github token *************/
if(post('github_token')){
	$verify = Api::data(['github_token'=> post('github_token'), 'github_route'=>'verify'])->get()->git();	
	
	if($verify['status'] != 1){
		header('Location: /gitops.php');
		die();
	}
		
	$_SESSION['github_token'] = post('github_token');

}

$github_token = isset($_SESSION['github_token']) && !empty($_SESSION['github_token']) ? $_SESSION['github_token'] : false;
$default_project = $core->site_name === 'frontend' ? true : false;

if($core->site_name == "myexpozyecommerce"){
	$core->site_name = 'frontend.expozy';
}


if(post('upload_repo')){
	$result_string = GitOps::upload_repo($github_token);	
}

$hide_table =  $github_token === false ? true : false;


$repos = Api::data(['github_token'=> $github_token, 'github_route'=>'repos'])->get()->git();


if(post('download') && !empty(post('repo'))){
	GitOps::download_other_repo(post('repo'));
	header('Location: /gitops.php');
	die();	
}  


if(post('git_pull')){
	$result_string = GitOps::pull_repo();
}

if(post('visibility')){
	$result_string = GitOps::change_repo_visibility($github_token, post('visibility'));
}

if(post('template_id') && $user->is_admin()){
	GitOps::change_saas_template(post('template_id'));
	header('Location: /gitops.php');
}


$repo_name = GitOps::get_current_repo_name();

if(empty($repo_name)){
	echo "Folder \".git\" don't exist in this project.";
	die();
}
?>


<!DOCTYPE html>
<html>
	<head>
		<title>GitOps</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>.red{color: red;}.table td{padding: 10px}</style>
	</head>
	<body>
		
		
		<div>
			
				<table class='table'>
					
					<tr>
						<td>Project Name: </td>
						<td><?php  echo $core->site_name ?></td>
					</tr>
					<tr>
							<td>Current Repo: </td>
							<td><?php  echo $repo_name; ?></td>
					</tr>
					<tr>
						<td>Saas Key: </td>
						<td><form method="post"><input type="text" name="saas_key" value="<?php  echo SAAS_KEY ?>" ><button>SAVE</button></form></td>
					</tr>
					<tr>
						<td>Github token: </td>
						<td><form method="post"><input type="text" name="github_token" value="<?php  echo $github_token ? $github_token : '' ?>" ><button>SAVE</button></form></td>
					</tr>
				</table>
			
			 <br /><br/>
			 <br /><br/>
			 
			 <div class="red">
				<div><?php if($default_project) echo "Please, change SAAS KEY"; ?></div>
				<div><?php if(!$github_token) echo "Please, enter github token: <a href='https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens' target='_blank'>Help</a>"; ?></div>
			 </div>
			 <div style="<?php if($hide_table) echo "display:none;"; ?>">
					<table class='table'>
						
						<tr>
						   <td>Template: </td>
						   <td><form method="post">
							   <?php 
										$templates = GitOps::get_saas_templates(); ?>
							   
									<select name='template_id'>
										<option value="0">-- Select --</option>
										<?php foreach($templates as $template) { ?>
										<option value="<?= $template['id'] ?>"><?= $template['title'] ?></option>
										<?php } ?>
									</select>
									<button type="submit" onclick="return confirm('This will override your template, are you sure?')"> Change</button>
								</form>
						   </td>
						</tr>
						
						<tr>
						   <td>Repo visability: </td>
						   <td><form method="post">
							   <?php echo "<i>{$repo_name}:</i> ";
										$repo = GitOps::get_repo($github_token, $repo_name);
										$vis = $repo['visibility'] ?? ''; ?>
							   
									<select name='visibility'>
										<option <?php if($vis == 'public') echo 'selected'; ?>>Public</option>
										<option <?php if($vis == 'private') echo 'selected'; ?>>Private</option>
									</select>
									<button <?php if($repo_name == 'frontend.expozy.git') echo 'disabled'; ?> >Change</button>
								</form>
						   </td>
						</tr>
					   <tr>
							<td>Download from Repo:<br/><i>*fetch from GitHub - fast</i></td>
							<td><form method="post"><?php  echo $repo_name; ?> <input type="hidden" name="git_pull" value='1'><button>Download</button></form>
							</td>
						</tr>
						<tr>
						   <td>Push to repo: <br/><i>*you can push only in project repo</i></td>
						   <td><form method="post">
									<input type="hidden" name="upload_repo"  value="1" />
									<input type="text" placeholder="GitHub username" value="<?php echo $core->site_name; ?>" disabled/>	
									<button>Upload</button>
								</form>
						   </td>
						  
						</tr>
					   <tr>
						   <td>Change repo:<br/><i>*fetch from GitHub</i></td>
						   <td><form method="post">
									<input type="hidden" name='download' value='1' />
									<select name='repo'>
										<?php foreach($repos as $repo) { ?>
										<option value='<?php echo $repo['clone_url']; ?>' <?php if($repo['name'] == $core->site_name) echo 'selected'; ?>><?php echo $repo['name']; ?></option>
										<?php } ?>
									</select>
									<button>DOWNLOAD</button>
								</form>
						   </td>
						</tr>
					   
					</table>
				 </br>
					
				 <?php if(isset($result_string)) echo "<p style='color: red;'><br/><br/>Result:<br/>{$result_string}</p>"; ?>

				<br/>
				<br/>
				   
				    
			 </div>
		</div>
	</body>
</html>

<?php 
function get_template(string $saas_key){
	
	require_once( "core/autoload.php");
	
	if (is_dir('static') === false){
		GitOps::get_my_saas_template($saas_key);
	}

	header('Location: /');
	die();
}