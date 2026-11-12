<?php
/**
 * v17.16: daily copy of this pizzeria's kitchen data (private_data) + restore.
 * GET  -> makes today's copy if it does not exist yet, returns the list of copies (date, time, files).
 * POST {"action":"restore","date":"YYYY-MM-DD"} (CSRF) -> first saves the current files as a "before restore"
 *      copy, then puts the chosen day's files back. Only files of the logged-in pizzeria are touched.
 * Copies live in private_data/backups/<id>/<date>/ and are kept 14 days. Nothing is sent anywhere.
 */
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function pp1716b_reply(int $http,array $data): never {http_response_code($http);echo json_encode($data,JSON_UNESCAPED_UNICODE);exit;}
$loc=$_SESSION['pp_pizzeria']??null;
$id=is_array($loc)?filter_var($loc['id']??null,FILTER_VALIDATE_INT):false;
if(!$id||$id<1)pp1716b_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$method=$_SERVER['REQUEST_METHOD']??'GET';
if(!in_array($method,['GET','POST'],true))pp1716b_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp1716b_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$root=$dir.'/backups/'.$id;
if(!is_dir($root)&&!@mkdir($root,0700,true))pp1716b_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
// The kitchen data files of one pizzeria (each guarded by its own .lock used by the API that writes it).
const PP1716B_NAMES=['internal-status','pickup','dough','wait','print-log','analytics','analytics-days'];
$tz=new DateTimeZone('Europe/Tallinn');
$today=(new DateTimeImmutable('now',$tz))->format('Y-m-d');
$global=@fopen($root.'/.lock','c');
if(!$global||!flock($global,LOCK_EX))pp1716b_reply(503,['ok'=>false,'error'=>'storage_unavailable']);

function pp1716b_copy(string $dir,int $id,string $target): int {
 if(!is_dir($target)&&!@mkdir($target,0700,true))return -1;
 $n=0;
 foreach(PP1716B_NAMES as $name){
  $src=$dir.'/'.$name.'-'.$id.'.json';if(!is_file($src))continue;
  $lock=@fopen($dir.'/'.$name.'-'.$id.'.lock','c');if($lock)flock($lock,LOCK_SH);
  $ok=@copy($src,$target.'/'.$name.'.json.tmp')&&@rename($target.'/'.$name.'.json.tmp',$target.'/'.$name.'.json');
  if($lock){flock($lock,LOCK_UN);fclose($lock);}
  if($ok)$n++;
 }
 @file_put_contents($target.'/meta.json',json_encode(['at'=>time(),'files'=>$n]));
 return $n;
}
function pp1716b_list(string $root): array {
 $out=[];
 foreach((array)@scandir($root) as $d){
  if(!is_string($d)||!preg_match('/^\d{4}-\d{2}-\d{2}(-enne)?$/',$d)||!is_dir($root.'/'.$d))continue;
  $meta=json_decode((string)@file_get_contents($root.'/'.$d.'/meta.json'),true);
  $out[]=['date'=>$d,'at'=>(int)($meta['at']??0),'files'=>(int)($meta['files']??0)];
 }
 usort($out,fn($a,$b)=>$b['at']<=>$a['at']);
 return $out;
}
function pp1716b_rmdir(string $path): void {foreach((array)@scandir($path) as $f){if($f==='.'||$f==='..'||!is_string($f))continue;@unlink($path.'/'.$f);}@rmdir($path);}

if($method==='GET'){
 $made=false;
 if(!is_file($root.'/'.$today.'/meta.json')){$made=pp1716b_copy($dir,$id,$root.'/'.$today)>=0;}
 // Keep 14 days (and the "before restore" copies for the same time).
 $limit=(new DateTimeImmutable('now',$tz))->modify('-14 days')->format('Y-m-d');
 foreach(pp1716b_list($root) as $b)if(substr($b['date'],0,10)<$limit)pp1716b_rmdir($root.'/'.$b['date']);
 pp1716b_reply(200,['ok'=>true,'today'=>$today,'made'=>$made,'backups'=>pp1716b_list($root)]);
}

if(!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))pp1716b_reply(403,['ok'=>false,'error'=>'invalid_csrf']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>512)pp1716b_reply(413,['ok'=>false,'error'=>'too_large']);
$in=json_decode((string)file_get_contents('php://input'),true);
$date=is_array($in)?(string)($in['date']??''):'';
if(!is_array($in)||($in['action']??'')!=='restore'||!preg_match('/^\d{4}-\d{2}-\d{2}(-enne)?$/',$date))pp1716b_reply(400,['ok'=>false,'error'=>'bad_request']);
$from=$root.'/'.$date;
if(!is_file($from.'/meta.json'))pp1716b_reply(404,['ok'=>false,'error'=>'not_found']);
// Safety copy of the current state first, so a restore can itself be undone.
$before=$root.'/'.$today.'-enne';
if($from===$before){$tmp=$root.'/.undo';if(is_dir($tmp))pp1716b_rmdir($tmp);if(!@rename($before,$tmp))pp1716b_reply(503,['ok'=>false,'error'=>'storage_unavailable']);$from=$tmp;}
elseif(is_dir($before))pp1716b_rmdir($before);
if(pp1716b_copy($dir,$id,$before)<0)pp1716b_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$restored=0;
foreach(PP1716B_NAMES as $name){
 $src=$from.'/'.$name.'.json';if(!is_file($src))continue;
 $dst=$dir.'/'.$name.'-'.$id.'.json';
 $lock=@fopen($dir.'/'.$name.'-'.$id.'.lock','c');if($lock)flock($lock,LOCK_EX);
 $ok=@copy($src,$dst.'.pp1716')&&@rename($dst.'.pp1716',$dst);
 if($lock){flock($lock,LOCK_UN);fclose($lock);}
 if($ok)$restored++;
}
if(str_ends_with($from,'/.undo'))pp1716b_rmdir($from);
pp1716b_reply(200,['ok'=>true,'restored'=>$restored,'date'=>$date,'backups'=>pp1716b_list($root)]);
