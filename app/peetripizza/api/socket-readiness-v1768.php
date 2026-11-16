<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 40
 * Authenticated, read-only WebSocket readiness.
 * Never returns session tokens or websocket_key.
 */

require_once dirname(__DIR__).'/auth/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function reply40(int $status, array $data): never {
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    reply40(405, [
        'ok' => false,
        'error' => 'method_not_allowed'
    ]);
}

pp_require_login();
pp_start();

$branch = $_SESSION['pp_pizzeria'] ?? null;
$token = $_SESSION['pp_upstream_session'] ?? null;

$branchId = is_array($branch)
    ? (int)($branch['id'] ?? 0)
    : 0;

session_write_close();

if (
    $branchId < 1 ||
    !is_string($token) ||
    strlen($token) < 12
) {
    reply40(401, [
        'ok' => false,
        'error' => 'kitchen_session_required'
    ]);
}

if (!function_exists('curl_init')) {
    reply40(503, [
        'ok' => false,
        'error' => 'curl_unavailable'
    ]);
}

function upstream40(string $endpoint, string $token): array {
    $ch = curl_init(
        'https://peetripizza.ee/api/'.$endpoint
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
    $status = (int)curl_getinfo(
        $ch, CURLINFO_RESPONSE_CODE
    );
    $error = curl_errno($ch);

    curl_close($ch);

    if (
        $error ||
        $status !== 200 ||
        !is_string($body) ||
        strlen($body) > 500000
    ) {
        throw new RuntimeException('upstream_failed');
    }

    $data = json_decode(
        $body, true, 32, JSON_THROW_ON_ERROR
    );

    if (!is_array($data)) {
        throw new RuntimeException('invalid_response');
    }

    return $data;
}

try {
    $official = upstream40('pizzeria', $token);
    $ping = upstream40('ping', $token);

    unset($token);

    $officialId = (int)($official['id'] ?? 0);

    if ($officialId !== $branchId) {
        reply40(403, [
            'ok' => false,
            'error' => 'branch_mismatch'
        ]);
    }

    $key = $official['websocket_key'] ?? null;
    $url = $ping['websocketUrl'] ?? null;

    $keyPresent = is_string($key) &&
        trim($key) !== '';

    $urlPresent = is_string($url) &&
        trim($url) !== '';

    $urlApproved = false;

    if (
        $urlPresent &&
        strlen($url) <= 2048 &&
        !preg_match('/[\x00-\x20\x7f]/', $url)
    ) {
        $parts = parse_url($url);

        if (is_array($parts)) {
            $scheme = strtolower(
                $parts['scheme'] ?? ''
            );

            $host = strtolower(
                rtrim($parts['host'] ?? '', '.')
            );

            $hostApproved =
                $host === 'peetripizza.ee' ||
                str_ends_with(
                    $host, '.peetripizza.ee'
                );

            $urlApproved =
                in_array(
                    $scheme, ['https', 'wss'], true
                ) &&
                $hostApproved &&
                !isset($parts['user']) &&
                !isset($parts['pass']) &&
                !isset($parts['fragment']) &&
                !isset($parts['query']) &&
                (!isset($parts['port']) ||
                    (int)$parts['port'] === 443);
        }
    }

    unset($key, $official, $ping, $url);

    reply40(200, [
        'ok' => true,
        'stage' => 40,
        'branch_verified' => true,
        'websocket_key_present' => $keyPresent,
        'websocket_url_present' => $urlPresent,
        'websocket_url_approved' => $urlApproved,
        'socket_connected' => false,
        'subscription_confirmed' => false,
        'official_writes_enabled' => false
    ]);

} catch (Throwable $e) {
    unset($token);

    reply40(502, [
        'ok' => false,
        'error' => 'upstream_verification_failed'
    ]);
}
