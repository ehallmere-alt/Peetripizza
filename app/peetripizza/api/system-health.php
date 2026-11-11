<?php
/** v16.9 (+v17.14 storage size, disk, server time): authenticated, read-only, privacy-preserving system diagnostics. */
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function pp169_reply(int $http,array $response): never {
 http_response_code($http);
 echo json_encode($response,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
 exit;
}
if(($_SERVER['REQUEST_METHOD']??'')!=='GET')pp169_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
$loc=$_SESSION['pp_pizzeria']??null;
$id=is_array($loc)?filter_var($loc['id']??null,FILTER_VALIDATE_INT):false;
if(!$id||$id<1)pp169_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$checks=[];
$add=static function(string $key,string $state,string $message)use(&$checks):void{$checks[]=['key'=>$key,'state'=>$state,'message'=>$message];};
$add('runtime',PHP_VERSION_ID>=80100?'ok':'error',PHP_VERSION_ID>=80100?'PHP ühilduv versioon':'Vajalik PHP 8.1 või uuem');
foreach(['json','curl'] as $ext)$add($ext,extension_loaded($ext)?'ok':'error',extension_loaded($ext)?strtoupper($ext).' moodul saadaval':strtoupper($ext).' moodul puudub');
$private=dirname(__DIR__).'/private_data';
$writable=is_dir($private)?is_writable($private):is_writable(dirname(__DIR__));
$add('storage',$writable?'ok':'error',!$writable?'Kohalik JSON-andmesalvestus pole kirjutatav':(is_dir($private)?'JSON-andmesalvestus on kirjutatav':'Salvestuskaust luuakse esimesel salvestamisel'));
$add('database','info','MySQL andmebaasi ei kasutata. Andmed salvestatakse pizzeria kaupa JSON-failidesse.');
$add('session',session_status()===PHP_SESSION_ACTIVE?'ok':'warn','Sisselogitud pizzeria seanss on aktiivne.');
$credential=pp_credentials_file();
$add('staff_credentials',is_file($credential)?'ok':'warn',is_file($credential)?'Sisselogimise konfiguratsioon on olemas':'Sisselogimise konfiguratsioonifaili ei leitud');
$add('logging',filter_var(ini_get('log_errors'),FILTER_VALIDATE_BOOLEAN)?'ok':'warn',filter_var(ini_get('log_errors'),FILTER_VALIDATE_BOOLEAN)?'PHP vealogimine on lubatud':'PHP vealogimine on välja lülitatud');
$htaccess=dirname(__DIR__).'/.htaccess';
$ht=@file_get_contents($htaccess);
$rules=is_string($ht)&&str_contains($ht,'private_data');
$add('http_protection',$rules?'warn':'error',$rules?'Apache .htaccess kaitse on kirjas; kontrolli selle toimimist HTTP kaudu (Nginx vajab eraldi reegleid)':'private_data HTTP-kaitse reegel puudub või pole loetav');
$manifestFile=dirname(__DIR__).'/tools/release-manifest.php';
$manifest=is_file($manifestFile)?require $manifestFile:null;
if(!is_array($manifest))$add('release','error','Versiooni kontrollfail puudub või on vigane');
else{
 $missing=0;$changed=0;$ok=0;
 foreach($manifest as $rel=>$hash){
  if(!is_string($rel)||!is_string($hash)||preg_match('~(?:^/|\\\\|\.\.)~',$rel)){++$changed;continue;}
  $path=dirname(__DIR__).'/'.$rel;
  if(!is_file($path)){++$missing;continue;}
  if(!hash_equals($hash,(string)@hash_file('sha256',$path)))++$changed;else ++$ok;
 }
 $state=($missing||$changed)?'error':'ok';
 $add('release',$state,'Versioonifailid: '.$ok.' korras, '.$missing.' puudu, '.$changed.' erinevat. (Vanad lisafailid võivad serverisse alles jääda.)');
}
// v17.14: storage size, disk space and file limits (files near a read limit stop working).
$limits=['internal-status-'=>1200000,'dough-'=>2500000,'print-log-'=>2000000,'pickup-'=>1500000];
$storage=['files'=>0,'bytes'=>0,'largest'=>0,'free_bytes'=>null,'near_limit'=>[]];
if(is_dir($private)){
 foreach((array)@scandir($private) as $f){
  if(!is_string($f)||!str_ends_with($f,'.json'))continue;
  $sz=(int)@filesize($private.'/'.$f);$storage['files']++;$storage['bytes']+=$sz;$storage['largest']=max($storage['largest'],$sz);
  foreach($limits as $prefix=>$max){if(str_starts_with($f,$prefix)&&$sz>$max*0.8)$storage['near_limit'][]=$prefix;}
 }
 $free=@disk_free_space($private);$storage['free_bytes']=is_float($free)||is_int($free)?(int)$free:null;
}
$storage['near_limit']=array_values(array_unique($storage['near_limit']));
$mb=static fn($b)=>number_format($b/1048576,1,',','').' MB';
$add('storage_size',$storage['near_limit']?'warn':'ok',$storage['files'].' faili, '.$mb($storage['bytes']).($storage['near_limit']?' · mõni fail on mahupiiri lähedal':''));
if($storage['free_bytes']!==null)$add('disk',$storage['free_bytes']<200*1048576?'warn':'ok','Vaba kettaruum: '.$mb($storage['free_bytes']));
$bad=count(array_filter($checks,static fn($x)=>$x['state']==='error'));
pp169_reply(200,['ok'=>true,'healthy'=>$bad===0,'checks'=>$checks,'checked_at'=>time(),'read_only'=>true,'upstream_checked'=>false,'verified_public_http_rules'=>false,'storage'=>$storage,'server_time'=>(int)round(microtime(true)*1000)]);
