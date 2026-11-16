<?php
declare(strict_types=1);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
set_exception_handler(function(Throwable $e): void {
    error_log('[Peetri Stage4] '.get_class($e).': '.$e->getMessage());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode([
        'ok'=>false,
        'error'=>'stage4_runtime_error',
        'type'=>get_class($e)
    ]);
    exit;
});
require_once dirname(__DIR__).'/auth/bootstrap.php';
require_once __DIR__.'/live-normalize-v150.php';
require_once __DIR__.'/customer-name.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function respond(int $code,array $data):never {
 http_response_code($code);
 echo json_encode($data,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
 exit;
}
if(($_SERVER['REQUEST_METHOD']??'')!=='GET')
 respond(405,['ok'=>false,'error'=>'method_not_allowed']);

pp_start();
$p=$_SESSION['pp_pizzeria']??null;
$token=$_SESSION['pp_upstream_session']??null;
if(!is_array($p)||(int)($p['id']??0)<1||
   !is_string($token)||strlen($token)<12)
 respond(401,['ok'=>false,'error'=>'login_required']);
session_write_close();

if(!function_exists('curl_init'))
 respond(503,['ok'=>false,'error'=>'curl_unavailable']);

$h=curl_init('https://peetripizza.ee/api/orders');
curl_setopt_array($h,[
 CURLOPT_RETURNTRANSFER=>true,
 CURLOPT_FOLLOWLOCATION=>false,
 CURLOPT_CONNECTTIMEOUT=>5,
 CURLOPT_TIMEOUT=>12,
 CURLOPT_HTTPHEADER=>[
  'Accept: application/json',
  'X-Session-Id: '.$token
 ],
 CURLOPT_SSL_VERIFYPEER=>true,
 CURLOPT_SSL_VERIFYHOST=>2
]);
$body=curl_exec($h);
$http=(int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);
$err=curl_errno($h);
curl_close($h);
unset($token);

if($err||$http!==200||!is_string($body)||
   strlen($body)>4000000)
 respond(502,['ok'=>false,'error'=>'upstream_unavailable']);

$j=json_decode($body,true);
if(!is_array($j))
 respond(502,['ok'=>false,'error'=>'invalid_json']);
$rows=$j['orders']??$j['data']??$j;
if(!is_array($rows))
 respond(502,['ok'=>false,'error'=>'invalid_orders']);
if(!array_is_list($rows))$rows=array_values($rows);
if(count($rows)>3000)
 respond(502,['ok'=>false,'error'=>'too_many_orders']);

$result=[
 'total'=>0,
 'mapped'=>0,
 'missing_secure_id'=>0,
 'duplicate_local_id'=>0,
 'duplicate_secure_id'=>0,
 'invalid_local_id'=>0,
 'status_mismatch'=>0
];
$localSeen=[];
$secureSeen=[];

foreach($rows as $row){
 if(!is_array($row))continue;
 $result['total']++;
 $local=pp150_clean_order($row);
 $localId=$local['id']??'';
 $secure=$row['secure_id']??$row['secureId']??null;

 if(!is_string($localId)||
    !preg_match('/^live-[a-f0-9]{24}$/D',$localId)){
  $result['invalid_local_id']++;
  continue;
 }
 if(isset($localSeen[$localId]))
  $result['duplicate_local_id']++;
 $localSeen[$localId]=true;

 if(!is_scalar($secure)||(string)$secure===''){
  $result['missing_secure_id']++;
  continue;
 }
 $secureHash=hash('sha256',(string)$secure);
 if(isset($secureSeen[$secureHash]))
  $result['duplicate_secure_id']++;
 $secureSeen[$secureHash]=true;

 $result['mapped']++;
}

$ready=$result['total']>0
 &&$result['mapped']===$result['total']
 &&$result['duplicate_local_id']===0
 &&$result['duplicate_secure_id']===0
 &&$result['invalid_local_id']===0;

respond(200,[
 'ok'=>true,
 'version'=>'17.68-stage4',
 'read_only'=>true,
 'mapping_consistent'=>$ready,
 'mapping'=>$result,
 'official_write_enabled'=>false,
 'note'=>'No identifiers or customer data returned'
]);
