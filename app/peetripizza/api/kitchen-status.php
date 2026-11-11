<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
function pp153_reply(int $status,array $body): never {http_response_code($status);echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
$tenant=$_SESSION['pp_pizzeria']??null;
$id=is_array($tenant)?filter_var($tenant['id']??null,FILTER_VALIDATE_INT):false;
if(!$id || $id<1) pp153_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$method=$_SERVER['REQUEST_METHOD']??'GET';
if(!in_array($method,['GET','POST'],true))pp153_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
if($method==='POST'&&!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))pp153_reply(403,['ok'=>false,'error'=>'invalid_csrf']);
if($method==='POST'&&(int)($_SERVER['CONTENT_LENGTH']??0)>4096)pp153_reply(413,['ok'=>false,'error'=>'body_too_large']);
if($method==='POST'&&!preg_match('~^application/json(?:\s*;|\s*$)~i',(string)($_SERVER['CONTENT_TYPE']??'')))pp153_reply(415,['ok'=>false,'error'=>'json_required']);
// This endpoint is NOT connected to peetripizza.ee. No upstream HTTP request is performed.
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp153_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$file=$dir.'/internal-status-'.$id.'.json';
$lockFile=$dir.'/internal-status-'.$id.'.lock';
$lock=@fopen($lockFile,'c');
if(!$lock||!flock($lock,$method==='POST'?LOCK_EX:LOCK_SH)){error_log('[Peetri v16.8] Kitchen state lock unavailable');pp153_reply(503,['ok'=>false,'error'=>'lock_unavailable']);}
$state=['records'=>[],'events'=>[]];
if(is_file($file)){
 $raw=@file_get_contents($file);
 $json=$raw!==false?json_decode($raw,true):null;
 if(!is_array($json)||!isset($json['records'])||!is_array($json['records'])) pp153_reply(503,['ok'=>false,'error'=>'storage_corrupt']);
 $state=['records'=>$json['records'],'events'=>is_array($json['events']??null)?$json['events']:[]];
}
if($method==='GET')pp153_reply(200,['ok'=>true,'records'=>(object)$state['records'],'scope'=>'internal_kitchen_only']);
$payload=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($payload))pp153_reply(422,['ok'=>false,'error'=>'invalid_json']);
$order=$payload['id']??null;$next=$payload['status']??null;$observed=$payload['official_status']??null;
$expected=$payload['expected_revision']??null;
if(!is_string($order)||!preg_match('/^live-[a-f0-9]{24}$/D',$order)||
 !in_array($next,['new','active','done'],true)||
 !in_array($observed,['new','active','done'],true)||
 !is_int($expected)||$expected<0) pp153_reply(422,['ok'=>false,'error'=>'invalid_input']);
$old=$state['records'][$order]??null;
$revision=is_array($old)?(int)($old['revision']??0):0;
if($revision!==$expected)pp153_reply(409,['ok'=>false,'error'=>'status_conflict','records'=>(object)$state['records']]);
$from=is_array($old)?($old['status']??$observed):$observed;
$allow=['new'=>['active'],'active'=>['new','done'],'done'=>['active']];
if(!in_array($next,$allow[$from]??[],true))pp153_reply(422,['ok'=>false,'error'=>'invalid_transition','current_status'=>$from]);
$time=(new DateTimeImmutable('now',new DateTimeZone('Europe/Tallinn')))->format(DATE_ATOM);
$actor=is_string($_SESSION['pp_staff']??null)?substr($_SESSION['pp_staff'],0,80):'Köök';
$rec=['status'=>$next,'revision'=>$revision+1,'changed_at'=>$time,'changed_by'=>$actor,'ready_at'=>$next==='done'?$time:($next==='active'?null:($old['ready_at']??null))];
$state['records'][$order]=$rec;
$state['events'][]=['event_id'=>bin2hex(random_bytes(8)),'id'=>$order,'from'=>$from,'to'=>$next,'at'=>$time,'actor'=>$actor,'revision'=>$revision+1,'source'=>'internal_kitchen'];
$state['events']=array_slice($state['events'],-400);
// Cap storage growth; oldest records removed first, leaving current work intact for normal workloads.
if(count($state['records'])>3000){uasort($state['records'],static fn($a,$b)=>strcmp((string)($a['changed_at']??''),(string)($b['changed_at']??'')));$state['records']=array_slice($state['records'],-2500,null,true);}
$json=json_encode($state,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
if($json===false)pp153_reply(503,['ok'=>false,'error'=>'encode_failed']);
$tmp=$file.'.'.bin2hex(random_bytes(8)).'.tmp';
if(file_put_contents($tmp,$json,LOCK_EX)===false||!rename($tmp,$file)){@unlink($tmp);error_log('[Peetri v16.8] Kitchen state save failed');pp153_reply(503,['ok'=>false,'error'=>'write_failed']);}
@chmod($file,0600);
pp153_reply(200,['ok'=>true,'record'=>$rec,'records'=>(object)$state['records'],'scope'=>'internal_kitchen_only']);
