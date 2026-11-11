<?php
declare(strict_types=1);
// Authenticated, read-only upstream schema diagnostic. NEVER emits customer/order values.
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
if(($_SERVER['REQUEST_METHOD']??'')!=='GET'){http_response_code(405);echo '{"ok":false,"error":"method_not_allowed"}';exit;}
pp_start();
$loc=$_SESSION['pp_pizzeria']??null;$token=$_SESSION['pp_upstream_session']??null;
if(!is_array($loc)||!is_string($token)||strlen($token)<12){http_response_code(401);echo '{"ok":false,"error":"pizzeria_login_required"}';exit;}
if(!function_exists('curl_init')){http_response_code(503);echo '{"ok":false,"error":"curl_unavailable"}';exit;}
$last=(int)($_SESSION['pp_shape_checked_at']??0);
if(time()-$last<30){http_response_code(429);echo '{"ok":false,"error":"retry_after_30_seconds"}';exit;}
$_SESSION['pp_shape_checked_at']=time();
session_write_close();
function safe_keys(array $data):array{
 $out=[];foreach(array_keys($data) as $k){
  if(!is_string($k)||!preg_match('/^[A-Za-z][A-Za-z0-9_]{0,48}$/D',$k))continue;
  $out[]=$k;if(count($out)>=45)break;
 }return $out;
}
function shape(array $order):array{
 $out=['keys'=>safe_keys($order),'arrays'=>[],'objects'=>[]];
 foreach($order as $k=>$v){
  if(!is_string($k)||!preg_match('/^[A-Za-z][A-Za-z0-9_]{0,48}$/D',$k))continue;
  if(!is_array($v))continue;
  if(array_is_list($v)){
   $sample=null;foreach($v as $x){if(is_array($x)){$sample=safe_keys($x);break;}}
   $out['arrays'][$k]=['count'=>count($v),'element_keys'=>$sample];
  }else $out['objects'][$k]=safe_keys($v);
  if(count($out['arrays'])+count($out['objects'])>=18)break;
 }
 return $out;
}
$h=curl_init('https://peetripizza.ee/api/orders');
curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>12,CURLOPT_HTTPHEADER=>['Accept: application/json','x-session-id: '.$token],CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_USERAGENT=>'PeetriKitchenReadOnly/1.0']);
$body=curl_exec($h);$code=curl_getinfo($h,CURLINFO_RESPONSE_CODE);$err=curl_errno($h);curl_close($h);
if($err||$code!==200||!is_string($body)||strlen($body)>4000000){http_response_code(502);echo '{"ok":false,"error":"upstream_unavailable"}';exit;}
$data=json_decode($body,true);
if(!is_array($data)){http_response_code(502);echo '{"ok":false,"error":"invalid_upstream_json"}';exit;}
$container=$data['orders']??$data['data']??$data;
if(!is_array($container)){http_response_code(502);echo '{"ok":false,"error":"invalid_orders_container"}';exit;}
if(!array_is_list($container))$container=array_values($container);
$sample=[];foreach($container as $order){
 if(!is_array($order))continue;
 $sample[]=shape($order);
 if(count($sample)>=3)break;
}
echo json_encode(['ok'=>true,'diagnostic'=>'keys_and_counts_only','pizzeria_id'=>(int)$loc['id'],'total_orders'=>count($container),'samples'=>$sample],JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
