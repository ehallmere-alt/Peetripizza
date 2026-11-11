<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
// Only publish low-sensitivity capability flags. No secrets, filenames, versions or upstream network access.
echo json_encode([
 'ok' => true,
 'mode' => 'demo',
 'php_ready' => true,
 'json_ready' => function_exists('json_encode'),
 'integration_enabled' => false,
 'live_orders_enabled' => false,
 'write_actions_enabled' => false,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
