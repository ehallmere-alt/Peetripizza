<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function pp149_result(int $status,string $state, array $details=[]): never {
 http_response_code($status);
 echo json_encode(array_merge(['ok'=>$status===200,'state'=>$state],$details),JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
 exit;
}
if(($_SERVER['REQUEST_METHOD']??'')!=='GET')pp149_result(405,'method_not_allowed');
pp_start();
$loc=$_SESSION['pp_pizzeria']??null;
$token=$_SESSION['pp_upstream_session']??null;
if(!is_array($loc)||!(int)($loc['id']??0))pp149_result(401,'pizzeria_login_required');
if(!is_string($token)||strlen($token)<12)pp149_result(401,'upstream_session_missing');
if(!function_exists('curl_init'))pp149_result(503,'curl_unavailable');
$last=(int)($_SESSION['pp149_health_checked_at']??0);
if(time()-$last<20)pp149_result(429,'too_many_checks',['retry_after'=>20-(time()-$last)]);
$_SESSION['pp149_health_checked_at']=time();
$id=(int)$loc['id'];
$name=substr((string)($loc['name']??''),0,100);
session_write_close();
$start=microtime(true);
$h=curl_init('https://peetripizza.ee/api/orders');
curl_setopt_array($h,[
 CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_MAXREDIRS=>0,
 CURLOPT_CONNECTTIMEOUT=>4,CURLOPT_TIMEOUT=>12,
 CURLOPT_HTTPHEADER=>['Accept: application/json','x-session-id: '.$token],
 CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
 CURLOPT_USERAGENT=>'PeetriKitchenReadOnlyHealth/1.0'
]);
$body=curl_exec($h);
$code=(int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);
$error=(int)curl_errno($h);
curl_close($h);
$latency=(int)round((microtime(true)-$start)*1000);
if($error||!is_string($body))pp149_result(502,'network_error',['latency_ms'=>$latency]);
if($code===401||$code===403)pp149_result(401,'upstream_auth_failed',['latency_ms'=>$latency]);
if($code!==200||strlen($body)>4000000)pp149_result(502,'upstream_error',['upstream_status'=>$code,'latency_ms'=>$latency]);
$decoded=json_decode($body,true);
if(!is_array($decoded))pp149_result(502,'invalid_json',['latency_ms'=>$latency]);
$list=$decoded['orders']??$decoded['data']??$decoded;
if(!is_array($list))pp149_result(502,'unexpected_schema',['latency_ms'=>$latency]);
if(!array_is_list($list))$list=array_values($list);
if(count($list)>3000)pp149_result(502,'too_many_orders',['latency_ms'=>$latency]);
foreach($list as $order){if(!is_array($order))pp149_result(502,'unexpected_schema',['latency_ms'=>$latency]);}
pp149_result(200,'connected',['pizzeria'=>['id'=>$id,'name'=>$name],
 'orders_count'=>count($list),'latency_ms'=>$latency,'checked_at'=>time(),'read_only'=>true]);
