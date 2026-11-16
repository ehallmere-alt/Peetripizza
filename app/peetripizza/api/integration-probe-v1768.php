<?php
declare(strict_types=1);

require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405);
    exit(json_encode(['ok'=>false,'error'=>'method_not_allowed']));
}

pp_start();
$branch = $_SESSION['pp_pizzeria'] ?? null;
$session = $_SESSION['pp_upstream_session'] ?? null;

if (!is_array($branch) || (int)($branch['id'] ?? 0) < 1 ||
    !is_string($session) || strlen($session) < 12) {
    http_response_code(401);
    exit(json_encode(['ok'=>false,'error'=>'upstream_login_required']));
}

session_write_close();

if (!function_exists('curl_init')) {
    http_response_code(503);
    exit(json_encode(['ok'=>false,'error'=>'curl_unavailable']));
}

$checks = [
    'orders'   => 'orders',
    'branch'   => 'pizzeria',
    'dough'    => 'internal-orders/todays-orders',
    'toppings' => 'toppings',
    'products' => 'simple-products',
    'realtime' => 'ping'
];

$results = [];

foreach ($checks as $module => $path) {
    $curl = curl_init('https://peetripizza.ee/api/'.$path);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'X-Session-Id: '.$session
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);

    $body = curl_exec($curl);
    $http = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_errno($curl);
    curl_close($curl);

    $valid = !$error && $http === 200 &&
        is_string($body) && is_array(json_decode($body, true));

    $results[$module] = [
        'connected' => $valid,
        'http' => $http
    ];
}

echo json_encode([
    'ok' => true,
    'version' => '17.68-stage2',
    'read_only' => true,
    'bonuses' => 'authorization_not_verified',
    'checks' => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
