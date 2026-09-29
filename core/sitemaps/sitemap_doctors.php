<?php define( "_VALID_PHP", true);
require_once '../autoload.php';
header('Content-type: application/xml');
echo '<?xml version="1.0" encoding="UTF-8"?>' ?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<?php


$page = 1;
$total_pages = 0;
do{

	$result = Api::cache(false)->data(['page' => $page, 'limit'=>100 ])->get()->doctors();


	$total_pages = $result['pagination']['total_pages'];

	$page++;
	foreach($result['result'] as $row){
		print "
	<url>
		<loc>{$core->site_url}/bg/doctor?id={$row['id']}</loc>
	</url>\n";
	}


}
while($page <= $total_pages );
?>
</urlset>
