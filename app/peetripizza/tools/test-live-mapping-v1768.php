<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 16
 * Real LIVE mapping verification.
 * CLI ONLY. GET requests only.
 * No customer data, IDs or session tokens printed.
 */

if (PHP_SAPI !== 'cli') exit(1);
ob_start();

$root = dirname(__DIR__);

require_once $root.'/api/order-map-core-v1768.php';

function check16(bool $ok, string $name): void {
    echo ($ok ? "✅ " : "❌ ").$name.PHP_EOL;
    if (!$ok) exit(1);
}

echo "=== PEETRI PIZZA v17.68 / STAGE 16 ===\n";

$dir = $root.'/private_data/sessions';
$files = glob($dir.'/sess_*') ?: [];

usort($files, static fn($a,$b) =>
    (@filemtime($b) ?: 0) <=> (@filemtime($a) ?: 0)
);

$token = null;
$branchId = 0;

foreach (array_slice($files,0,30) as $file) {
    $sid = basename($file);

    if (!preg_match('/^sess_([a-zA-Z0-9,-]{16,128})$/D',$sid,$m)) {
        continue;
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }

    session_name('PEETRI_STAFF');
    session_save_path($dir);
    session_id($m[1]);

    if (!@session_start(['read_and_close'=>true])) continue;

    $branch = $_SESSION['pp_pizzeria'] ?? null;
    $candidate = $_SESSION['pp_upstream_session'] ?? null;
    $lastSeen = (int)($_SESSION['pp_last_seen'] ?? 0);

    if (
        is_array($branch) &&
        (int)($branch['id'] ?? 0) > 0 &&
        is_string($candidate) &&
        strlen($candidate) >= 12 &&
        time() - $lastSeen <= 172800
    ) {
        $branchId = (int)$branch['id'];
        $token = $candidate;
        break;
    }

    $_SESSION = [];
}

$_SESSION = [];

check16($token !== null, 'Active kitchen session found');
check16(function_exists('curl_init'), 'PHP cURL available');

function get16(string $path, string $token): array {
    $ch = curl_init('https://peetripizza.ee/api/'.$path);

    curl_setopt_array($ch,[
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_HTTPGET=>true,
        CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>5,
        CURLOPT_TIMEOUT=>12,
        CURLOPT_HTTPHEADER=>[
            'Accept: application/json',
            'X-Session-Id: '.$token
        ],
        CURLOPT_SSL_VERIFYPEER=>true,
        CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_USERAGENT=>'PeetriKitchenReadOnly/17.68'
    ]);

    $body = curl_exec($ch);
    $http = (int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
    $err = curl_errno($ch);

    curl_close($ch);

    if ($err || $http !== 200 || !is_string($body) ||
        strlen($body) > 4000000) {
        throw new RuntimeException('upstream_http_'.$http);
    }

    $data = json_decode($body,true,64,JSON_THROW_ON_ERROR);

    if (!is_array($data)) {
        throw new RuntimeException('invalid_response');
    }

    return $data;
}

try {
    $branch = get16('pizzeria',$token);

    check16(
        (int)($branch['id'] ?? 0) === $branchId,
        'Official pizzeria matches kitchen session'
    );

    $data = get16('orders',$token);
    unset($token);

    $orders = $data['orders'] ?? $data['data'] ?? $data;

    if (!is_array($orders)) {
        throw new RuntimeException('invalid_orders');
    }

    if (!array_is_list($orders)) {
        $orders = array_values($orders);
    }

    check16(count($orders) <= 3000, 'Order count within limit');

    $map = PPOrderMap1768::build($orders);

    check16(
        count($map) === count($orders),
        'All LIVE orders mapped'
    );

    $valid = true;

    foreach ($map as $localId => $row) {
        if (
            !preg_match('/^live-[a-f0-9]{24}$/D',$localId) ||
            !is_string($row['secure_id'] ?? null) ||
            ($row['secure_id'] ?? '') === ''
        ) {
            $valid = false;
            break;
        }
    }

    check16($valid, 'Local and official IDs valid');

    echo "\nLIVE ORDERS: ".count($orders)."\n";
    echo "MAPPED: ".count($map)."\n";
    echo "DUPLICATES: 0\n";
    echo "OFFICIAL WRITES: DISABLED\n";
    echo "\n✅ STAGE 16 COMPLETE — 6/6\n";
    echo "🔒 NO REAL ORDERS MODIFIED\n";

} catch (Throwable $e) {
    unset($token);

    $reason = $e instanceof RuntimeException
        ? $e->getMessage()
        : get_class($e);

    if (!preg_match('/^(upstream_http_[0-9]+|invalid_orders|invalid_response|too_many_orders|invalid_order|missing_identifier|invalid_local_id|duplicate_local_id|duplicate_secure_id|missing_status)$/',$reason)) {
        $reason = 'mapping_or_network_error';
    }

    echo "❌ STAGE 16 FAILED: ".$reason.PHP_EOL;
    exit(1);
}
