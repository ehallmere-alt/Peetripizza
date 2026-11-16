<?php
declare(strict_types=1);

/*
 * PEETRI PIZZA v17.68 — STAGE 18
 * Read-only audit of official fulfillment/status fields.
 * CLI ONLY. No customer data or identifiers printed.
 */

if (PHP_SAPI !== 'cli') exit(1);
ob_start();

$root = dirname(__DIR__);
$dir = $root.'/private_data/sessions';

function stop18(string $reason): never {
    ob_end_clean();
    echo "❌ STAGE 18: ".$reason.PHP_EOL;
    exit(1);
}

if (!is_dir($dir)) stop18('session_storage_missing');
if (!function_exists('curl_init')) stop18('curl_unavailable');

$files = glob($dir.'/sess_*') ?: [];

usort($files, static fn($a,$b) =>
    (@filemtime($b) ?: 0) <=> (@filemtime($a) ?: 0)
);

$token = null;
$branchId = 0;

session_name('PEETRI_STAFF');
session_save_path($dir);

foreach (array_slice($files,0,40) as $file) {
    if (!preg_match(
        '/^sess_([a-zA-Z0-9,-]{16,128})$/D',
        basename($file),
        $m
    )) continue;

    session_id($m[1]);

    if (!@session_start(['read_and_close'=>true])) {
        continue;
    }

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

if ($token === null) stop18('active_kitchen_session_not_found');

function get18(string $path,string $token): array {
    $h = curl_init('https://peetripizza.ee/api/'.$path);

    curl_setopt_array($h,[
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPGET => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'X-Session-Id: '.$token
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_USERAGENT => 'PeetriKitchenReadOnly/17.68'
    ]);

    $body = curl_exec($h);
    $http = (int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);
    $err = curl_errno($h);
    curl_close($h);

    if (
        $err ||
        $http !== 200 ||
        !is_string($body) ||
        strlen($body) > 4000000
    ) {
        throw new RuntimeException('upstream_unavailable');
    }

    $json = json_decode($body,true,64,JSON_THROW_ON_ERROR);

    if (!is_array($json)) {
        throw new RuntimeException('invalid_json');
    }

    return $json;
}

try {
    $branch = get18('pizzeria',$token);

    if ((int)($branch['id'] ?? 0) !== $branchId) {
        throw new RuntimeException('branch_mismatch');
    }

    $json = get18('orders',$token);
    unset($token);

    $orders = $json['orders'] ?? $json['data'] ?? $json;

    if (!is_array($orders)) {
        throw new RuntimeException('invalid_orders');
    }

    if (!array_is_list($orders)) {
        $orders = array_values($orders);
    }

    if (count($orders) > 3000) {
        throw new RuntimeException('too_many_orders');
    }

    $fields = [
        'serving',
        'servingType',
        'delivery_type',
        'deliveryType',
        'order_type',
        'orderType',
        'service_type',
        'fulfillment',
        'fulfillmentType'
    ];

    $statuses = [];
    $found = [];
    $unknown = 0;

    // Only predefined operational values may be displayed.
    $allowed = [
        'pickup','takeaway','take_away',
        'delivery','courier','transport',
        'kohapeal','kaasa','kuller',
        'restaurant','dinein','dine_in'
    ];

    foreach ($orders as $order) {
        if (!is_array($order)) continue;

        $status = $order['status'] ?? null;

        if (
            is_string($status) &&
            preg_match('/^[a-zA-Z]{2,25}$/D',$status)
        ) {
            $statuses[$status] = ($statuses[$status] ?? 0) + 1;
        } else {
            $statuses['unknown'] = ($statuses['unknown'] ?? 0) + 1;
        }

        $matched = false;

        foreach ($fields as $field) {
            if (!array_key_exists($field,$order)) continue;

            $matched = true;
            $value = $order[$field];

            if (!is_string($value)) {
                $label = 'non_string';
            } else {
                $normalized = strtolower(trim($value));
                $label = in_array($normalized,$allowed,true)
                    ? $normalized
                    : 'other_value';
            }

            $found[$field][$label] =
                ($found[$field][$label] ?? 0) + 1;
        }

        if (!$matched) $unknown++;
    }

    ksort($statuses);
    ksort($found);

    foreach ($found as &$values) ksort($values);
    unset($values);

    $result = [
        'ok' => true,
        'stage' => 18,
        'read_only' => true,
        'orders_checked' => count($orders),
        'official_statuses' => $statuses,
        'fulfillment_fields' => $found,
        'orders_without_known_fulfillment_field' => $unknown,
        'write_enabled' => false
    ];

    ob_end_clean();

    echo "=== PEETRI PIZZA v17.68 / STAGE 18 ===\n";
    echo json_encode(
        $result,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
    );
    echo "\n✅ STAGE 18 COMPLETE\n";
    echo "🔒 NO OFFICIAL ORDERS MODIFIED\n";

} catch (Throwable $e) {
    unset($token);
    stop18('read_or_schema_validation_failed');
}
