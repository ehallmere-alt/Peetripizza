<?php
declare(strict_types=1);
/*
 * Peetri Pizza v17.48 — dough already ordered TODAY through the official Peetri Pizza panel (read-only).
 * Upstream: GET https://peetripizza.ee/api/internal-orders/todays-orders
 *   seen 2026-11-12: [{"date":"13:46:26","items":[{"product_id":"jahutatud","quantity":10}]}]
 * GET only, never writes anything to peetripizza.ee. Cached per pizzeria for 2 min in private_data.
 * If the site does not answer our server (other login, network), the reply is ok:false and the tablet shows nothing.
 */
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
function pp1748_reply(int $code,array $body): never {http_response_code($code);echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET')pp1748_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
pp_start();
$loc=$_SESSION['pp_pizzeria']??null;$token=$_SESSION['pp_upstream_session']??null;
$id=is_array($loc)?(int)($loc['id']??0):0;
if($id<1)pp1748_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$token=is_string($token)&&strlen($token)>=12?$token:'';
session_write_close();
if($token==='')pp1748_reply(200,['ok'=>false,'error'=>'no_site_login']);
if(!function_exists('curl_init'))pp1748_reply(200,['ok'=>false,'error'=>'curl_unavailable']);
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp1748_reply(200,['ok'=>false,'error'=>'storage_unavailable']);
$tz=new DateTimeZone('Europe/Tallinn');$today=(new DateTimeImmutable('now',$tz))->format('Y-m-d');
$file=$dir.'/dough-site-'.$id.'.json';
$old=is_file($file)?json_decode((string)@file_get_contents($file),true):null;
if(is_array($old)&&($old['day']??'')===$today&&time()-(int)($old['_at']??0)<120)pp1748_reply(200,['ok'=>true,'orders'=>$old['orders']??[],'cached'=>true]);

$h=curl_init('https://peetripizza.ee/api/internal-orders/todays-orders');
curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>4,CURLOPT_TIMEOUT=>10,
    CURLOPT_HTTPHEADER=>['Accept: application/json','x-session-id: '.$token],CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_USERAGENT=>'PeetriKitchenReadOnly/17.48']);
$body=curl_exec($h);$code=(int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);$err=curl_errno($h);curl_close($h);
$j=(!$err&&$code===200&&is_string($body)&&strlen($body)<500000)?json_decode($body,true):null;
if(!is_array($j)){
    if(is_array($old)&&($old['day']??'')===$today)pp1748_reply(200,['ok'=>true,'orders'=>$old['orders']??[],'stale'=>true]);
    pp1748_reply(200,['ok'=>false,'error'=>'site_unavailable','http'=>$code]);
}
if(isset($j['data'])&&is_array($j['data']))$j=$j['data'];
$orders=[];
foreach((array_is_list($j)?$j:[]) as $row){
    if(!is_array($row))continue;
    $t=is_string($row['date']??null)&&preg_match('/(\d{1,2}):(\d{2})/',$row['date'],$m)?sprintf('%02d:%s',(int)$m[1],$m[2]):'';
    $items=[];
    foreach((is_array($row['items']??null)?$row['items']:[]) as $it){
        if(!is_array($it))continue;
        $p=$it['product_id']??$it['product']??$it['name']??'';$q=$it['quantity']??$it['qty']??0;
        if(!is_scalar($p)||!is_numeric($q))continue;
        $p=substr(preg_replace('/[^\p{L}\p{N} _.-]/u','',(string)$p)??'',0,40);if($p==='')continue;
        $items[]=['product'=>$p,'qty'=>(int)$q];
    }
    if($items)$orders[]=['time'=>$t,'items'=>$items];
    if(count($orders)>=20)break;
}
$save=['day'=>$today,'orders'=>$orders,'_at'=>time()];
$tmp=$file.'.'.bin2hex(random_bytes(6)).'.tmp';
if(@file_put_contents($tmp,json_encode($save,JSON_UNESCAPED_UNICODE))!==false){@rename($tmp,$file);@chmod($file,0600);}
pp1748_reply(200,['ok'=>true,'orders'=>$orders]);
