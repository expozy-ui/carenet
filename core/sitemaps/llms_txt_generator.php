<?php
/**
 * ============================================================
 * LLMS.TXT GENERATOR за Expozy
 * ============================================================
 * 
 * Поставя се в: /core/sitemaps/llms_txt.php
 * Достъпен на: https://yourdomain.com/llms.txt
 * 
 * .htaccess правило (добави в основния .htaccess):
 *   RewriteRule ^llms\.txt$ /core/sitemaps/llms_txt.php [L]
 *   RewriteRule ^llms-full\.txt$ /core/sitemaps/llms_txt.php?full=1 [L]
 * ============================================================
 */

define("_VALID_PHP", true);
require_once __DIR__ . '/../autoload.php';

header('Content-Type: text/markdown; charset=UTF-8');
header('Cache-Control: public, max-age=86400'); // Кеш 24 часа

$full = isset($_GET['full']) && $_GET['full'] == '1';

// ── 1. ОСНОВНА ИНФОРМАЦИЯ ЗА МАГАЗИНА ──
$site_name  = $core->site_name ?? 'Online Store';
$site_url   = "https://{$_SERVER['HTTP_HOST']}";
$logo       = $core->web['logo'] ?? '';
$lang       = $_SESSION['LANG_expozy'] ?? 'bg';

echo "# {$site_name}\n\n";
echo "> {$site_name} е онлайн магазин. Тук ще намерите информация за нашите продукти, категории, блог публикации и политики.\n\n";

echo "- Уебсайт: {$site_url}\n";
echo "- Език: {$lang}\n";
if (!empty($logo)) {
    echo "- Лого: {$logo}\n";
}
echo "\n";

// ── 2. КАТЕГОРИИ ──
echo "## Категории продукти\n\n";

$categories = Api::cache(true)->data(['limit' => 100])->get()->categories();
if (!empty($categories) && is_array($categories)) {
    $cat_list = isset($categories['result']) ? $categories['result'] : $categories;
    foreach ($cat_list as $cat) {
        $cat_title = $cat['title'] ?? $cat['name'] ?? 'Без име';
        $cat_url   = $cat['url'] ?? '';
        $cat_desc  = $cat['description'] ?? '';
        
        if (!empty($cat_url)) {
            echo "- [{$cat_title}]({$cat_url})";
        } else {
            echo "- {$cat_title}";
        }
        if (!empty($cat_desc)) {
            $short_desc = mb_substr(strip_tags($cat_desc), 0, 150, 'UTF-8');
            echo ": {$short_desc}";
        }
        echo "\n";
    }
}
echo "\n";

// ── 3. ПРОДУКТИ ──
echo "## Продукти\n\n";

$page = 1;
$max_pages = $full ? 50 : 3; // llms.txt = 3 страници, llms-full.txt = всички
$product_count = 0;

do {
    $result = Api::cache(true)->data(['page' => $page, 'limit' => 20])->get()->products();
    
    $total_pages = $result['pagination']['total_pages'] ?? 0;
    $products    = $result['result'] ?? [];
    
    foreach ($products as $product) {
        $title       = $product['title'] ?? '';
        $url         = $product['url'] ?? '';
        $price       = $product['price'] ?? '';
        $currency    = $product['currency'] ?? 'BGN';
        $description = $product['seo_description'] ?? $product['description'] ?? '';
        $brand       = $product['brand'] ?? '';
        $sku         = $product['sku'] ?? '';
        $in_stock    = isset($product['quantity']) && $product['quantity'] > 0;
        
        // Кратко описание за llms.txt
        $short_desc = mb_substr(strip_tags($description), 0, 200, 'UTF-8');
        
        if (!empty($url)) {
            echo "### [{$title}]({$url})\n";
        } else {
            echo "### {$title}\n";
        }
        
        if (!empty($short_desc)) {
            echo "{$short_desc}\n";
        }
        
        // Мета данни
        $meta = [];
        if (!empty($price))    $meta[] = "Цена: {$price} {$currency}";
        if (!empty($brand))    $meta[] = "Марка: {$brand}";
        if (!empty($sku))      $meta[] = "SKU: {$sku}";
        $meta[] = $in_stock ? "Наличност: В наличност" : "Наличност: Изчерпан";
        
        echo "- " . implode(" | ", $meta) . "\n\n";
        
        $product_count++;
    }
    
    $page++;
} while ($page <= min($total_pages, $max_pages));

if (!$full && $total_pages > $max_pages) {
    echo "> За пълен списък на всички {$result['pagination']['total']} продукта, вижте [{$site_url}/llms-full.txt]({$site_url}/llms-full.txt)\n\n";
}

// ── 4. БЛОГ ПУБЛИКАЦИИ ──
echo "## Блог\n\n";

$blog_page = 1;
$blog_max = $full ? 20 : 3;

do {
    $blog_result = Api::cache(true)->data(['page' => $blog_page, 'limit' => 20])->get()->blogPosts();
    
    $blog_total = $blog_result['pagination']['total_pages'] ?? 0;
    $posts      = $blog_result['result'] ?? [];
    
    foreach ($posts as $post) {
        $post_title = $post['title'] ?? '';
        $post_url   = $post['url'] ?? '';
        $post_desc  = $post['seo_description'] ?? $post['description'] ?? '';
        $post_date  = $post['date_created'] ?? '';
        $post_tags  = $post['tags'] ?? '';
        
        $short_desc = mb_substr(strip_tags($post_desc), 0, 200, 'UTF-8');
        
        if (!empty($post_url)) {
            echo "- [{$post_title}]({$post_url})";
        } else {
            echo "- {$post_title}";
        }
        if (!empty($short_desc)) {
            echo ": {$short_desc}";
        }
        echo "\n";
    }
    
    $blog_page++;
} while ($blog_page <= min($blog_total, $blog_max));

echo "\n";

// ── 5. ВАЖНИ СТРАНИЦИ ──
echo "## Полезни страници\n\n";
echo "- [{$site_name} - Начало]({$site_url})\n";
echo "- [Всички продукти]({$site_url}/{$lang}/products)\n";
echo "- [Блог]({$site_url}/{$lang}/blog)\n";
echo "- [Контакти]({$site_url}/{$lang}/contacts)\n";
echo "- [Условия за ползване]({$site_url}/{$lang}/terms)\n";
echo "- [Политика за поверителност]({$site_url}/{$lang}/privacy)\n";
echo "- [XML Sitemap]({$site_url}/core/sitemaps/sitemap_products.php)\n";

echo "\n---\n";
echo "Генерирано на: " . date('Y-m-d H:i:s') . "\n";
