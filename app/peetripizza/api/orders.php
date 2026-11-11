<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
// The endpoint is disabled until approved service credentials are provisioned.
// Never allow this proxy to be publicly accessible in production without
// application authentication, authorization and tenant scoping.
$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'mode' => 'demo', 'message' => 'Integration is not configured.']);
    exit;
}
$config = require $configFile;
if (empty($config['enabled']) || empty($config['session_id'])) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'mode' => 'demo', 'message' => 'Integration is disabled.']);
    exit;
}
// Fail closed until application-level login and permission checks are implemented.
http_response_code(403);
echo json_encode(['ok' => false, 'message' => 'Protected integration endpoint: server authorization required.']);
