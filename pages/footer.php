<?php if (!defined("_VALID_PHP")) { die('Direct access to this location is not allowed.'); } ?>


<div id="footer" class="headerFooterCss" style="<?php if($page->slug == 'checkout' || $page->slug == 'checkout2') echo "display:none"; ?>">
	<?php echo  Page::html_res_change($page->footer, '10x10'); ?>
</div>


<div id="templatesDiv" style="display:none;" ></div>
</body>

<link rel="stylesheet" href="/assets/css/animate.css?v=<?php echo JS_VERSION ?>">


<?= $core->web['scripts']['footer'];?>


<link rel="stylesheet" href="\assets\plugins\cookieconsent\cookieconsent.css?v=<?php echo JS_VERSION ?>">
<script type="module" src="\assets\plugins\cookieconsent\cookieconsent.js?v=<?php echo JS_VERSION ?>"></script>
<script type="module" src="\assets\plugins\cookieconsent\coockieconsent_init.js?v=<?php echo JS_VERSION ?>"></script>

<!-- IMPORTNAT : AUTOLOAD.JS MUST BE BEFORE ALPINE.js  -->


<script type="module" src="\components\core\alpinejs-framework/autoload.js?v=<?php echo JS_VERSION ?>" ></script>


<!-- SCRIPTS AND STYLES FOR GLIDE SLIDER -->
<?php //файловете са на самия фронт сървър — относителни пътища, не site_url (прод) ?>
 <link href="/editor/cb/assets/scripts/glide/css/glide.core.min.css" rel="stylesheet">
<link href="/editor/cb/assets/scripts/glide/css/glide.theme.css" rel="stylesheet">
<script src="/editor/cb/assets/scripts/glide/glide.min.js"></script>

<link rel="stylesheet"  href="https://r2.expozy.com/cdn/fa/css/all.css?v=<?php echo JS_VERSION ?>" />


<!-- SCRIPT FOR EDITOR  -->
<script src="<?= CBURL ?>box/box-flex.js?v=<?php echo JS_VERSION ?>"></script>


<!--  INTERCEPT LINKS AND LOAD NEW PAGE SCRITP   -->
<script type="module" src="\components\core\classes\link.js?v=<?php echo JS_VERSION ?>"></script>

<?= $core->web['scripts']['footer'] ?? '' ?>

</html>
