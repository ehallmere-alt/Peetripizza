<?php
declare(strict_types=1);
require_once __DIR__.'/tracking-store.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: none');
function trackReply(int $status,array $payload): never {http_response_code($status);echo json_encode($payload,JSON_UNESCAPED_UNICODE);exit;}
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET')trackReply(405,['ok'=>false,'error'=>'method_not_allowed']);
$token=$_GET['t']??'';
if(!is_string($token)||strlen($token)>75||!preg_match('/^([1-9][0-9]{0,6})\.([a-f0-9]{64})$/D',$token,$m))trackReply(404,['ok'=>false,'error'=>'not_found']);
$tenant=(int)$m[1];$hash=hash('sha256',$token);
// Do not create per-tenant lock files for arbitrary unauthenticated guesses.
if(!is_file(dirname(__DIR__).'/private_data/tracking-links-'.$tenant.'.json'))trackReply(404,['ok'=>false,'error'=>'not_found']);
try {
    $links=pp155_locked($tenant,'tracking-links',false,static fn($d)=>$d);
    $rec=$links['links'][$hash]??null;
    if(!is_array($rec)||(int)($rec['expires']??0)<=time())trackReply(404,['ok'=>false,'error'=>'not_found']);
    $id=$rec['order_id']??'';
    if(!is_string($id)||!preg_match('/^live-[a-f0-9]{24}$/D',$id))trackReply(404,['ok'=>false,'error'=>'not_found']);
    $idx=pp155_locked($tenant,'live-index',false,static fn($d)=>$d);
    $official=$idx['orders'][$id]??null;
    if(!is_array($official))trackReply(404,['ok'=>false,'error'=>'not_found']);
    $local=pp155_read_json(pp155_dir().'/internal-status-'.$tenant.'.json');
    $pickup=pp155_read_json(pp155_dir().'/pickup-'.$tenant.'.json');
    $own=is_array($local['records'][$id]??null)?$local['records'][$id]:[];
    $hand=is_array($pickup['live:'.$id]??null)?$pickup['live:'.$id]:[];
    $ranks=['new'=>0,'active'=>1,'done'=>2];
    $origin=$official['status']??'new';if(!isset($ranks[$origin]))$origin='new';
    $state=$origin;$source='official_read';
    $internal=$own['status']??'';
    if(isset($ranks[$internal])&&$ranks[$internal]>$ranks[$state]){$state=$internal;$source='internal_kitchen';}
    if(!empty($hand['handed_at'])){$state='handed';$source='internal_pickup';}
    $changed=max((int)($official['seen']??0),strtotime((string)($own['changed_at']??''))?:0,strtotime((string)($hand['changed_at']??''))?:0);
    $fresh=(int)($official['seen']??0)>=time()-45;
    trackReply(200,['ok'=>true,'status'=>$state,'source'=>$source,'upstream_write_enabled'=>false,
        'fresh'=>$fresh,'updated_at'=>gmdate('c',$changed),'expires_at'=>gmdate('c',(int)$rec['expires']),
        'message'=>'Status shown from kitchen read-only data and internal updates; official customer status is not updated by this app.']);
} catch(Throwable $e){trackReply(503,['ok'=>false,'error'=>'temporarily_unavailable']);}
