<?php
declare(strict_types=1);

require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    reply(405, ['ok'=>false,'error'=>'method_not_allowed']);
}

pp_start();
$branch = $_SESSION['pp_pizzeria'] ?? null;
$token = $_SESSION['pp_upstream_session'] ?? null;

if (!is_array($branch) || (int)($branch['id'] ?? 0) < 1 ||
    !is_string($token) || strlen($token) < 12) {
    reply(401, ['ok'=>false,'error'=>'login_required']);
}

if (!function_exists('curl_init')) {
    reply(503, ['ok'=>false,'error'=>'curl_unavailable']);
}

session_write_close();

$h = curl_init('https://peetripizza.ee/api/orders');
curl_setopt_array($h, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'X-Session-Id: '.$token
    ],
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2
]);

$body = curl_exec($h);
$http = (int)curl_getinfo($h, CURLINFO_RESPONSE_CODE);
$error = curl_errno($h);
curl_close($h);
unset($token);

if ($error || $http !== 200 || !is_string($body) ||
    strlen($body) > 4000000) {
    reply(502, [
        'ok'=>false,
        'error'=>'upstream_unavailable',
        'http'=>$http
    ]);
}

$data = json_decode($body, true);

if (!is_array($data)) {
    reply(502, ['ok'=>false,'error'=>'invalid_json']);
}

$orders = $data['orders'] ?? $data['data'] ?? $data;

if (!is_array($orders)) {
    reply(502, ['ok'=>false,'error'=>'invalid_orders']);
}

if (!array_is_list($orders)) {
    $orders = array_values($orders);
}

if (count($orders) > 3000) {
    reply(502, ['ok'=>false,'error'=>'too_many_orders']);
}

$stats = [
    'total'=>0,
    'secure_id_present'=>0,
    'native_id_present'=>0,
    'public_number_present'=>0,
    'missing_secure_id'=>0,
    'duplicate_secure_id'=>0,
    'statuses'=>[]
];

$seen = [];

foreach ($orders as $order) {
    if (!is_array($order)) continue;

    $stats['total']++;

    $secure = $order['secure_id'] ?? $order['secureId'] ?? null;
    $native = $order['id'] ?? $order['orderId'] ?? null;
    $number = $order['order_number'] ?? $order['number'] ?? null;

    if (is_scalar($secure) && (string)$secure !== '') {
        $stats['secure_id_present']++;
        $hash = hash('sha256', (string)$secure);

        if (isset($seen[$hash])) {
            $stats['duplicate_secure_id']++;
        }
        $seen[$hash] = true;
    } else {
        $stats['missing_secure_id']++;
    }

    if (is_scalar($native) && (string)$native !== '') {
        $stats['native_id_present']++;
    }

    if (is_scalar($number) && (string)$number !== '') {
        $stats['public_number_present']++;
    }

    $status = strtolower((string)($order['status'] ?? $order['state'] ?? 'unknown'));

    if (!preg_match('/^[a-z_]{1,30}$/', $status)) {
        $status = 'other';
    }

    $stats['statuses'][$status] =
        ($stats['statuses'][$status] ?? 0) + 1;
}

ksort($stats['statuses']);

reply(200, [
    'ok'=>true,
    'version'=>'17.68-stage3',
    'read_only'=>true,
    'orders'=>$stats,
    'write_ready'=>false,
    'note'=>'No customer data or order IDs returned'
]);
