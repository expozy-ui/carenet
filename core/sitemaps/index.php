<?php
define( "_VALID_PHP", true);
require_once '../autoload.php'; 
header('Content-type: application/xml');


echo '<?xml version="1.0" encoding="UTF-8"?>' ?><sitemapindex  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<sitemap>
		<loc><?= SITEURL.'/'.$lang->language ?>/sitemaps/sitemap_pages</loc>
	</sitemap>
	<sitemap>
		<loc><?= SITEURL.'/'.$lang->language ?>/sitemaps/sitemap_blog</loc>
	</sitemap>
	<sitemap>
		<loc><?= SITEURL.'/'.$lang->language ?>/sitemaps/sitemap_doctors</loc>
	</sitemap>
	<sitemap>
		<loc><?= SITEURL.'/'.$lang->language ?>/sitemaps/sitemap_clinics</loc>
	</sitemap>
</sitemapindex>


