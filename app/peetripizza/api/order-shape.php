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
// v17.8: short code-like values only (letters, _ and -; no digits, so no phones/ids/addresses).
const PP178_ENUM_KEYS=['status','state','serving','delivery_type','deliveryType','type','order_type','orderType','service','service_type','packaging','package','size','pizzaSize','base','dough','doughType','rim','crust','cheese','payment_type','paymentType'];
function enum_values(array $data):array{
 $out=[];foreach(PP178_ENUM_KEYS as $k){$v=$data[$k]??null;
  if(is_array($v)){$v=$v['et']??$v['en']??$v['name']??$v['value']??null;}
  if(is_bool($v)){$out[$k]=$v?'true':'false';continue;}
  if(is_string($v)&&strlen($v)<=30&&preg_match('/^[A-Za-zÕÄÖÜõäöü _-]*$/u',$v))$out[$k]=$v;
 }return $out;
}
function shape(array $order):array{
 $out=['keys'=>safe_keys($order),'arrays'=>[],'objects'=>[],'values'=>enum_values($order)];
 $num=$order['order_number']??$order['number']??null;
 if(is_scalar($num))$out['order_number_format']=preg_replace(['/[0-9]/','/[A-Za-z]/'],['9','A'],substr((string)$num,0,24));
 foreach($order as $k=>$v){
  if(!is_string($k)||!preg_match('/^[A-Za-z][A-Za-z0-9_]{0,48}$/D',$k))continue;
  if(!is_array($v))continue;
  if(array_is_list($v)){
   $sample=null;$vals=[];$sub=[];foreach($v as $x){if(is_array($x)){$sample=safe_keys($x);$vals=enum_values($x);foreach($x as $sk=>$sv)if(is_string($sk)&&is_array($sv)&&preg_match('/^[A-Za-z][A-Za-z0-9_]{0,48}$/D',$sk))$sub[$sk]=array_is_list($sv)?(is_array($sv[0]??null)?safe_keys($sv[0]):'list'):safe_keys($sv);break;}}
   $out['arrays'][$k]=['count'=>count($v),'element_keys'=>$sample,'element_values'=>$vals,'element_nested'=>$sub];
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
$result=['ok'=>true,'diagnostic'=>'keys_and_counts_only','pizzeria_id'=>(int)$loc['id'],'total_orders'=>count($container),'samples'=>$sample];
if(($_GET['view']??'')==='html'){
 header('Content-Type: text/html; charset=utf-8');
 $json=htmlspecialchars(json_encode($result,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_INVALID_UTF8_SUBSTITUTE),ENT_QUOTES,'UTF-8');
 echo '<!doctype html><html lang="et"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Tellimuse väljad</title><style>body{font:15px/1.45 system-ui,sans-serif;margin:0;padding:16px;background:#f5f7f5;color:#14231a}h1{font-size:20px;margin:0 0 6px}p{margin:0 0 12px;color:#4b5a50}pre{background:#fff;border:1px solid #d7e2da;border-radius:12px;padding:14px;overflow:auto;font-size:13px;white-space:pre-wrap}a{color:#196a3b;font-weight:700}</style></head><body><h1>Peetri Pizza tellimuse väljad</h1><p>Ainult väljade nimed ja lühikesed koodid (nt <b>takeaway</b>, <b>large</b>). Klientide nimesid, telefone ega aadresse siin ei ole. Tee sellest ekraanipilt ja saada arendajale.</p><pre>'.$json.'</pre><p><a href="../dashboard.php">← Tagasi töölauale</a></p></body></html>';
 exit;
}
echo json_encode(['ok'=>true,'diagnostic'=>'keys_and_counts_only','pizzeria_id'=>(int)$loc['id'],'total_orders'=>count($container),'samples'=>$sample],JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
