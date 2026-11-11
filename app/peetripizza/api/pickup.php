<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
function pp154_pickup_reply(int $code,array $body): never {http_response_code($code);echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
$loc=$_SESSION['pp_pizzeria']??null;
$id=is_array($loc)?filter_var($loc['id']??null,FILTER_VALIDATE_INT):false;
if(!$id||$id<1)pp154_pickup_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$method=$_SERVER['REQUEST_METHOD']??'GET';
if(!in_array($method,['GET','POST'],true))pp154_pickup_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
if($method==='POST'&&!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))pp154_pickup_reply(403,['ok'=>false,'error'=>'invalid_csrf']);
if($method==='POST'&&(int)($_SERVER['CONTENT_LENGTH']??0)>4096)pp154_pickup_reply(413,['ok'=>false,'error'=>'body_too_large']);
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp154_pickup_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$file=$dir.'/pickup-'.$id.'.json';$lock=@fopen($dir.'/pickup-'.$id.'.lock','c');
if(!$lock||!flock($lock,$method==='POST'?LOCK_EX:LOCK_SH))pp154_pickup_reply(503,['ok'=>false,'error'=>'lock_unavailable']);
$records=[];if(is_file($file)){$decoded=json_decode((string)@file_get_contents($file),true);if(!is_array($decoded))pp154_pickup_reply(503,['ok'=>false,'error'=>'storage_corrupt']);$records=$decoded;}
if($method==='GET')pp154_pickup_reply(200,['ok'=>true,'records'=>(object)$records,'scope'=>'local_server_only']);
$payload=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($payload))pp154_pickup_reply(422,['ok'=>false,'error'=>'invalid_json']);
$key=$payload['key']??null;$action=$payload['action']??null;$expected=$payload['expected_revision']??null;
if(!is_string($key)||!preg_match('/^(?:live:live-[a-f0-9]{24}|demo:demo-[a-zA-Z0-9-]{1,80})$/D',$key)||!in_array($action,['handed','undo'],true)||!is_int($expected)||$expected<0)pp154_pickup_reply(422,['ok'=>false,'error'=>'invalid_input']);
$old=is_array($records[$key]??null)?$records[$key]:[];$revision=(int)($old['revision']??0);
if($revision!==$expected)pp154_pickup_reply(409,['ok'=>false,'error'=>'status_conflict','records'=>(object)$records]);
$wasHanded=is_string($old['handed_at']??null)&&$old['handed_at']!=='';
if(($action==='handed'&&$wasHanded)||($action==='undo'&&!$wasHanded))pp154_pickup_reply(422,['ok'=>false,'error'=>'invalid_transition']);
$readyAt=null;
if($action==='handed'&&isset($payload['ready_at'])&&is_string($payload['ready_at'])){
 $given=$payload['ready_at'];
 if(strlen($given)<=35){try{$d=new DateTimeImmutable($given);$readyAt=$d->format(DATE_ATOM);}catch(Throwable $e){$readyAt=null;}}
}
$now=(new DateTimeImmutable('now',new DateTimeZone('Europe/Tallinn')))->format(DATE_ATOM);
$actor=is_string($_SESSION['pp_staff']??null)?substr($_SESSION['pp_staff'],0,60):'Köök';
$records[$key]=['revision'=>$revision+1,'handed_at'=>$action==='handed'?$now:null,'ready_at'=>$action==='handed'?$readyAt:($old['ready_at']??null),'actor'=>$actor,'changed_at'=>$now];
if(count($records)>2500){uasort($records,static fn($a,$b)=>strcmp((string)($a['changed_at']??$a['handed_at']??''),(string)($b['changed_at']??$b['handed_at']??'')));$records=array_slice($records,-2000,null,true);}
$json=json_encode($records,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
if($json===false)pp154_pickup_reply(503,['ok'=>false,'error'=>'encode_failed']);
$tmp=$file.'.'.bin2hex(random_bytes(8)).'.tmp';
if(file_put_contents($tmp,$json,LOCK_EX)===false||!rename($tmp,$file)){@unlink($tmp);pp154_pickup_reply(503,['ok'=>false,'error'=>'write_failed']);}
@chmod($file,0600);
try {
 require_once __DIR__.'/tracking-store.php';
 pp155_locked((int)$id,'pickup-events',true,static function(array &$state)use($key,$action,$actor,$now):void {
   $entries=is_array($state['events']??null)?$state['events']:[];
   $entries[]=['order'=>$key,'action'=>$action==='handed'?'Üle antud':'Üleandmine tühistatud','actor'=>$actor,'at'=>$now];
   $state=['events'=>array_slice($entries,-350)];
 });
} catch(Throwable $e) { /* Action already saved; no rollback when auxiliary audit fails. */ }
pp154_pickup_reply(200,['ok'=>true,'records'=>(object)$records,'scope'=>'local_server_only']);
