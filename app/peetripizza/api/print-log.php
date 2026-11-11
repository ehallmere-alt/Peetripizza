<?php
/**
 * v17.14 Smart Print Monitor: shared print log for all tablets of one pizzeria.
 * Stores only order id, order number, time, kind, tablet label and outcome.
 * No customer data. Nothing is sent to peetripizza.ee.
 */
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function pp1714p_reply(int $http,array $data): never {
 http_response_code($http);
 echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
 exit;
}
$loc=$_SESSION['pp_pizzeria']??null;
$id=is_array($loc)?filter_var($loc['id']??null,FILTER_VALIDATE_INT):false;
if(!$id||$id<1)pp1714p_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$method=$_SERVER['REQUEST_METHOD']??'GET';
if(!in_array($method,['GET','POST'],true))pp1714p_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
if($method==='POST'){
 if(!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))pp1714p_reply(403,['ok'=>false,'error'=>'invalid_csrf']);
 if((int)($_SERVER['CONTENT_LENGTH']??0)>2048)pp1714p_reply(413,['ok'=>false,'error'=>'too_large']);
 if(!preg_match('~^application/json(?:\s*;|\s*$)~i',(string)($_SERVER['CONTENT_TYPE']??'')))pp1714p_reply(415,['ok'=>false,'error'=>'json_required']);
}
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp1714p_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$file=$dir.'/print-log-'.$id.'.json';
$lock=@fopen($dir.'/print-log-'.$id.'.lock','c');
if(!$lock||!flock($lock,$method==='GET'?LOCK_SH:LOCK_EX))pp1714p_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$orders=[];
if(is_file($file)){
 $raw=@file_get_contents($file);
 $json=is_string($raw)&&strlen($raw)<2000000?json_decode($raw,true):null;
 if(is_array($json)&&is_array($json['orders']??null))$orders=$json['orders'];
}
// A print counts as done unless the tablet reported that it was blocked or failed.
function pp1714p_counted(array $p): bool {return !in_array((string)($p['outcome']??''),['blocked','failed'],true);}
function pp1714p_view(string $oid,array $o): array {
 $prints=is_array($o['prints']??null)?$o['prints']:[];
 $ok=array_values(array_filter($prints,'pp1714p_counted'));
 $last=$prints?end($prints):null;
 return ['order'=>$oid,'number'=>(string)($o['number']??''),'count'=>count($ok),'attempts'=>count($prints),
  'last_at'=>is_array($last)?(string)($last['at']??''):'', 'last_kind'=>is_array($last)?(string)($last['kind']??''):'',
  'last_device'=>is_array($last)?(string)($last['device']??''):'', 'last_outcome'=>is_array($last)?(string)($last['outcome']??''):'',
  'prints'=>array_slice($prints,-6)];
}
$now=new DateTimeImmutable('now',new DateTimeZone('Europe/Tallinn'));
if($method==='GET'){
 $since=$now->modify('-36 hours')->format(DATE_ATOM);
 $rows=[];
 foreach($orders as $oid=>$o){
  if(!is_string($oid)||!is_array($o))continue;
  $prints=is_array($o['prints']??null)?$o['prints']:[];
  $last=$prints?end($prints):null;
  if(!is_array($last)||strcmp((string)($last['at']??''),$since)<0)continue;
  $rows[]=pp1714p_view($oid,$o);
 }
 usort($rows,static fn($a,$b)=>strcmp($b['last_at'],$a['last_at']));
 pp1714p_reply(200,['ok'=>true,'orders'=>array_slice($rows,0,300),'server_time'=>$now->format(DATE_ATOM),'scope'=>'internal_only']);
}
$in=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($in))pp1714p_reply(422,['ok'=>false,'error'=>'invalid_json']);
$action=$in['action']??'';
$oid=$in['order']??'';
$device=$in['device']??'';
if(!in_array($action,['claim','outcome'],true))pp1714p_reply(422,['ok'=>false,'error'=>'invalid_action']);
if(!is_string($oid)||!preg_match('/^(?:live-[a-f0-9]{24}|demo-[a-z0-9-]{1,24})$/D',$oid))pp1714p_reply(422,['ok'=>false,'error'=>'invalid_order']);
if(!is_string($device)||!preg_match('/^[A-Za-z0-9 ._-]{1,24}$/D',$device))pp1714p_reply(422,['ok'=>false,'error'=>'invalid_device']);
$rec=is_array($orders[$oid]??null)?$orders[$oid]:['number'=>'','prints'=>[]];
$prints=is_array($rec['prints']??null)?$rec['prints']:[];
$claimed=true;
if($action==='claim'){
 $kind=$in['kind']??'';
 $number=$in['number']??'';
 if(!in_array($kind,['auto','manual','copy','retry'],true))pp1714p_reply(422,['ok'=>false,'error'=>'invalid_kind']);
 if(!is_string($number)||!preg_match('/^[A-Za-z0-9-]{0,20}$/D',$number))pp1714p_reply(422,['ok'=>false,'error'=>'invalid_number']);
 // Auto print is printed by one tablet only: the first claim wins.
 if($kind==='auto'&&array_filter($prints,'pp1714p_counted'))$claimed=false;
 else{
  $prints[]=['at'=>$now->format(DATE_ATOM),'kind'=>$kind,'device'=>$device,'outcome'=>'dialog'];
  $rec['number']=$number!==''?$number:(string)($rec['number']??'');
 }
}else{
 $outcome=$in['outcome']??'';
 if(!in_array($outcome,['confirmed','failed','blocked'],true))pp1714p_reply(422,['ok'=>false,'error'=>'invalid_outcome']);
 $idx=null;
 for($i=count($prints)-1;$i>=0;$i--){if(is_array($prints[$i])&&($prints[$i]['device']??'')===$device){$idx=$i;break;}}
 if($idx===null)pp1714p_reply(404,['ok'=>false,'error'=>'not_found']);
 $prints[$idx]['outcome']=$outcome;
 $prints[$idx]['outcome_at']=$now->format(DATE_ATOM);
}
if($claimed){
 $rec['prints']=array_slice($prints,-20);
 $orders[$oid]=$rec;
 // Keep three days and at most 1500 orders.
 $cut=$now->modify('-3 days')->format(DATE_ATOM);
 $orders=array_filter($orders,static function($o)use($cut){$p=is_array($o['prints']??null)?$o['prints']:[];$l=$p?end($p):null;return is_array($l)&&strcmp((string)($l['at']??''),$cut)>=0;});
 if(count($orders)>1500)$orders=array_slice($orders,-1500,null,true);
 $tmp=$file.'.'.bin2hex(random_bytes(6)).'.tmp';
 $data=json_encode(['orders'=>$orders],JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
 if(!is_string($data)||file_put_contents($tmp,$data,LOCK_EX)===false||!rename($tmp,$file)){@unlink($tmp);error_log('[Peetri print-log v17.14] save_failure');pp1714p_reply(503,['ok'=>false,'error'=>'storage_write_failed']);}
 @chmod($file,0600);
}
pp1714p_reply(200,['ok'=>true,'claimed'=>$claimed,'record'=>pp1714p_view($oid,$orders[$oid]??$rec),'scope'=>'internal_only']);
