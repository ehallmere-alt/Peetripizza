<?php
/**
 * v17.14 Kitchen Analytics: preparation time, load by hour and late orders.
 * Kept per pizzeria in private_data/analytics-<id>.json: order id, number and four times only
 * (created, deadline, accepted, ready). No customer data, no staff names, no ratings.
 * GET  ?period=today|yesterday|7d  -> merges the kitchen status events, returns the numbers.
 * POST {action:'sync', orders:[{id,number,created,deadline}]} -> stores times seen on the tablet (LIVE only).
 * Nothing is sent to peetripizza.ee.
 */
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function pp1714a_reply(int $http,array $data): never {
 http_response_code($http);
 echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
 exit;
}
$loc=$_SESSION['pp_pizzeria']??null;
$id=is_array($loc)?filter_var($loc['id']??null,FILTER_VALIDATE_INT):false;
if(!$id||$id<1)pp1714a_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$method=$_SERVER['REQUEST_METHOD']??'GET';
if(!in_array($method,['GET','POST'],true))pp1714a_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
if($method==='POST'){
 if(!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))pp1714a_reply(403,['ok'=>false,'error'=>'invalid_csrf']);
 if((int)($_SERVER['CONTENT_LENGTH']??0)>24576)pp1714a_reply(413,['ok'=>false,'error'=>'too_large']);
 if(!preg_match('~^application/json(?:\s*;|\s*$)~i',(string)($_SERVER['CONTENT_TYPE']??'')))pp1714a_reply(415,['ok'=>false,'error'=>'json_required']);
}
$period=$_GET['period']??'today';
if($method==='GET'&&!in_array($period,['today','yesterday','7d'],true))pp1714a_reply(422,['ok'=>false,'error'=>'invalid_period']);
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp1714a_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$file=$dir.'/analytics-'.$id.'.json';
$lock=@fopen($dir.'/analytics-'.$id.'.lock','c');
if(!$lock||!flock($lock,LOCK_EX))pp1714a_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$orders=[];
if(is_file($file)){
 $raw=@file_get_contents($file);
 $json=is_string($raw)&&strlen($raw)<3000000?json_decode($raw,true):null;
 if(is_array($json)&&is_array($json['orders']??null))$orders=$json['orders'];
}
$changed=false;
$nowMs=(int)round(microtime(true)*1000);
$valid=static fn($v)=>is_int($v)&&$v>1600000000000&&$v<$nowMs+86400000*2;
if($method==='POST'){
 $in=json_decode((string)file_get_contents('php://input'),true);
 if(!is_array($in)||($in['action']??'')!=='sync'||!is_array($in['orders']??null)||count($in['orders'])>200)pp1714a_reply(422,['ok'=>false,'error'=>'invalid_request']);
 foreach($in['orders'] as $o){
  if(!is_array($o))continue;
  $oid=$o['id']??'';
  if(!is_string($oid)||!preg_match('/^live-[a-f0-9]{24}$/D',$oid))continue;
  $num=$o['number']??'';$num=is_string($num)&&preg_match('/^[A-Za-z0-9-]{1,20}$/D',$num)?$num:'';
  $r=is_array($orders[$oid]??null)?$orders[$oid]:[];
  $before=$r;
  if($num!=='')$r['n']=$num;
  if($valid($o['created']??null))$r['c']=$o['created'];
  if($valid($o['deadline']??null))$r['d']=$o['deadline'];
  if($r!==$before){$orders[$oid]=$r;$changed=true;}
 }
}
// Merge kitchen status events (Võta vastu = new→active, Valmis = →done). Keeps the first accept and the last ready.
$events=[];
$sf=$dir.'/internal-status-'.$id.'.json';
if(is_file($sf)&&@filesize($sf)<1200000){
 $sj=json_decode((string)@file_get_contents($sf),true);
 if(is_array($sj)&&is_array($sj['events']??null))$events=$sj['events'];
}
foreach($events as $ev){
 if(!is_array($ev)||!is_string($ev['id']??null)||!preg_match('/^live-[a-f0-9]{24}$/D',$ev['id']))continue;
 $t=strtotime((string)($ev['at']??''));if(!$t)continue;$t*=1000;
 $r=is_array($orders[$ev['id']]??null)?$orders[$ev['id']]:[];$before=$r;
 $to=(string)($ev['to']??'');$from=(string)($ev['from']??'');
 if($to==='active'&&$from==='new'&&(!isset($r['a'])||$t<$r['a']))$r['a']=$t;
 if($to==='done'&&(!isset($r['f'])||$t>$r['f']))$r['f']=$t;
 if($to==='active'&&$from==='done'&&isset($r['f'])&&$t>=$r['f'])unset($r['f']); // Valmis was undone
 if($r!==$before){$orders[$ev['id']]=$r;$changed=true;}
}
if($changed){
 $cut=$nowMs-35*86400000;
 $orders=array_filter($orders,static fn($r)=>is_array($r)&&max((int)($r['c']??0),(int)($r['a']??0),(int)($r['f']??0),(int)($r['d']??0))>=$cut);
 if(count($orders)>6000){uasort($orders,static fn($a,$b)=>max($a['c']??0,$a['a']??0)<=>max($b['c']??0,$b['a']??0));$orders=array_slice($orders,-6000,null,true);}
 $tmp=$file.'.'.bin2hex(random_bytes(6)).'.tmp';
 $data=json_encode(['orders'=>$orders],JSON_UNESCAPED_UNICODE);
 if(!is_string($data)||file_put_contents($tmp,$data,LOCK_EX)===false||!rename($tmp,$file)){@unlink($tmp);error_log('[Peetri analytics v17.14] save_failure');pp1714a_reply(503,['ok'=>false,'error'=>'storage_write_failed']);}
 @chmod($file,0600);
}
if($method==='POST')pp1714a_reply(200,['ok'=>true,'stored'=>count($orders)]);
// Period in Tallinn time.
$tz=new DateTimeZone('Europe/Tallinn');
$today=(new DateTimeImmutable('now',$tz))->setTime(0,0);
[$from,$to]=match($period){'yesterday'=>[$today->modify('-1 day'),$today],'7d'=>[$today->modify('-6 days'),$today->modify('+1 day')],default=>[$today,$today->modify('+1 day')]};
$fromMs=$from->getTimestamp()*1000;$toMs=$to->getTimestamp()*1000;
$hours=array_fill(0,24,0);$prep=[];$total=[];$late=[];$count=0;$withDeadline=0;$days=[];
foreach($orders as $oid=>$r){
 $start=(int)($r['c']??$r['a']??0);
 if($start<$fromMs||$start>=$toMs)continue;
 $count++;
 $h=(int)(new DateTimeImmutable('@'.intdiv($start,1000)))->setTimezone($tz)->format('G');$hours[$h]++;
 $day=(new DateTimeImmutable('@'.intdiv($start,1000)))->setTimezone($tz)->format('Y-m-d');$days[$day]=($days[$day]??0)+1;
 if(isset($r['a'],$r['f'])&&$r['f']>$r['a']&&$r['f']-$r['a']<4*3600000)$prep[]=($r['f']-$r['a'])/60000;
 if(isset($r['c'],$r['f'])&&$r['f']>$r['c']&&$r['f']-$r['c']<4*3600000)$total[]=($r['f']-$r['c'])/60000;
 if(isset($r['d'],$r['f'])){$withDeadline++;if($r['f']>$r['d']+60000)$late[]=['number'=>(string)($r['n']??''),'late_min'=>(int)round(($r['f']-$r['d'])/60000),'ready'=>$r['f']];}
}
$avg=static fn(array $a)=>$a?round(array_sum($a)/count($a),1):null;
$median=static function(array $a){if(!$a)return null;sort($a);$n=count($a);return round($n%2?$a[intdiv($n,2)]:($a[$n/2-1]+$a[$n/2])/2,1);};
usort($late,static fn($a,$b)=>$b['ready']<=>$a['ready']);
$peak=max($hours);
ksort($days);
pp1714a_reply(200,['ok'=>true,'period'=>$period,'from'=>$from->format('Y-m-d'),'to'=>$to->modify('-1 day')->format('Y-m-d'),
 'orders'=>$count,'prep_avg'=>$avg($prep),'prep_median'=>$median($prep),'prep_count'=>count($prep),
 'total_avg'=>$avg($total),'total_count'=>count($total),
 'late'=>count($late),'with_deadline'=>$withDeadline,'late_list'=>array_slice($late,0,10),
 'hours'=>$hours,'peak_hour'=>$peak>0?array_search($peak,$hours,true):null,'days'=>$days,
 'scope'=>'internal_only']);
