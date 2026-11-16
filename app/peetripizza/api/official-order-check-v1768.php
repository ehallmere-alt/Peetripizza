<?php
declare(strict_types=1);

/*
 * Authenticated upstream GET + proposed transition.
 * Never sends PUT/POST to Peetri Pizza.
 */

require_once dirname(__DIR__).'/auth/bootstrap.php';
require_once __DIR__.'/official-order-preflight-v1768.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function reply1768(int $code, array $body): never {
    http_response_code($code);
    echo json_encode(
        $body,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply1768(405, [
        'ok' => false,
        'error' => 'method_not_allowed'
    ]);
}

pp_require_login();

if (!pp_csrf_valid(
    (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')
)) {
    reply1768(403, [
        'ok' => false,
        'error' => 'invalid_csrf'
    ]);
}

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 1024) {
    reply1768(413, [
        'ok' => false,
        'error' => 'body_too_large'
    ]);
}

if (!preg_match(
    '~^application/json(?:\s*;|\s*$)~i',
    (string)($_SERVER['CONTENT_TYPE'] ?? '')
)) {
    reply1768(415, [
        'ok' => false,
        'error' => 'json_required'
    ]);
}

$input = json_decode(
    (string)file_get_contents('php://input'),
    true
);

if (!is_array($input)) {
    reply1768(422, [
        'ok' => false,
        'error' => 'invalid_json'
    ]);
}

$localId = $input['id'] ?? null;
$action = $input['action'] ?? null;

if (!is_string($localId) ||
    !is_string($action) ||
    !preg_match('/^live-[a-f0-9]{24}$/D', $localId) ||
    !in_array($action, ['confirm', 'ready'], true)) {
    reply1768(422, [
        'ok' => false,
        'error' => 'invalid_input'
    ]);
}

pp_start();

$branch = $_SESSION['pp_pizzeria'] ?? null;
$token = $_SESSION['pp_upstream_session'] ?? null;

$branchId = is_array($branch)
    ? (int)($branch['id'] ?? 0)
    : 0;

session_write_close();

if ($branchId < 1 ||
    !is_string($token) ||
    strlen($token) < 12) {
    reply1768(401, [
        'ok' => false,
        'error' => 'kitchen_session_required'
    ]);
}

if (!function_exists('curl_init')) {
    reply1768(503, [
        'ok' => false,
        'error' => 'curl_unavailable'
    ]);
}

function read1768(string $path, string $token): array
{
    $ch = curl_init(
        'https://peetripizza.ee/api/'.$path
    );

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'X-Session-Id: '.$token
        ]
    ]);

    $body = curl_exec($ch);
    $http = (int)curl_getinfo(
        $ch,
        CURLINFO_RESPONSE_CODE
    );
    $error = curl_errno($ch);

    curl_close($ch);

    if ($error ||
        $http !== 200 ||
        !is_string($body) ||
        strlen($body) > 4000000) {
        throw new RuntimeException('upstream_unavailable');
    }

    $data = json_decode(
        $body,
        true,
        64,
        JSON_THROW_ON_ERROR
    );

    if (!is_array($data)) {
        throw new RuntimeException('invalid_response');
    }

    return $data;
}

try {
    $officialBranch = read1768('pizzeria', $token);

    if ((int)($officialBranch['id'] ?? 0) !== $branchId) {
        reply1768(403, [
            'ok' => false,
            'error' => 'branch_mismatch'
        ]);
    }

    $data = read1768('orders', $token);
    unset($token);

    $orders = $data['orders']
        ?? $data['data']
        ?? $data;

    if (!is_array($orders)) {
        throw new RuntimeException('invalid_orders');
    }

    if (!array_is_list($orders)) {
        $orders = array_values($orders);
    }

    if (count($orders) > 3000) {
        throw new RuntimeException('too_many_orders');
    }

    $result = PP1768OfficialPreflight::check(
        $orders,
        $localId,
        $action
    );


    // PP1768_STATUS_AUDIT_V2
    // No customer data, order IDs or tokens logged.
    $state = $result['ok']
        ? 'eligible'
        : (string)($result['reason'] ?? 'unknown');

    $allowed = [
        'eligible','status_conflict','unknown_serving',
        'secure_id_missing','order_not_found',
        'ambiguous_order','invalid_order_schema',
        'invalid_local_id','unsupported_action'
    ];

    if (!in_array($state,$allowed,true)) {
        $state='unknown';
    }

    $line=json_encode([
        'at'=>date('c'),
        'action'=>$action,
        'result'=>$state,
        'official_write'=>false
    ],JSON_UNESCAPED_UNICODE);

    if (is_string($line)) {
        $log=dirname(__DIR__).
            '/private_data/official-status-audit-v1768.jsonl';
        @file_put_contents(
            $log,$line.PHP_EOL,FILE_APPEND|LOCK_EX
        );
        @chmod($log,0600);
    }


    // PP1768_AUTO_READONLY_AUDIT
    // Only operational outcome. No order IDs or personal data.
    $reason = $result['ok']
        ? 'eligible'
        : (string)($result['reason'] ?? 'unknown');

    if (!preg_match('/^[a-z_]{1,40}$/D', $reason)) {
        $reason = 'unknown';
    }

    $line = json_encode([
        'at' => date('c'),
        'action' => $action,
        'result' => $reason,
        'official_write' => false
    ]);

    if (is_string($line)) {
        $file = dirname(__DIR__).
            '/private_data/official-readonly-v1768.jsonl';

        @file_put_contents(
            $file,
            $line.PHP_EOL,
            FILE_APPEND | LOCK_EX
        );

        @chmod($file, 0600);
    }

    reply1768($result['ok'] ? 200 : 409, $result);



} catch (Throwable $e) {
    unset($token);

    reply1768(502, [
        'ok' => false,
        'error' => 'upstream_verification_failed',
        'write_enabled' => false
    ]);
}
