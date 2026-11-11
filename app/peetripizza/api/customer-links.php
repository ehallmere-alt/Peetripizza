<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
require_once __DIR__.'/tracking-store.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
function linkReply(int $status,array $data): never {http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE);exit;}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')linkReply(405,['ok'=>false,'error'=>'method_not_allowed']);
if(!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))linkReply(403,['ok'=>false,'error'=>'invalid_csrf']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>2048)linkReply(413,['ok'=>false,'error'=>'too_large']);
$body=json_decode((string)file_get_contents('php://input'),true);
$order=$body['order_id']??null;
if(!is_array($body)||!is_string($order)||!preg_match('/^live-[a-f0-9]{24}$/D',$order))linkReply(422,['ok'=>false,'error'=>'invalid_order']);
$loc=$_SESSION['pp_pizzeria']??null;$tenant=is_array($loc)?filter_var($loc['id']??null,FILTER_VALIDATE_INT):false;
if(!$tenant||$tenant<1)linkReply(403,['ok'=>false,'error'=>'pizzeria_required']);
try {
    $idx=pp155_locked((int)$tenant,'live-index',false,static fn($d)=>$d);
    $entry=$idx['orders'][$order]??null;
    if(!is_array($entry)||(int)($entry['seen']??0)<time()-90)linkReply(409,['ok'=>false,'error'=>'live_order_not_recent']);
    $raw=bin2hex(random_bytes(32));$token=$tenant.'.'.$raw;$hash=hash('sha256',$token);$now=time();
    pp155_locked((int)$tenant,'tracking-links',true,static function(array &$data)use($hash,$order,$now):void{
        $all=is_array($data['links']??null)?$data['links']:[];
        $all=array_filter($all,static fn($v)=>is_array($v)&&(int)($v['expires']??0)>$now);
        if(count($all)>=900)throw new RuntimeException('too_many_links');
        $all[$hash]=['order_id'=>$order,'expires'=>$now+86400,'created'=>$now];
        $data=['links'=>$all];
    });
    $path='/peetripizza/tracking.php?t='.rawurlencode($token);
    linkReply(200,['ok'=>true,'url'=>$path,'expires_at'=>gmdate('c',$now+86400),'delivery'=>'manual_only']);
} catch(Throwable $e) {linkReply(503,['ok'=>false,'error'=>'link_storage_unavailable']);}
