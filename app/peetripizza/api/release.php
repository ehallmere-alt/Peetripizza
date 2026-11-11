<?php
declare(strict_types=1);
// v17.16: tiny "which version is installed on the server" answer for the tablet's self-update check.
// Reads only the release meta from dashboard.php. No orders, no files list, no GitHub. Login required.
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
if(($_SERVER['REQUEST_METHOD']??'')!=='GET'){http_response_code(405);echo '{"ok":false,"error":"method_not_allowed"}';exit;}
$html=@file_get_contents(dirname(__DIR__).'/dashboard.php',false,null,0,4096);
$version=(is_string($html)&&preg_match('/name="peetri-release" content="([0-9]+(?:\.[0-9]+){1,3})"/',$html,$m))?$m[1]:'';
echo json_encode(['ok'=>$version!=='','version'=>$version]);
