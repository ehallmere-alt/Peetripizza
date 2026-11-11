<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out(int $code, array $data): never { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
$loc=$_SESSION['pp_pizzeria']??null;
$id=is_array($loc)?(int)($loc['id']??0):0;
if($id<1)out(403,['ok'=>false,'error'=>'pizzeria_required']);
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))out(503,['ok'=>false,'error'=>'storage_unavailable']);
$lock=@fopen($dir.'/wait-'.$id.'.lock','c');
if(!$lock||!flock($lock,LOCK_EX))out(503,['ok'=>false,'error'=>'storage_unavailable']);
$file=$dir.'/wait-'.$id.'.json';
$record=['minutes'=>20,'updated_at'=>null];
if(is_file($file)){
 $json=json_decode((string)@file_get_contents($file),true);
 if(is_array($json)&&in_array($json['minutes']??null,[15,20,30,45,60],true))$record=$json;
}
if($_SERVER['REQUEST_METHOD']==='GET')out(200,['ok'=>true]+$record);
if($_SERVER['REQUEST_METHOD']!=='POST')out(405,['ok'=>false,'error'=>'method_not_allowed']);
if(!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))out(403,['ok'=>false,'error'=>'invalid_csrf']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>1024)out(413,['ok'=>false,'error'=>'too_large']);
$input=json_decode((string)file_get_contents('php://input'),true);
$minutes=$input['minutes']??null;
if(!is_int($minutes)||!in_array($minutes,[15,20,30,45,60],true))out(422,['ok'=>false,'error'=>'invalid_minutes']);
$record=['minutes'=>$minutes,'updated_at'=>date(DATE_ATOM)];
$tmp=@tempnam($dir,'wait-tmp-');
if(!$tmp||@file_put_contents($tmp,json_encode($record,JSON_UNESCAPED_UNICODE))===false||!@rename($tmp,$file)){
 if($tmp)@unlink($tmp);out(503,['ok'=>false,'error'=>'storage_unavailable']);
}
@chmod($file,0600);
out(200,['ok'=>true]+$record);
