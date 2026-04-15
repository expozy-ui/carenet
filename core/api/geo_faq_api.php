<?php
/**
 * ============================================================
 * GEO FAQ API ENDPOINT
 * ============================================================
 * 
 * Файл: /core/api/geo_faq.php
 * 
 * Връща FAQ данни в JSON за Alpine.js рендериране.
 * Използва се от продуктовия шаблон.
 * 
 * GET /core/api/geo_faq.php?product_id=123
 * ============================================================
 */

define("_VALID_PHP", true);
require_once __DIR__ . '/../autoload.php';
require_once __DIR__ . '/../classes/class.geo_optimizer.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

$product_id = intval($_GET['product_id'] ?? 0);

if ($product_id <= 0) {
    echo json_encode(['error' => 'Invalid product_id', 'faqs' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$product = Api::cache(true)->id($product_id)->get()->products();

if (empty($product)) {
    echo json_encode(['error' => 'Product not found', 'faqs' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$geo  = new GeoOptimizer();
$faq  = $geo->generateProductFAQ($product);
$meta = $geo->generateGeoMetaTags($product);

echo json_encode([
    'product_id'     => $product_id,
    'product_title'  => $product['title'] ?? '',
    'faqs'           => $faq['faqs'],
    'schema_json_ld' => $faq['schema'],
    'geo_meta'       => $meta
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
