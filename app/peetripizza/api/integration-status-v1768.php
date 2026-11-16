<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
if (($_SERVER['REQUEST_METHOD']??'')!=='GET') {
    http_response_code(405);
    exit(json_encode(['ok'=>false,'error'=>'method_not_allowed']));
}
pp_start();
$p=$_SESSION['pp_pizzeria']??null;
if (!is_array($p) || (int)($p['id']??0)<1) {
    http_response_code(403);
    exit(json_encode(['ok'=>false,'error'=>'pizzeria_required']));
}
$root=dirname(__DIR__);
$modules=[
    'orders'=>['api/live.php'],
    'realtime'=>['api/live.php'],
    'dough'=>['api/dough-site.php'],
    'products'=>['api/site-status.php'],
    'bonuses'=>[],
    'health'=>['api/system-health.php','api/live-health.php']
];
$result=[];
foreach ($modules as $name=>$files) {
    $available=count($files)>0;
    foreach ($files as $file) {
        if (!is_file($root.'/'.$file)) $available=false;
    }
    $result[$name]=[
        'existing_read_support'=>$available,
        'official_write_enabled'=>false
    ];
}
echo json_encode([
    'ok'=>true,
    'version'=>'17.68-stage1',
    'base'=>'17.67',
    'read_only'=>true,
    'official_permissions_verified'=>false,
    'modules'=>$result
],JSON_PRETTY_PRINT);
