<?php
/** Retired v16.9 shift-operator module. No data is deleted. */
declare(strict_types=1);
http_response_code(410);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode(['ok'=>false,'error'=>'module_retired']);
