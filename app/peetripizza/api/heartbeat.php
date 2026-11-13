<?php
declare(strict_types=1);
/*
 * Peetri Pizza v17.49 — tablet heartbeat for the owner's check page (check.php).
 * POST (CSRF): a tablet says once a minute "I am here": its own random id, app version, DEMO/LIVE, when LIVE data last came.
 * GET: list for this pizzeria. No order data, no phone numbers, nothing goes to peetripizza.ee.
 * Stored in private_data/heartbeat-<pizzeria>.json, devices not seen for 7 days are dropped.
 */
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
function pp1749_reply(int $code,array $body): never {http_response_code($code);echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
$method=$_SERVER['REQUEST_METHOD']??'GET';
pp_start();
$loc=$_SESSION['pp_pizzeria']??null;$id=is_array($loc)?(int)($loc['id']??0):0;
if($id<1)pp1749_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
if($method==='POST'&&!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))pp1749_reply(403,['ok'=>false,'error'=>'invalid_csrf']);
session_write_close();
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp1749_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$file=$dir.'/heartbeat-'.$id.'.json';
$h=@fopen($file,'c+');if(!$h)pp1749_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
flock($h,$method==='POST'?LOCK_EX:LOCK_SH);
$all=json_decode((string)stream_get_contents($h),true);if(!is_array($all))$all=[];
$now=time();
foreach($all as $k=>$d)if(!is_array($d)||$now-(int)($d['seen']??0)>7*86400)unset($all[$k]);
if($method==='POST'){
    $in=json_decode((string)file_get_contents('php://input',false,null,0,4096),true);if(!is_array($in))$in=[];
    $dev=preg_replace('/[^a-z0-9]/','',strtolower((string)($in['device']??'')));
    if(strlen($dev)<8||strlen($dev)>40){flock($h,LOCK_UN);fclose($h);pp1749_reply(400,['ok'=>false,'error'=>'bad_device']);}
    $clean=static fn($v,int $n)=>substr(preg_replace('/[^\p{L}\p{N} .,:()\/_+-]/u','',(string)$v)??'',0,$n);
    $ua=(string)($_SERVER['HTTP_USER_AGENT']??'');
    $kind=preg_match('/Android/i',$ua)?'Android':(preg_match('/iPhone|iPad/i',$ua)?'iPhone/iPad':(preg_match('/Windows/i',$ua)?'Windows':(preg_match('/Mac OS/i',$ua)?'Mac':'muu')));
    $kind.=preg_match('/Chrome\//',$ua)?' · Chrome':(preg_match('/Safari\//',$ua)?' · Safari':'');
    if(count($all)>=30&&!isset($all[$dev])){uasort($all,static fn($a,$b)=>(int)$a['seen']<=>(int)$b['seen']);array_shift($all);}
    $all[$dev]=['seen'=>$now,'kind'=>$kind,'version'=>$clean($in['version']??'',20),'mode'=>($in['mode']??'')==='live'?'live':'demo',
        'live_at'=>max(0,min($now,(int)(((int)($in['live_at']??0))/1000))),'page'=>$clean($in['page']??'',20),'screen'=>$clean($in['screen']??'',20),
        'name'=>$clean($in['name']??($all[$dev]['name']??''),30),'first'=>(int)($all[$dev]['first']??$now)];
    ftruncate($h,0);rewind($h);fwrite($h,json_encode($all,JSON_UNESCAPED_UNICODE));fflush($h);
}
flock($h,LOCK_UN);fclose($h);
@chmod($file,0600);
$version='';$d=@file_get_contents(dirname(__DIR__).'/dashboard.php');if(is_string($d)&&preg_match('/name="peetri-release" content="([^"]+)"/',$d,$m))$version=$m[1];
$list=[];foreach($all as $k=>$d)$list[]=['device'=>substr($k,0,6)]+$d;
usort($list,static fn($a,$b)=>(int)$b['seen']<=>(int)$a['seen']);
pp1749_reply(200,['ok'=>true,'now'=>$now,'server_version'=>$version,'pizzeria'=>is_array($loc)?substr((string)($loc['name']??''),0,60):'','devices'=>$list]);
