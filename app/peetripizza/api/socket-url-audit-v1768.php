<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 43
 * Read-only WebSocket origin diagnostic.
 * No credentials or full URL in output.
 */

require_once dirname(__DIR__).'/auth/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function out43(int $code, array $data): never {
    http_response_code($code);
    echo json_encode(
        $data,
        JSON_PRETTY_PRINT |
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    out43(405, ['error'=>'method_not_allowed']);
}

pp_require_login();
pp_start();

$branch = $_SESSION['pp_pizzeria'] ?? null;
$token = $_SESSION['pp_upstream_session'] ?? null;
$id = is_array($branch) ? (int)($branch['id'] ?? 0) : 0;

session_write_close();

if ($id < 1 || !is_string($token) || strlen($token) < 12) {
    out43(401, ['error'=>'kitchen_session_required']);
}

if (!function_exists('curl_init')) {
    out43(503, ['error'=>'curl_unavailable']);
}

function get43(string $endpoint, string $token): array {
    $ch = curl_init(
        'https://peetripizza.ee/api/'.$endpoint
    );

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_HTTPGET=>true,
        CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>5,
        CURLOPT_TIMEOUT=>12,
        CURLOPT_SSL_VERIFYPEER=>true,
        CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_HTTPHEADER=>[
            'Accept: application/json',
            'X-Session-Id: '.$token
        ]
    ]);

    $body = curl_exec($ch);
    $http = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_errno($ch);
    curl_close($ch);

    if ($err || $http !== 200 ||
        !is_string($body) || strlen($body) > 500000) {
        throw new RuntimeException('upstream_failed');
    }

    $json = json_decode($body, true, 32, JSON_THROW_ON_ERROR);

    if (!is_array($json)) {
        throw new RuntimeException('invalid_response');
    }

    return $json;
}

try {
    $official = get43('pizzeria', $token);

    if ((int)($official['id'] ?? 0) !== $id) {
        out43(403, ['error'=>'branch_mismatch']);
    }

    $ping = get43('ping', $token);
    unset($token);

    $url = $ping['websocketUrl'] ?? null;

    if (!is_string($url) ||
        strlen($url) > 2048 ||
        trim($url) === '' ||
        preg_match('/[\x00-\x20\x7f]/', $url)) {
        out43(200, [
            'ok'=>false,
            'reason'=>'invalid_websocket_url'
        ]);
    }

    $parts = parse_url($url);

    if (!is_array($parts)) {
        out43(200, [
            'ok'=>false,
            'reason'=>'url_parse_failed'
        ]);
    }

    $scheme = strtolower($parts['scheme'] ?? '');
    $host = strtolower(rtrim($parts['host'] ?? '', '.'));
    $port = $parts['port'] ?? null;

    $secure = in_array($scheme, ['https','wss'], true);
    $hostApproved = $host === 'peetripizza.ee' ||
        str_ends_with($host, '.peetripizza.ee');

    $credentialFree =
        !isset($parts['user']) &&
        !isset($parts['pass']);

    $standardPort = $port === null || $port === 443;

    $reasons = [];

    if (!$secure) $reasons[] = 'protocol_not_secure';
    if (!$hostApproved) $reasons[] = 'host_not_in_allowlist';
    if (!$standardPort) $reasons[] = 'nonstandard_port';
    if (!$credentialFree) $reasons[] = 'embedded_credentials';
    if (isset($parts['query'])) $reasons[] = 'query_present';
    if (isset($parts['fragment'])) $reasons[] = 'fragment_present';

    // Only origin metadata is returned.
    unset($url, $official, $ping);

    out43(200, [
        'ok'=>true,
        'stage'=>43,
        'branch_verified'=>true,
        'websocket_scheme'=>$scheme,
        'websocket_host'=>$host,
        'websocket_port'=>$port ?? 'default',
        'custom_path_present'=>!empty($parts['path']) &&
            $parts['path'] !== '/',
        'query_present'=>isset($parts['query']),
        'host_in_allowlist'=>$hostApproved,
        'secure_protocol'=>$secure,
        'rejection_reasons'=>$reasons,
        'socket_connected'=>false,
        'official_writes'=>false
    ]);

} catch (Throwable $e) {
    unset($token);
    out43(502, ['error'=>'upstream_verification_failed']);
}
