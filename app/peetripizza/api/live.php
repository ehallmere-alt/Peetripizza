<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
require_once __DIR__.'/customer-name.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function fail(int $code,string $message): never {http_response_code($code);echo json_encode(['ok'=>false,'error'=>$message]);exit;}
if ($_SERVER['REQUEST_METHOD']!=='GET') fail(405,'method_not_allowed');
if (!function_exists('curl_init')) fail(503,'curl_unavailable');
// Each kitchen login has its own upstream session. No global restaurant password.
pp_start();
$loc=$_SESSION['pp_pizzeria']??null;
$token=$_SESSION['pp_upstream_session']??null;
if(!is_array($loc)||!is_string($token)||strlen($token)<12)fail(401,'pizzeria_login_required');
$id=(int)($loc['id']??0);
if($id<1)fail(401,'pizzeria_login_required');
// Free the staff session lock before the remote GET; the UI can make other requests meanwhile.
session_write_close();
// Never cache one pizzeria's orders for another employee or restaurant.
function request_json(string $url,?array $payload,array $headers): array {
 $h=curl_init($url);
 curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>12,CURLOPT_HTTPHEADER=>array_merge(['Accept: application/json'],$headers),CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_MAXREDIRS=>0,CURLOPT_USERAGENT=>'PeetriKitchenReadOnly/1.0']);
 if($payload!==null)curl_setopt_array($h,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode($payload),CURLOPT_HTTPHEADER=>array_merge(['Accept: application/json','Content-Type: application/json'],$headers)]);
 $body=curl_exec($h);$status=curl_getinfo($h,CURLINFO_RESPONSE_CODE);$err=curl_errno($h);curl_close($h);
 // v17.5: an expired peetripizza.ee login is not a network error - tell the tablet to log in again.
 if(!$err&&($status===401||$status===403))throw new DomainException('upstream_session_expired');
 if($err||$status!==200||!is_string($body)||strlen($body)>4000000)throw new RuntimeException('upstream_unavailable');
 $json=json_decode($body,true,64,JSON_THROW_ON_ERROR);
 if(!is_array($json))throw new RuntimeException('upstream_invalid');
 return $json;
}
function orders_list(array $json):array {
 if(isset($json['orders'])&&is_array($json['orders']))$json=$json['orders'];
 elseif(isset($json['data'])&&is_array($json['data']))$json=$json['data'];
 if(array_is_list($json))return $json;
 $values=array_values($json);
 if(count($values)&&count(array_filter($values,'is_array'))===count($values))return $values;
 throw new RuntimeException('upstream_schema_changed');
}
require_once __DIR__.'/live-normalize-v150.php';
require_once __DIR__.'/tracking-store.php';

try {
 $json=request_json('https://peetripizza.ee/api/orders',null,['x-session-id: '.$token]);
 $list=orders_list($json);
 if(count($list)>3000)throw new RuntimeException('too_many_orders');
 $safe=[];$seen=[];$duplicates=0;
 foreach($list as $o)if(is_array($o)){
  $clean=pp150_clean_order($o);
  if($clean['status']==='cancelled')continue;
  $key=(string)($clean['id']??'');
  if(!preg_match('/^live-[a-f0-9]{24}$/D',$key))continue;
  if(isset($seen[$key])){$duplicates++;continue;}
  $seen[$key]=true;$safe[]=$clean;
 }
 // First occurrence wins; never merge conflicting rows for the same vendor identifier.
 // Dedup occurs before arrival notifications, internal status overlays and tracking snapshots.
 try { pp155_capture_live($id,$safe); } catch (Throwable $e) { /* Staff LIVE GET still works if tracking storage fails; share-link creation fails closed. */ }
 echo json_encode(['ok'=>true,'mode'=>'live','read_only'=>true,'pizzeria'=>['id'=>$id,'name'=>(string)($loc['name']??'')],'orders'=>$safe,'duplicates_ignored'=>$duplicates,'updated_at'=>time()],JSON_UNESCAPED_UNICODE);

} catch(DomainException $e){fail(401,'upstream_session_expired');
} catch(Throwable $e){error_log('[Peetri v16.8] LIVE read failed: '.get_class($e));fail(502,'upstream_unavailable_or_changed');}
