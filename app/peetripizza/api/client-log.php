<?php
declare(strict_types=1);
/*
 * Peetri Pizza v17.4 — client JavaScript error journal (kitchen tablets).
 * Stores ONLY technical error text (message, file, line, release, page, mode).
 * No orders, no customer names, no session data. Never contacts peetripizza.ee.
 * File: private_data/client-errors-<pizzeria>.log (JSON lines, max ~256 KB, one rotation).
 * Read on the server:  tail -n 50 private_data/client-errors-*.log
 */
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
function pp174_reply(int $status,array $body): never {http_response_code($status);echo json_encode($body);exit;}
if(($_SERVER['REQUEST_METHOD']??'GET')!=='POST')pp174_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
if(!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))pp174_reply(403,['ok'=>false,'error'=>'invalid_csrf']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>4096)pp174_reply(413,['ok'=>false,'error'=>'body_too_large']);
if(!preg_match('~^application/json(?:\s*;|\s*$)~i',(string)($_SERVER['CONTENT_TYPE']??'')))pp174_reply(415,['ok'=>false,'error'=>'json_required']);
$tenant=$_SESSION['pp_pizzeria']??null;
$id=is_array($tenant)?filter_var($tenant['id']??null,FILTER_VALIDATE_INT):false;
$scope=($id&&$id>0)?(string)$id:'staff';
// Rate limit per login session: 30 reports per hour.
$now=time();
$bucket=$_SESSION['pp174_log']??['t'=>$now,'n'=>0];
if(!is_array($bucket)||$now-(int)($bucket['t']??0)>3600)$bucket=['t'=>$now,'n'=>0];
if((int)$bucket['n']>=30)pp174_reply(429,['ok'=>false,'error'=>'rate_limited']);
$bucket['n']=(int)$bucket['n']+1;$_SESSION['pp174_log']=$bucket;
$raw=(string)file_get_contents('php://input',false,null,0,4097);
$in=json_decode($raw,true);
if(!is_array($in))pp174_reply(422,['ok'=>false,'error'=>'invalid_json']);
function pp174_clean($v,int $max): string {
    $s=is_scalar($v)?(string)$v:'';
    $s=preg_replace('/[\x00-\x1F\x7F]+/u',' ',$s)??'';
    // Scrub anything that could be personal data if it ever ends up in an error text.
    $s=preg_replace('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i','[email]',$s)??'';
    $s=preg_replace('/\+?\d[\d \-]{6,}\d/','[number]',$s)??'';
    return function_exists('mb_substr')?mb_substr($s,0,$max,'UTF-8'):substr($s,0,$max);
}
$kind=in_array($in['kind']??'',['error','promise','manual'],true)?$in['kind']:'error';
$source=preg_replace('/[^A-Za-z0-9._-]/','',(string)($in['source']??''))??'';
$entry=[
 'at'=>gmdate('c',$now),
 'kind'=>$kind,
 'message'=>pp174_clean($in['message']??'',300),
 'source'=>substr($source,0,80),
 'line'=>max(0,min(1000000,(int)($in['line']??0))),
 'col'=>max(0,min(100000,(int)($in['col']??0))),
 'stack'=>pp174_clean($in['stack']??'',600),
 'release'=>pp174_clean($in['release']??'',20),
 'page'=>preg_replace('/[^A-Za-z0-9_-]/','',substr((string)($in['page']??''),0,40)),
 'mode'=>($in['mode']??'')==='live'?'live':'demo',
 'ua'=>pp174_clean($_SERVER['HTTP_USER_AGENT']??'',160),
];
if($entry['message']==='')pp174_reply(422,['ok'=>false,'error'=>'empty']);
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp174_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$file=$dir.'/client-errors-'.$scope.'.log';
$fh=@fopen($file,'c+');
if(!$fh||!flock($fh,LOCK_EX))pp174_reply(503,['ok'=>false,'error'=>'lock_unavailable']);
clearstatcache(true,$file);
if((int)@filesize($file)>262144){@copy($file,$file.'.1');ftruncate($fh,0);}
fseek($fh,0,SEEK_END);
fwrite($fh,json_encode($entry,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE)."\n");
fflush($fh);flock($fh,LOCK_UN);fclose($fh);
@chmod($file,0600);
pp174_reply(200,['ok'=>true]);
