<?php
/**
 * v17.14 Kitchen Analytics: preparation time, load by hour and late orders.
 * Kept per pizzeria in private_data/analytics-<id>.json: order id, number and four times only
 * (created, deadline, accepted, ready). No customer data, no staff names, no ratings.
 * GET  ?period=today|yesterday|7d  -> merges the kitchen status events, returns the numbers.
 * POST {action:'sync', orders:[{id,number,created,deadline}]} -> stores times seen on the tablet (LIVE only).
 * v17.19: sync may also carry amount (m, cents), service (s: k=kaasa, d=kuller, h=kohapeal) and product counts (z: name->qty,
 * product names only, max 30). Daily totals go to private_data/analytics-days-<id>.json and are kept forever, so
 * ?period=month|lastmonth|all work after the 35-day order list is trimmed. Still no customer data.
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
if($method==='GET'&&!in_array($period,['today','yesterday','7d','month','lastmonth','all'],true))pp1714a_reply(422,['ok'=>false,'error'=>'invalid_period']);
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
  if(is_int($o['m']??null)&&$o['m']>=0&&$o['m']<10000000)$r['m']=$o['m'];
  if(in_array($o['s']??null,['k','d','h'],true))$r['s']=$o['s'];
  if(is_int($o['p']??null)&&$o['p']>=0&&$o['p']<500)$r['p']=$o['p'];
  if(is_array($o['z']??null)){$z=[];foreach(array_slice($o['z'],0,30,true) as $nm=>$q){$nm=is_string($nm)?trim(preg_replace('/[\x00-\x1f<>]+/u','',$nm)):'';if($nm!==''&&is_int($q)&&$q>0&&$q<500)$z[mb_substr($nm,0,60)]=$q;}if($z)$r['z']=$z;}
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
// v17.19: daily totals (Tallinn days) kept forever; days still covered by the order list are recomputed every time.
$tz=new DateTimeZone('Europe/Tallinn');
$dayOf=static fn(int $ms)=>(new DateTimeImmutable('@'.intdiv($ms,1000)))->setTimezone($tz)->format('Y-m-d');
$fresh=[];
foreach($orders as $r){
 if(!is_array($r))continue;$start=(int)($r['c']??$r['a']??0);if($start<=0)continue;
 $d=$dayOf($start);$x=$fresh[$d]??['n'=>0,'m'=>0,'mn'=>0,'p'=>0,'late'=>0,'dl'=>0,'ps'=>0,'pn'=>0,'ts'=>0,'tn'=>0,'h'=>array_fill(0,24,0),'s'=>['k'=>0,'d'=>0,'h'=>0],'z'=>[]];
 $x['n']++;$x['h'][(int)(new DateTimeImmutable('@'.intdiv($start,1000)))->setTimezone($tz)->format('G')]++;
 if(isset($r['m'])){$x['m']+=(int)$r['m'];$x['mn']++;}
 $x['p']+=(int)($r['p']??0);
 if(isset($r['s']))$x['s'][$r['s']]++;
 foreach((array)($r['z']??[]) as $nm=>$q)$x['z'][$nm]=($x['z'][$nm]??0)+(int)$q;
 if(isset($r['a'],$r['f'])&&$r['f']>=$r['a']&&$r['f']-$r['a']<4*3600000){$x['ps']+=($r['f']-$r['a'])/60000;$x['pn']++;}
 if(isset($r['c'],$r['f'])&&$r['f']>$r['c']&&$r['f']-$r['c']<4*3600000){$x['ts']+=($r['f']-$r['c'])/60000;$x['tn']++;}
 if(isset($r['d'],$r['f'])){$x['dl']++;if($r['f']>$r['d']+60000)$x['late']++;}
 $fresh[$d]=$x;
}
foreach($fresh as $d=>$x){arsort($x['z']);$x['z']=array_slice($x['z'],0,40,true);$x['ps']=round($x['ps'],1);$x['ts']=round($x['ts'],1);$fresh[$d]=$x;}
$dfile=$dir.'/analytics-days-'.$id.'.json';$days=[];
if(is_file($dfile)){$dj=json_decode((string)@file_get_contents($dfile),true);if(is_array($dj)&&is_array($dj['days']??null))$days=$dj['days'];}
$oldest=$orders?min(array_map(static fn($r)=>(int)($r['c']??$r['a']??PHP_INT_MAX),$orders)):PHP_INT_MAX;
$covered=$oldest<PHP_INT_MAX?$dayOf($oldest):'9999-99-99';
$merged=$days;foreach($merged as $d=>$_)if($d>=$covered&&!isset($fresh[$d]))unset($merged[$d]);
foreach($fresh as $d=>$x)$merged[$d]=$x;ksort($merged);
if($merged!==$days){$tmp=$dfile.'.'.bin2hex(random_bytes(6)).'.tmp';$data=json_encode(['days'=>$merged],JSON_UNESCAPED_UNICODE);
 if(is_string($data)&&file_put_contents($tmp,$data,LOCK_EX)!==false&&rename($tmp,$dfile))@chmod($dfile,0600);else @unlink($tmp);}
$dayTotals=$merged;
if($method==='POST')pp1714a_reply(200,['ok'=>true,'stored'=>count($orders)]);
// Period in Tallinn time.
$today=(new DateTimeImmutable('now',$tz))->setTime(0,0);
$first=$dayTotals?new DateTimeImmutable(array_key_first($dayTotals).' 00:00',$tz):$today;
[$from,$to]=match($period){'yesterday'=>[$today->modify('-1 day'),$today],'7d'=>[$today->modify('-6 days'),$today->modify('+1 day')],
 'month'=>[$today->modify('first day of this month'),$today->modify('+1 day')],'lastmonth'=>[$today->modify('first day of last month'),$today->modify('first day of this month')],
 'all'=>[min($first,$today),$today->modify('+1 day')],default=>[$today,$today->modify('+1 day')]};
$fromMs=$from->getTimestamp()*1000;$toMs=$to->getTimestamp()*1000;
$hours=array_fill(0,24,0);$prep=[];$total=[];$late=[];$count=0;$withDeadline=0;$days=[];
foreach($orders as $oid=>$r){
 $start=(int)($r['c']??$r['a']??0);
 if($start<$fromMs||$start>=$toMs)continue;
 $count++;
 $h=(int)(new DateTimeImmutable('@'.intdiv($start,1000)))->setTimezone($tz)->format('G');$hours[$h]++;
 $day=(new DateTimeImmutable('@'.intdiv($start,1000)))->setTimezone($tz)->format('Y-m-d');$days[$day]=($days[$day]??0)+1;
 if(isset($r['a'],$r['f'])&&$r['f']>=$r['a']&&$r['f']-$r['a']<4*3600000)$prep[]=($r['f']-$r['a'])/60000;
 if(isset($r['c'],$r['f'])&&$r['f']>$r['c']&&$r['f']-$r['c']<4*3600000)$total[]=($r['f']-$r['c'])/60000;
 if(isset($r['d'],$r['f'])){$withDeadline++;if($r['f']>$r['d']+60000)$late[]=['number'=>(string)($r['n']??''),'late_min'=>(int)round(($r['f']-$r['d'])/60000),'ready'=>$r['f']];}
}
$avg=static fn(array $a)=>$a?round(array_sum($a)/count($a),1):null;
$median=static function(array $a){if(!$a)return null;sort($a);$n=count($a);return round($n%2?$a[intdiv($n,2)]:($a[$n/2-1]+$a[$n/2])/2,1);};
usort($late,static fn($a,$b)=>$b['ready']<=>$a['ready']);
$peak=max($hours);
ksort($days);
$fd=$from->format('Y-m-d');$td=$to->modify('-1 day')->format('Y-m-d');
$T=['n'=>0,'m'=>0,'mn'=>0,'p'=>0,'late'=>0,'dl'=>0,'ps'=>0,'pn'=>0,'ts'=>0,'tn'=>0,'s'=>['k'=>0,'d'=>0,'h'=>0]];$Th=array_fill(0,24,0);$Tz=[];$Td=[];
foreach($dayTotals as $d=>$x){if($d<$fd||$d>$td||!is_array($x))continue;
 foreach(['n','m','mn','p','late','dl','ps','pn','ts','tn'] as $k)$T[$k]+=$x[$k]??0;
 foreach(['k','d','h'] as $k)$T['s'][$k]+=(int)($x['s'][$k]??0);
 foreach((array)($x['h']??[]) as $h=>$n)$Th[(int)$h]+=(int)$n;
 foreach((array)($x['z']??[]) as $nm=>$q)$Tz[$nm]=($Tz[$nm]??0)+(int)$q;
 $Td[$d]=['n'=>(int)($x['n']??0),'m'=>(int)($x['m']??0)];}
arsort($Tz);
$report=['orders'=>$T['n'],'amount_cents'=>$T['m'],'amount_orders'=>$T['mn'],'avg_check_cents'=>$T['mn']?(int)round($T['m']/$T['mn']):null,
 'pizzas'=>$T['p'],'prep_avg'=>$T['pn']?round($T['ps']/$T['pn'],1):null,'total_avg'=>$T['tn']?round($T['ts']/$T['tn'],1):null,
 'late'=>$T['late'],'with_deadline'=>$T['dl'],'service'=>$T['s'],'hours'=>$Th,'top'=>(object)array_slice($Tz,0,10,true),'days'=>(object)$Td,'first_day'=>$dayTotals?array_key_first($dayTotals):null];
pp1714a_reply(200,['ok'=>true,'period'=>$period,'report'=>$report,'from'=>$from->format('Y-m-d'),'to'=>$to->modify('-1 day')->format('Y-m-d'),
 'orders'=>$count,'prep_avg'=>$avg($prep),'prep_median'=>$median($prep),'prep_count'=>count($prep),
 'total_avg'=>$avg($total),'total_count'=>count($total),
 'late'=>count($late),'with_deadline'=>$withDeadline,'late_list'=>array_slice($late,0,10),
 'hours'=>$hours,'peak_hour'=>$peak>0?array_search($peak,$hours,true):null,'days'=>$days,
 'scope'=>'internal_only']);
