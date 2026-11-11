<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function pp168_reply(int $http,array $payload): never {http_response_code($http);echo json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
if(($_SERVER['REQUEST_METHOD']??'')!=='GET')pp168_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
$loc=$_SESSION['pp_pizzeria']??null;
$id=is_array($loc)?filter_var($loc['id']??null,FILTER_VALIDATE_INT):false;
if(!$id||$id<1)pp168_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$order=$_GET['order']??'';
if(!is_string($order)||($order!==''&&!preg_match('/^live-[a-f0-9]{24}$/D',$order)))pp168_reply(422,['ok'=>false,'error'=>'invalid_filter']);
$limit=filter_var($_GET['limit']??50,FILTER_VALIDATE_INT);
$limit=$limit?max(1,min(500,$limit)):50;
$file=dirname(__DIR__).'/private_data/internal-status-'.$id.'.json';
$lockfile=dirname(__DIR__).'/private_data/internal-status-'.$id.'.lock';
if(!is_file($file))pp168_reply(200,['ok'=>true,'events'=>[],'scope'=>'internal_kitchen_only','verified_identity'=>false]);
$h=@fopen($lockfile,'c');if(!$h||!flock($h,LOCK_SH))pp168_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
try{
 $raw=@file_get_contents($file);
 if(!is_string($raw)||strlen($raw)>1200000)throw new RuntimeException('invalid_storage');
 $data=json_decode($raw,true);
 if(!is_array($data)||!is_array($data['events']??null))throw new RuntimeException('invalid_storage');
 $rows=[];
 foreach(array_reverse($data['events']) as $ev){
  if(!is_array($ev)||!is_string($ev['id']??null))continue;
  if($order!==''&&$ev['id']!==$order)continue;
  $rows[]=['order'=>(string)$ev['id'],'from'=>(string)($ev['from']??''),'to'=>(string)($ev['to']??''),'at'=>(string)($ev['at']??''),'actor'=>substr((string)($ev['actor']??'Köök'),0,80),'revision'=>(int)($ev['revision']??0)];
  if(count($rows)>=$limit)break;
 }
 pp168_reply(200,['ok'=>true,'events'=>$rows,'scope'=>'internal_kitchen_only','verified_identity'=>false]);
}catch(Throwable $e){error_log('[Peetri v16.8] Kitchen history read failed: '.get_class($e));pp168_reply(503,['ok'=>false,'error'=>'storage_unavailable']);}
finally{flock($h,LOCK_UN);fclose($h);}
