<?php
/** Peetri Pizza v17.66 — isolated read-only integration audit. No upstream writes. */
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login(false);
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; style-src 'nonce-pp-audit-v1766'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') { http_response_code(405); exit; }
pp_start();
$loc=$_SESSION['pp_pizzeria']??null;
$token=$_SESSION['pp_upstream_session']??null;
$branch=is_array($loc)?(int)($loc['id']??0):0;
$hasSession=is_string($token)&&strlen($token)>=12;
$paths=[
 'orders'=>['path'=>'orders','label'=>'LIVE — tellimused','fields'=>['id','number','status','items','created','deadline']],
 'branch'=>['path'=>'pizzeria','label'=>'Filiaali olek ja ooteaeg','fields'=>['id','wait_time_minutes','is_temporarily_closed','missingToppingIds','missingSimpleProductIds']],
 'toppings'=>['path'=>'toppings','label'=>'Lisandite kataloog','fields'=>['id','name','name_et','title']],
 'products'=>['path'=>'simple-products','label'=>'Toodete kataloog','fields'=>['id','name','name_et','title']],
 'dough'=>['path'=>'internal-orders/todays-orders','label'=>'Tänased taignatellimused','fields'=>['date','items','product_id','quantity']],
];
// GET diagnostic results are generated on demand; no tokens, payloads or customer values are persisted.
if (isset($_GET['probe'])) {
 header('Content-Type: application/json; charset=utf-8');
 $key=(string)$_GET['probe'];
 if (!isset($paths[$key])) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'unknown_probe']); exit; }
 if ($branch<1 || !$hasSession) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'branch_session_required']); exit; }
 if (!function_exists('curl_init')) {http_response_code(503);echo json_encode(['ok'=>false,'error'=>'php_curl_unavailable']);exit;}
 session_write_close();
 $url='https://peetripizza.ee/api/'.$paths[$key]['path'];
 $ch=curl_init($url);
 curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>4,CURLOPT_TIMEOUT=>9,
  CURLOPT_HTTPHEADER=>['Accept: application/json','x-session-id: '.$token],CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
  CURLOPT_USERAGENT=>'PeetriKitchenReadOnlyAudit/17.66',CURLOPT_MAXREDIRS=>0]);
 $raw=curl_exec($ch);$http=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);$errno=curl_errno($ch);curl_close($ch);
 unset($token);
 $result=['ok'=>false,'endpoint'=>'GET /api/'.$paths[$key]['path'],'http_status'=>$http,'method'=>'GET','read_only'=>true];
 if ($errno!==0) $result['error']='network_or_tls_error';
 elseif ($http!==200) $result['error']=in_array($http,[401,403],true)?'upstream_access_denied':'upstream_http_error';
 elseif (!is_string($raw)||strlen($raw)>4000000) $result['error']='unexpected_payload_size';
 else {
  $json=json_decode($raw,true,48);
  if (!is_array($json)) $result['error']='invalid_json_or_schema';
  else {
   $result['ok']=true;
   $result['response_shape']=array_is_list($json)?'list':'object';
   $value=$json;
   foreach (['orders','data','items'] as $wrapper)if (!array_is_list($value)&&isset($value[$wrapper])&&is_array($value[$wrapper])){$value=$value[$wrapper];$result['collection_wrapper']=$wrapper;break;}
   $result['entry_count']=array_is_list($value)?count($value):null;
   $sample=array_is_list($value)?(count($value)&&is_array($value[0])?$value[0]:[]):$value;
   // Only field presence flags from a fixed allowlist; no original values or unknown keys.
   $present=[];
   foreach ($paths[$key]['fields'] as $field)$present[$field]=array_key_exists($field,$sample);
   $result['known_fields_present']=$present;
   $result['contains_data']=count($value)>0;
  }
 }
 unset($raw,$json,$value,$sample);
 echo json_encode($result,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;
}
header('Content-Type: text/html; charset=utf-8');
$branchName=is_array($loc)?(string)($loc['name']??''):'—';
function h(string $s):string{return htmlspecialchars($s,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
?><!doctype html><html lang="et"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Peetri Pizza — API audit</title>
<style nonce="pp-audit-v1766">:root{font-family:system-ui,-apple-system,sans-serif;color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#10141b;color:#edf2f6}main{max-width:840px;margin:auto;padding:24px 16px 60px}header{display:flex;align-items:center;justify-content:space-between;gap:12px}a{color:#82c8a1}h1{font-size:25px;margin:20px 0 10px}h2{font-size:17px;margin:0 0 7px}.sub{color:#abb9c8;line-height:1.6}.card{background:#19222d;border:1px solid #303e4c;border-radius:14px;padding:18px;margin:14px 0}.row{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap}.button{font:inherit;font-weight:700;border:0;border-radius:10px;background:#55ba81;color:#062113;padding:12px 16px;cursor:pointer}.button:disabled{opacity:.4;cursor:not-allowed}pre{white-space:pre-wrap;overflow-wrap:anywhere;color:#cbd8e5;font-size:12px;line-height:1.5;background:#101820;border-radius:8px;padding:12px;min-height:30px}.tag{color:#8fd1ab;font-weight:700}.warning{border-left:3px solid #e4ad58;padding-left:13px}.small{font-size:13px}</style></head><body><main>
<header><strong>PEETRI PIZZA · AUDIT 17.66</strong><a href="/peetripizza/">← Tagasi</a></header><h1>API ühenduse diagnostika</h1>
<p class="sub">Ainult lugemine. Kontrollib viit juba kasutusel olevat ametliku süsteemi GET-aadressi. Ei saada tellimuste staatust, ooteaega ega taignatellimusi tagasi.</p>
<div class="card"><div><span class="tag">Filiaal:</span> <?=h($branchName)?><?=($branch>0?' (#'.(int)$branch.')':'')?> · <span class="tag">Ametlik sessioon:</span> <?=$hasSession?'olemas':'puudub'?></div></div>
<p class="sub small warning">Tulemused ei sisalda kliendiandmeid, paroole ega sessioonivõtmeid. Ära jaga brauseri küpsiseid või võrgupäringute autentimispäiseid. Testid tehakse üksnes nupuvajutusel.</p>
<?php foreach($paths as $id=>$p): ?><section class="card"><div class="row"><div><h2><?=h($p['label'])?></h2><span class="sub small">GET /api/<?=h($p['path'])?></span></div><form method="get"><button class="button" type="submit" name="probe" value="<?=h($id)?>" <?=$branch<1||!$hasSession?'disabled':''?>>Kontrolli</button></form></div></section><?php endforeach; ?>
<div class="card"><h2>Mida see EI kontrolli</h2><p class="sub">Tellimuse vastuvõtmise, valmis märkimise, üleandmise, ooteaja muutmise, taigna tellimise või lisandite muutmise kirjutusõigusi. Selleks on vaja ametliku süsteemi dokumentatsiooni või loa alusel jälgida päringuid testkeskkonnas.</p></div>
<?php if(isset($_GET['probe'])): ?><div class="card"><h2>Kontrolli tulemus</h2><p class="sub">Ava sama aadressi lõppu <code>?probe=orders</code> (või vali ülal vastav nupp) — näidatakse ainult anonüümne JSON kokkuvõte.</p></div><?php endif; ?>
</main></body></html>
