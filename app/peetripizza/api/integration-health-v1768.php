<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 14
 * Authenticated read-only integration health.
 * No official writes or customer data in responses.
 */

require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function pp1768_health_reply(int $code, array $body): never {
    http_response_code($code);
    echo json_encode(
        $body,
        JSON_UNESCAPED_UNICODE |
        JSON_PRETTY_PRINT |
        JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    pp1768_health_reply(405, [
        'ok'=>false,
        'error'=>'method_not_allowed'
    ]);
}

if (!is_file(__DIR__.'/upstream-read-v1768.php')) {
    pp1768_health_reply(503, [
        'ok'=>false,
        'error'=>'stage13_adapter_missing'
    ]);
}

require_once __DIR__.'/upstream-read-v1768.php';

pp_start();

$branch = $_SESSION['pp_pizzeria'] ?? null;
$token = $_SESSION['pp_upstream_session'] ?? null;

if (
    !is_array($branch) ||
    (int)($branch['id'] ?? 0) < 1 ||
    !is_string($token) ||
    strlen($token) < 12
) {
    pp1768_health_reply(401, [
        'ok'=>false,
        'error'=>'upstream_login_required'
    ]);
}

$branchId = (int)$branch['id'];
session_write_close();

$modules = [
    'orders',
    'branch',
    'dough',
    'products',
    'toppings',
    'realtime'
];

$result = [];

try {
    $api = new PPUpstreamRead1768($token, $branchId);
    unset($token);

    foreach ($modules as $module) {
        try {
            $data = $api->get($module);

            $result[$module] = [
                'connected'=>true,
                'status'=>'ok'
            ];

            if ($module === 'orders') {
                $orders = $data['orders']
                    ?? $data['data']
                    ?? $data;

                if (is_array($orders)) {
                    $result[$module]['count'] = count($orders);
                }
            }

        } catch (Throwable $e) {
            $safeErrors = [
                'session_expired',
                'permission_denied',
                'rate_limited',
                'upstream_unavailable',
                'invalid_upstream_json',
                'branch_mismatch',
                'curl_unavailable'
            ];

            $reason = $e->getMessage();

            $result[$module] = [
                'connected'=>false,
                'status'=>in_array($reason, $safeErrors, true)
                    ? $reason
                    : 'integration_error'
            ];
        }
    }

} catch (Throwable $e) {
    pp1768_health_reply(503, [
        'ok'=>false,
        'error'=>'adapter_initialization_failed'
    ]);
}

$healthy = 0;

foreach ($result as $module) {
    if ($module['connected']) $healthy++;
}

pp1768_health_reply(200, [
    'ok'=>true,
    'version'=>'17.68-stage14',
    'checks_passed'=>$healthy,
    'checks_total'=>count($modules),
    'read_only'=>true,
    'official_write_enabled'=>false,
    'bonuses'=>[
        'authorization_verified'=>false,
        'earn_enabled'=>false,
        'spend_enabled'=>false
    ],
    'modules'=>$result
]);
