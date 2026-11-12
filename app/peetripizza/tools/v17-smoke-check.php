<?php
/** Peetri Pizza v17.2 — read-only local dependency/markup check. CLI only. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
$html = file_get_contents($root . '/dashboard.php');
if ($html === false) { fwrite(STDERR, "No dashboard.\n"); exit(2); }
$errors = [];
preg_match_all('~(?:src|href)=["\'](assets/[^"\']+\.(?:js|css)(?:\?[^"\']*)?)["\']~i', $html, $m);
$seen = [];
foreach ($m[1] as $uri) {
    $rel = explode('?', $uri, 2)[0];
    if (!is_file($root . '/' . $rel)) $errors[] = "Missing: $rel";
    if (isset($seen[$rel])) $errors[] = "Duplicate asset: $rel";
    $seen[$rel] = true;
}
foreach (['ordersPage','productsPage','statisticsPage','settingsPage'] as $id) {
    if (!str_contains($html, 'id="' . $id . '"')) $errors[] = "Missing page: $id";
}
if (!str_contains($html, 'pp170-booting') || !str_contains($html, 'boot-v170.js')) $errors[] = 'Missing first-paint guard';
if (!str_contains($html, 'page:not(.active)')) $errors[] = 'Missing inactive-page guard';
if (!str_contains($html, 'html.pp170-booting body>.shell{visibility:hidden')) $errors[] = 'Missing v17.1 header boot guard';
if (!str_contains($html, 'header-v171.js') || !str_contains($html, 'header-v171.css')) $errors[] = 'Missing v17.1 header shortcuts';
if (!str_contains($html, 'ui-v172.js') || !str_contains($html, 'ui-v172.css')) $errors[] = 'Missing v17.2 DEMO/LIVE switch and alignment layer';
if (!str_contains($html, 'ops-v174.js') || !str_contains($html, 'ops-v174.css')) $errors[] = 'Missing v17.4 kitchen reliability layer';
if (!is_file($root . '/api/client-log.php')) $errors[] = 'Missing v17.4 client error journal endpoint';
$login = file_get_contents($root . '/index.php') ?: '';
if (!str_contains($login, 'login-v175.js') || !is_file($root . '/assets/login-v175.js') || !is_file($root . '/assets/login-v175.css')) $errors[] = 'Missing v17.5 login page assets';
if (!str_contains($html, 'ops-v176.js') || !str_contains($html, 'ops-v176.css') || !is_file($root . '/sw.js') || !is_file($root . '/api/site-status.php')) $errors[] = 'Missing v17.6 layer (ops-v176, sw.js, site-status)';
if (!str_contains($html, 'card-v177.css') || !is_file($root . '/assets/card-v177.css')) $errors[] = 'Missing v17.7 order card layer';
if (!str_contains($html, 'ops-v178.css') || !is_file($root . '/assets/ops-v178.css')) $errors[] = 'Missing v17.8 layer';
if (!str_contains($html, 'ops-v179.js') || !is_file($root . '/assets/ops-v179.js')) $errors[] = 'Missing v17.9 layer';
if (!str_contains((string)@file_get_contents($root . '/assets/late-v1714.js'), 'ops-v1710.js') || !is_file($root . '/assets/ops-v1710.js') || !is_file($root . '/api/version.php')) $errors[] = 'Missing v17.10 layer';
if (!str_contains($html, 'ops-v1711.js') || !is_file($root . '/assets/ops-v1711.js')) $errors[] = 'Missing v17.11 layer';
if (!str_contains($html, 'ops-v1712.js') || !is_file($root . '/assets/ops-v1712.js') || !is_file($root . '/assets/dough-v1712.css')) $errors[] = 'Missing v17.12 layer';
if (!str_contains($html, 'card-v177.css?v=17.1') || !str_contains((string)@file_get_contents($root . '/assets/card-v177.css'), 'v17.14')) $errors[] = 'Missing v17.14 card styles';
foreach (['assets/ops-v1714.js','assets/late-v1714.js','assets/ops-v1714.css','assets/print-monitor-v1714.js','assets/dough-v1714.css','api/print-log.php','api/kitchen-analytics.php','assets/.htaccess'] as $f17) if (!is_file($root . '/' . $f17)) $errors[] = 'Missing v17.14 file ' . $f17;
if (!str_contains($html, 'late-v1714.js') || !str_contains((string)@file_get_contents($root . '/assets/late-v1714.js'), 'print-monitor-v1714.js')) $errors[] = 'Missing v17.14 layer';
if (!str_contains($html, 'kitchen-release-v1715.css') || !is_file($root . '/assets/kitchen-release-v1715.css') || !is_file($root . '/assets/ops-v1715.js')) $errors[] = 'Missing v17.15 layer';
foreach (['print-v169.js','operations-v168.js','health-v169.js'] as $f17) if (!str_contains((string)@file_get_contents($root . '/assets/late-v1714.js'), $f17) || !is_file($root . '/assets/' . $f17)) $errors[] = 'Late loader misses ' . $f17;
foreach (['assets/ops-v1716.js','assets/ops-v1716.css','api/backup.php','api/release.php'] as $f17) if (!is_file($root . '/' . $f17) || !str_contains((string)@file_get_contents($root . '/assets/late-v1714.js'), 'ops-v1716.js')) $errors[] = 'Missing v17.16 file ' . $f17;
if (!str_contains((string)@file_get_contents($root . '/assets/app-core-v141.js'), 'pp1717Mark') || !str_contains((string)@file_get_contents($root . '/assets/card-v177.css'), 'pp1717')) $errors[] = 'Missing v17.17 allergy marks';
if (!is_file($root . '/assets/ops-v1718.js') || !is_file($root . '/assets/ops-v1718.css') || !str_contains((string)@file_get_contents($root . '/assets/late-v1714.js'), 'ops-v1718.js')) $errors[] = 'Missing v17.18 layer';
if (!is_file($root . '/assets/ops-v1719.js') || !is_file($root . '/assets/ops-v1719.css') || !str_contains((string)@file_get_contents($root . '/assets/late-v1714.js'), 'ops-v1719.js')) $errors[] = 'Missing v17.19 layer';
echo "Peetri Pizza v17.19 local smoke check — " . count($seen) . " assets referenced\n";
if ($errors) { foreach ($errors as $error) echo "FAIL: $error\n"; exit(1); }
echo "OK: all referenced assets present, page IDs and boot guards found.\n";
echo "NOTE: not a test of upstream LIVE, real printer, or PHP session setup.\n";
