<?php
/**
 * ============================================================
 * GEO / AEO / LLMO / AIO GENERATOR за Expozy
 * ============================================================
 * 
 * Файл: /core/classes/class.geo_optimizer.php
 * 
 * Generative Engine Optimization - генерира AI-оптимизирано 
 * съдържание за всеки продукт и блог пост.
 * 
 * Конвенция: class.{name}.php в /core/classes/
 * ============================================================
 */

if (!defined("_VALID_PHP")) { die('Direct access to this location is not allowed.'); }

/** =========================================================
 * Class GeoOptimizer
 * ========================================================== */
class GeoOptimizer {
    
    private $site_name;
    private $site_url;
    private $lang;
    private $t;
    
    /**
     * Преводи се зареждат от /core/lang/geo/{lang}.php
     * За нов език — добавете нов файл в тази папка.
     */
    private static $fallback = null;
    
    public function __construct() {
        global $core, $lang;
        $this->site_name = $core->site_name ?? 'Online Store';
        $this->site_url  = SITEURL ?? "https://{$_SERVER['HTTP_HOST']}";
        $this->lang      = $lang->language ?? $_SESSION['LANG_expozy'] ?? 'bg';
        $this->t         = self::loadTranslations($this->lang);
    }
    
    /**
     * Зарежда езиков файл. Fallback към EN.
     */
    private static function loadTranslations($lang_code) {
        $file = BASEPATH . "core/lang/geo/{$lang_code}.php";
        
        if (file_exists($file)) {
            return require $file;
        }
        
        // Fallback EN
        if (self::$fallback === null) {
            $en_file = BASEPATH . 'core/lang/geo/en.php';
            self::$fallback = file_exists($en_file) ? require $en_file : [];
        }
        
        return self::$fallback;
    }
    
    /**
     * Достъп до превод по ключ. Fallback към EN.
     */
    public function t($key) {
        if (isset($this->t[$key])) return $this->t[$key];
        
        if (self::$fallback === null) {
            self::$fallback = self::loadTranslations('en');
        }
        
        return self::$fallback[$key] ?? $key;
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 1. PRODUCT SCHEMA.ORG (JSON-LD) – за AI търсачки
     * ─────────────────────────────────────────────────
     * Генерира разширен Product schema с всички сигнали,
     * които AI системите използват за препоръки.
     */
    public function generateProductSchema($product) {
        $schema = [
            "@context"    => "https://schema.org",
            "@type"       => "Product",
            "name"        => $product['title'] ?? '',
            "description" => strip_tags($product['description'] ?? ''),
            "url"         => $product['url'] ?? '',
            "sku"         => $product['sku'] ?? '',
            "brand"       => [
                "@type" => "Brand",
                "name"  => $this->toStr($product['brand'] ?? $this->site_name)
            ],
            "offers" => [
                "@type"           => "Offer",
                "price"           => $product['price'] ?? 0,
                "priceCurrency"   => $product['currency'] ?? 'BGN',
                "availability"    => (isset($product['quantity']) && $product['quantity'] > 0)
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                "seller" => [
                    "@type" => "Organization",
                    "name"  => $this->site_name
                ],
                "url" => $product['url'] ?? '',
            ]
        ];
        
        // Снимки
        if (!empty($product['images'])) {
            $images = [];
            foreach ($product['images'] as $img) {
                $images[] = $img['image'] ?? $img['url'] ?? '';
            }
            $schema['image'] = array_filter($images);
        }
        
        // Категория
        if (!empty($product['category'])) {
            $schema['category'] = $this->toStr($product['category']);
        }
        
        // Рейтинг (ако има)
        if (!empty($product['rating']) && $product['rating'] > 0) {
            $schema['aggregateRating'] = [
                "@type"       => "AggregateRating",
                "ratingValue" => $product['rating'],
                "reviewCount" => $product['review_count'] ?? 1,
                "bestRating"  => 5,
                "worstRating" => 1
            ];
        }
        
        // Тегло (ако има)
        if (!empty($product['weight'])) {
            $schema['weight'] = [
                "@type"    => "QuantitativeValue",
                "value"    => $product['weight'],
                "unitCode" => "KGM"
            ];
        }
        
        // Отстъпка
        if (!empty($product['old_price']) && $product['old_price'] > $product['price']) {
            $schema['offers']['priceValidUntil'] = date('Y-12-31');
            $discount_pct = round((1 - $product['price'] / $product['old_price']) * 100);
            $schema['offers']['discount'] = "{$discount_pct}%";
        }
        
        return '<script type="application/ld+json">' . 
               json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . 
               '</script>';
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 2. FAQ SCHEMA – AEO (Answer Engine Optimization)
     * ─────────────────────────────────────────────────
     * Автоматично генерира FAQ въпроси от продуктови данни.
     * AI търсачките обичат FAQ формат.
     */
    public function generateProductFAQ($product) {
        $title    = $product['title'] ?? '';
        $price    = $product['price'] ?? '';
        $currency = $product['currency'] ?? 'BGN';
        $brand    = $this->toStr($product['brand'] ?? $this->site_name);
        $in_stock = isset($product['quantity']) && $product['quantity'] > 0;
        $category = $this->toStr($product['category'] ?? '');
        
        $faqs = [];
        
        // Въпрос 1: Цена
        if (!empty($price)) {
            $faqs[] = [
                "q" => sprintf($this->t('faq_price_q'), $title),
                "a" => !empty($product['old_price']) && $product['old_price'] > $price
                    ? sprintf($this->t('faq_price_a_old'), $title, $price, $currency, $product['old_price'], $currency)
                    : sprintf($this->t('faq_price_a'), $title, $price, $currency)
            ];
        }
        
        // Въпрос 2: Наличност
        $faqs[] = [
            "q" => sprintf($this->t('faq_stock_q'), $title),
            "a" => $in_stock 
                ? sprintf($this->t('faq_stock_yes'), $title, $this->site_name)
                : sprintf($this->t('faq_stock_no'), $title)
        ];
        
        // Въпрос 3: Поръчка
        $faqs[] = [
            "q" => sprintf($this->t('faq_order_q'), $title),
            "a" => sprintf($this->t('faq_order_a'), $title, $this->site_name)
        ];
        
        // Въпрос 4: Описание (ако има)
        if (!empty($product['description'])) {
            $short_desc = mb_substr(strip_tags($product['description']), 0, 300, 'UTF-8');
            $faqs[] = [
                "q" => sprintf($this->t('faq_what_q'), $title),
                "a" => $short_desc
            ];
        }
        
        // Въпрос 5: Марка
        if (!empty($brand) && $brand !== $this->site_name) {
            $faqs[] = [
                "q" => sprintf($this->t('faq_brand_q'), $title),
                "a" => sprintf($this->t('faq_brand_a'), $title, $brand, $this->site_name)
            ];
        }
        
        // JSON-LD Schema за FAQ
        $faq_schema = [
            "@context" => "https://schema.org",
            "@type"    => "FAQPage",
            "mainEntity" => []
        ];
        
        foreach ($faqs as $faq) {
            $faq_schema['mainEntity'][] = [
                "@type" => "Question",
                "name"  => $faq['q'],
                "acceptedAnswer" => [
                    "@type" => "Answer",
                    "text"  => $faq['a']
                ]
            ];
        }
        
        return [
            'schema' => '<script type="application/ld+json">' . 
                        json_encode($faq_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . 
                        '</script>',
            'html'   => $this->renderFAQHtml($faqs),
            'faqs'   => $faqs
        ];
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 3. GEO META TAGS – за Generative Engine Discovery
     * ─────────────────────────────────────────────────
     */
    public function generateGeoMetaTags($product) {
        $title = $product['title'] ?? '';
        $desc  = strip_tags($product['seo_description'] ?? $product['description'] ?? '');
        $desc  = mb_substr($desc, 0, 160, 'UTF-8');
        $price = $product['price'] ?? '';
        $currency = $product['currency'] ?? 'BGN';
        $image = $product['images'][0]['image'] ?? $product['images'][0]['url'] ?? '';
        $url   = $product['url'] ?? '';
        
        $tags = '';
        
        // Стандартни Open Graph (подобрени)
        $tags .= "\t\t<meta property=\"og:type\" content=\"product\" />\n";
        $tags .= "\t\t<meta property=\"product:price:amount\" content=\"{$price}\" />\n";
        $tags .= "\t\t<meta property=\"product:price:currency\" content=\"{$currency}\" />\n";
        
        if (isset($product['quantity']) && $product['quantity'] > 0) {
            $tags .= "\t\t<meta property=\"product:availability\" content=\"in stock\" />\n";
        }
        
        if (!empty($product['brand'])) {
            $tags .= "\t\t<meta property=\"product:brand\" content=\"{$this->escapeAttr($product['brand'])}\" />\n";
        }
        
        // AI-специфични мета тагове
        $tags .= "\n\t\t<!-- AI / GEO Optimization Meta Tags -->\n";
        $tags .= "\t\t<meta name=\"ai-content-type\" content=\"product\" />\n";
        $tags .= "\t\t<meta name=\"ai-summary\" content=\"{$this->escapeAttr($desc)}\" />\n";
        $tags .= "\t\t<meta name=\"ai-product-name\" content=\"{$this->escapeAttr($title)}\" />\n";
        $tags .= "\t\t<meta name=\"ai-product-price\" content=\"{$price} {$currency}\" />\n";
        
        if (!empty($product['category'])) {
            $tags .= "\t\t<meta name=\"ai-product-category\" content=\"{$this->escapeAttr($product['category'])}\" />\n";
        }
        
        return $tags;
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 4. LLMO CONTENT BLOCK – Microdata блок за AI
     * ─────────────────────────────────────────────────
     * Скрит семантичен HTML с microdata, четим от AI краулери.
     */
    public function generateLLMOBlock($product) {
        $title    = $product['title'] ?? '';
        $price    = $product['price'] ?? '';
        $currency = $product['currency'] ?? 'BGN';
        $brand    = $this->toStr($product['brand'] ?? '');
        $desc     = strip_tags($product['description'] ?? '');
        $desc     = mb_substr($desc, 0, 500, 'UTF-8');
        $in_stock = isset($product['quantity']) && $product['quantity'] > 0;
        $url      = $product['url'] ?? '';
        
        $html = '<div class="geo-product-summary" itemscope itemtype="https://schema.org/Product" style="display:none;" aria-hidden="true">';
        $html .= '<h2 itemprop="name">' . htmlspecialchars($title) . '</h2>';
        $html .= '<p itemprop="description">' . htmlspecialchars($desc) . '</p>';
        
        if (!empty($brand)) {
            $html .= '<span itemprop="brand" itemscope itemtype="https://schema.org/Brand">';
            $html .= '<meta itemprop="name" content="' . htmlspecialchars($brand) . '" />';
            $html .= '</span>';
        }
        
        $html .= '<div itemprop="offers" itemscope itemtype="https://schema.org/Offer">';
        $html .= '<meta itemprop="price" content="' . $price . '" />';
        $html .= '<meta itemprop="priceCurrency" content="' . $currency . '" />';
        $html .= '<meta itemprop="availability" content="' . ($in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock') . '" />';
        $html .= '<meta itemprop="url" content="' . htmlspecialchars($url) . '" />';
        $html .= '</div>';
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 5. BLOG POST GEO – за блог публикации
     * ─────────────────────────────────────────────────
     */
    public function generateBlogPostSchema($post) {
        $schema = [
            "@context"      => "https://schema.org",
            "@type"         => "Article",
            "headline"      => $post['title'] ?? '',
            "description"   => strip_tags($post['seo_description'] ?? $post['description'] ?? ''),
            "url"           => $post['url'] ?? '',
            "datePublished" => $post['date_created'] ?? date('Y-m-d'),
            "dateModified"  => $post['date_modified'] ?? $post['date_created'] ?? date('Y-m-d'),
            "author"        => [
                "@type" => "Organization",
                "name"  => $this->site_name
            ],
            "publisher"     => [
                "@type" => "Organization",
                "name"  => $this->site_name
            ],
            "mainEntityOfPage" => [
                "@type" => "WebPage",
                "@id"   => $post['url'] ?? ''
            ]
        ];
        
        if (!empty($post['images'][0])) {
            $schema['image'] = $post['images'][0]['url'] ?? '';
        }
        
        if (!empty($post['tags'])) {
            $schema['keywords'] = $post['tags'];
        }
        
        return '<script type="application/ld+json">' . 
               json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . 
               '</script>';
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 6. ПЪЛЕН GEO ПАКЕТ – всичко заедно за продукт
     * ─────────────────────────────────────────────────
     */
    public function generateFullProductGEO($product) {
        $output = '';
        
        // JSON-LD Product Schema
        $output .= "\t\t" . $this->generateProductSchema($product) . "\n";
        
        // FAQ Schema + HTML
        $faq = $this->generateProductFAQ($product);
        $output .= "\t\t" . $faq['schema'] . "\n";
        
        // GEO Meta Tags
        $output .= $this->generateGeoMetaTags($product);
        
        // LLMO hidden block (body, не head)
        $llmo = $this->generateLLMOBlock($product);
        
        return [
            'head_tags'  => $output,
            'body_block' => $llmo,
            'faq_html'   => $faq['html'],
            'faq_data'   => $faq['faqs']
        ];
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 7. HEAD TAGS – автоматично за текущата страница
     * ─────────────────────────────────────────────────
     * Извиква се от header.php ПРЕДИ затварящия </head> таг.
     * Разпознава типа страница и добавя правилните schema-и.
     * 
     * Използване в header.php:
     *   $geo = new GeoOptimizer();
     *   $geo->headTags();
     */
    public function headTags() {
        global $page;
        
        // ── ПРОДУКТОВА СТРАНИЦА ──
        if ($page->type === 'product' && $page->target_id > 0) {
            $product = Api::cache(true)->id($page->target_id)->get()->products();
            
            if (!empty($product)) {
                $result = $this->generateFullProductGEO($product);
                echo $result['head_tags'];
            }
        }
        
        // ── БЛОГ ПУБЛИКАЦИЯ ──
        elseif ($page->type === 'post' && $page->target_id > 0) {
            $post = Api::cache(true)->id($page->target_id)->get()->blogPosts();
            
            if (!empty($post)) {
                echo $this->generateBlogPostSchema($post);
            }
        }
        
        // ── НАЧАЛНА СТРАНИЦА ──
        elseif ($page->slug === 'home' || $page->slug === 'index') {
            echo $this->generateOrganizationSchema();
        }
        
        // ── КАТЕГОРИЯ / СПИСЪК ПРОДУКТИ ──
        elseif ($page->slug === 'products') {
            echo $this->generateCollectionSchema();
        }
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 8. ORGANIZATION SCHEMA – начална страница
     * ─────────────────────────────────────────────────
     */
    public function generateOrganizationSchema() {
        $schema = [
            "@context" => "https://schema.org",
            "@type"    => "Organization",
            "name"     => $this->site_name,
            "url"      => $this->site_url,
            "logo"     => $GLOBALS['core']->web['logo'] ?? '',
        ];
        
        return '<script type="application/ld+json">' . 
               json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . 
               '</script>';
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 9. COLLECTION SCHEMA – категория / списък продукти
     * ─────────────────────────────────────────────────
     */
    public function generateCollectionSchema() {
        global $page;
        
        $schema = [
            "@context" => "https://schema.org",
            "@type"    => "CollectionPage",
            "name"     => $page->seo_title ?: $this->t('products') . " - {$this->site_name}",
            "url"      => $this->site_url . $_SERVER['REQUEST_URI'],
        ];
        
        return '<script type="application/ld+json">' . 
               json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . 
               '</script>';
    }
    
    /**
     * ─────────────────────────────────────────────────
     * 10. PRODUCT FAQ HTML – по product_id
     * ─────────────────────────────────────────────────
     * Връща готов Alpine.js FAQ акордеон HTML.
     * 
     * Използване:
     *   $geo = new GeoOptimizer();
     *   echo $geo->productFaqHtml(123);
     */
    public function productFaqHtml($product_id) {
        $product = Api::cache(true)->id($product_id)->get()->products();
        
        if (empty($product)) return '';
        
        $faq = $this->generateProductFAQ($product);
        return $faq['html'];
    }
    
    // ── Помощни функции ──
    
    private function renderFAQHtml($faqs) {
        $html = '<div class="geo-faq-section" x-data="{ openFaq: null }">';
        $html .= '<h2 class="text-xl font-bold mb-4">' . $this->t('faq_title') . '</h2>';
        
        foreach ($faqs as $i => $faq) {
            $html .= '<div class="faq-item border-b">';
            $html .= '<button @click="openFaq = openFaq === ' . $i . ' ? null : ' . $i . '" ';
            $html .= 'class="faq-question w-full text-left p-4 font-semibold flex justify-between items-center">';
            $html .= '<span>' . htmlspecialchars($faq['q']) . '</span>';
            $html .= '<span x-text="openFaq === ' . $i . ' ? \'−\' : \'+\'">+</span>';
            $html .= '</button>';
            $html .= '<div x-show="openFaq === ' . $i . '" x-transition class="faq-answer p-4 text-gray-600">';
            $html .= '<p>' . htmlspecialchars($faq['a']) . '</p>';
            $html .= '</div>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        return $html;
    }
    
    private function escapeAttr($val) {
        return htmlspecialchars($this->toStr($val), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Безопасно извлича string от стойност, която може
     * да е string, array (['name'=>'...']) или null.
     */
    private function toStr($val) {
        if (is_string($val)) return $val;
        if (is_array($val))  return $val['name'] ?? $val['title'] ?? reset($val) ?? '';
        return (string) $val;
    }
}