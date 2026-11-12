<?php
declare(strict_types=1);
/*
 * Peetri Pizza v17.6 — what the customer website shows for THIS pizzeria (read-only).
 * Wait time, "temporarily closed", today's opening hours and products/toppings marked as missing.
 * GET only. Never writes to peetripizza.ee. websocket_key and other secrets are never passed on.
 * Cached per pizzeria: status 60 s, product names 1 h (private_data, not web-accessible).
 */
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
function pp176_reply(int $code,array $body): never {http_response_code($code);echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET')pp176_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
pp_start();
$loc=$_SESSION['pp_pizzeria']??null;$token=$_SESSION['pp_upstream_session']??null;
$id=is_array($loc)?(int)($loc['id']??0):0;
if($id<1)pp176_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$token=is_string($token)&&strlen($token)>=12?$token:'';
session_write_close();
if(!function_exists('curl_init'))pp176_reply(503,['ok'=>false,'error'=>'curl_unavailable']);
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp176_reply(503,['ok'=>false,'error'=>'storage_unavailable']);

function pp176_get(string $path,string $token): ?array {
    $h=curl_init('https://peetripizza.ee/api/'.$path);
    $headers=['Accept: application/json'];
    if($token!=='')$headers[]='x-session-id: '.$token;
    curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>4,CURLOPT_TIMEOUT=>10,
        CURLOPT_HTTPHEADER=>$headers,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_USERAGENT=>'PeetriKitchenReadOnly/17.6']);
    $body=curl_exec($h);$code=(int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);$err=curl_errno($h);curl_close($h);
    if($err||$code!==200||!is_string($body)||strlen($body)>3000000)return null;
    $j=json_decode($body,true);
    return is_array($j)?$j:null;
}
function pp176_list(array $j): array {
    foreach(['data','items','toppings','products','simple_products','simpleProducts'] as $k)if(isset($j[$k])&&is_array($j[$k])){$j=$j[$k];break;}
    return array_is_list($j)?$j:array_values($j);
}
function pp176_name(array $row): string {
    foreach(['name_et','nameEt','name','title','label'] as $k){
        $v=$row[$k]??null;
        if(is_array($v))$v=$v['et']??$v['ee']??$v['en']??reset($v);
        if(is_string($v)&&trim($v)!=='')return function_exists('mb_substr')?mb_substr(trim($v),0,80,'UTF-8'):substr(trim($v),0,80);
    }
    return '';
}
function pp176_cache(string $file,int $ttl,callable $fetch): array {
    $old=null;
    if(is_file($file)){$old=json_decode((string)@file_get_contents($file),true);if(is_array($old)&&time()-(int)($old['_at']??0)<$ttl)return $old;}
    $new=$fetch();
    if(is_array($new)){$new['_at']=time();$tmp=$file.'.'.bin2hex(random_bytes(6)).'.tmp';if(@file_put_contents($tmp,json_encode($new,JSON_UNESCAPED_UNICODE))!==false){@rename($tmp,$file);@chmod($file,0600);}return $new;}
    if(is_array($old)){$old['_stale']=true;return $old;}
    return ['_error'=>true];
}

// 1) This pizzeria: own endpoint first, public list as a fallback.
$status=pp176_cache($dir.'/site-status-'.$id.'.json',60,static function()use($id,$token):?array{
    $p=$token!==''?pp176_get('pizzeria',$token):null;
    if(!is_array($p)||(int)($p['id']??0)!==$id){
        $all=pp176_get('pizzeria-list',$token);$p=null;
        if(is_array($all))foreach(pp176_list($all) as $row)if(is_array($row)&&(int)($row['id']??0)===$id){$p=$row;break;}
    }
    if(!is_array($p))return null;
    $ints=static fn($v)=>is_array($v)?array_values(array_filter(array_map('intval',$v),static fn($x)=>$x>0)):[];
    return ['wait'=>isset($p['wait_time_minutes'])?(int)$p['wait_time_minutes']:null,'closed'=>!empty($p['is_temporarily_closed']),
        'hours'=>is_array($p['opening_hours']??null)?$p['opening_hours']:[],'toppings'=>$ints($p['missingToppingIds']??null),'products'=>$ints($p['missingSimpleProductIds']??null),
        'name'=>is_string($p['name']??null)?substr($p['name'],0,80):''];
});
// 200 + ok:false: the website being unreachable is normal for this read-only view, not a tablet error.
if(!empty($status['_error']))pp176_reply(200,['ok'=>false,'error'=>'site_unavailable']);

// 2) Names for missing ids (catalog shared by all pizzerias, cached 1 h).
// v17.40: the catalog may be nested (categories → items) — every object with an id and a name is collected, at any depth.
// A catalog without any names is kept only 5 min, so a bad answer does not hide names for an hour.
function pp1740_collect(mixed $v,array &$out,int $depth=0): void {
    if(!is_array($v)||$depth>6)return;
    $container=false;foreach($v as $child)if(is_array($child)&&array_is_list($child)&&$child!==[]&&is_array($child[0]??null)){$container=true;break;}
    if(!$container&&!array_is_list($v)&&isset($v['id'])&&is_numeric($v['id'])){$n=pp176_name($v);$rid=(int)$v['id'];if($rid>0&&$n!==''&&!isset($out[(string)$rid]))$out[(string)$rid]=$n;}
    foreach($v as $child)if(is_array($child))pp1740_collect($child,$out,$depth+1);
}
$catFile=$dir.'/site-catalog.json';
if(is_file($catFile)){$c=json_decode((string)@file_get_contents($catFile),true);if(is_array($c)&&empty($c['toppings'])&&empty($c['products'])&&time()-(int)($c['_at']??0)>300)@unlink($catFile);}
$catalog=pp176_cache($catFile,3600,static function()use($token):?array{
    $out=['toppings'=>[],'products'=>[],'_shape'=>[]];$any=false;
    foreach(['toppings'=>'toppings','products'=>'simple-products'] as $key=>$path){
        $j=pp176_get($path,$token);if(!is_array($j)){$out['_shape'][$key]='no answer';continue;}$any=true;
        $out['_shape'][$key]=array_is_list($j)?('list '.count($j)):('keys '.implode(',',array_slice(array_map('strval',array_keys($j)),0,8)));
        $names=[];pp1740_collect($j,$names);$out[$key]=$names;
    }
    return $any?$out:null;
});
if(($_GET['debug']??'')==='names'){ // logged-in kitchen only: shape of the catalog answers, no secrets
    pp176_reply(200,['ok'=>true,'shape'=>$catalog['_shape']??null,'toppings'=>count($catalog['toppings']??[]),'products'=>count($catalog['products']??[]),'stale'=>!empty($catalog['_stale'])]);
}
$named=static function(array $ids,string $key)use($catalog):array{
    $out=[];foreach($ids as $i){$n=$catalog[$key][(string)$i]??'';$out[]=['id'=>$i,'name'=>$n!==''?$n:('#'.$i)];}
    usort($out,static fn($a,$b)=>strcmp($a['name'],$b['name']));return $out;
};
// Today's opening hours (1 = Monday ... 7 = Sunday, as the site uses).
$dow=(int)(new DateTimeImmutable('now',new DateTimeZone('Europe/Tallinn')))->format('N');$today=null;
foreach(($status['hours']??[]) as $h){if(is_array($h)&&in_array($dow,array_map('intval',(array)($h['days']??[])),true)){
    $today=($h['mode']??'')==='range'?sprintf('%02d:00–%02d:00',(int)($h['fromHour']??0),(int)($h['toHour']??0)):'suletud';break;}}
pp176_reply(200,['ok'=>true,'read_only'=>true,'stale'=>!empty($status['_stale']),'checked_at'=>(int)($status['_at']??time()),
    'wait_time_minutes'=>$status['wait']??null,'temporarily_closed'=>!empty($status['closed']),'today_hours'=>$today,
    'missing_toppings'=>$named($status['toppings']??[],'toppings'),'missing_products'=>$named($status['products']??[],'products')]);
