<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){
    http_response_code(405);exit;
}
pp_require_login();
pp_start();
$csrf=$_SERVER['HTTP_X_PP_CSRF']??'';
$id=(int)($_SESSION['pp_pizzeria']['id']??0);
$valid=is_string($csrf)&&
    hash_equals(pp_csrf(),$csrf)&&$id>0;
session_write_close();
if(!$valid){http_response_code(403);exit;}
$raw=file_get_contents('php://input',false,null,0,256);
$data=json_decode((string)$raw,true);
$state=is_array($data)?($data['state']??''):'';
$allowed=[
    'connecting','connected','subscribed',
    'disconnected','connect_error','connect_error_polling','connect_error_websocket','connect_error_timeout','connect_error_rejected','connect_error_other',
    'ack_rejected','config_failed','stopped'
];
if(!is_string($state)||!in_array($state,$allowed,true)){
    http_response_code(400);exit;
}
$file=dirname(__DIR__).'/private_data/socket-status-v1768.json';
@file_put_contents($file,json_encode([
    'at'=>date('c'),
    'branch'=>$id,
    'state'=>$state
]),LOCK_EX);
@chmod($file,0600);

/* PP1768_SOCKET_HISTORY_V1 */
$entry=json_encode([
    'at'=>date('c'),
    'source'=>'browser',
    'branch'=>$id,
    'state'=>$state
],JSON_UNESCAPED_UNICODE);
if(is_string($entry)){
    $log=dirname(__DIR__).'/private_data/socket-events-v1768.jsonl';
    @file_put_contents($log,$entry.PHP_EOL,FILE_APPEND|LOCK_EX);
    @chmod($log,0600);
}

echo '{"ok":true}';
