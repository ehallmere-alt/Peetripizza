<?php
/** Peetri Pizza v16.9 (+v17.14 edit window, change details): internal-only dough ordering, delivery dates, safe status history. */
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function pp_dough_reply(int $http,array $data): never {
 http_response_code($http);
 echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
 exit;
}
$loc=$_SESSION['pp_pizzeria']??null;
$id=is_array($loc)?filter_var($loc['id']??null,FILTER_VALIDATE_INT):false;
if(!$id||$id<1)pp_dough_reply(403,['ok'=>false,'error'=>'pizzeria_required']);
$catalog=[
 'chilled'=>['name'=>'Jahutatud pitsapall','pack'=>15,'frozen'=>false],
 'frozen'=>['name'=>'Külmutatud pitsapall','pack'=>60,'frozen'=>true],
 'whole20'=>['name'=>'Täistera 20 cm','pack'=>30,'frozen'=>false],
 'whole28'=>['name'=>'Täistera 28 cm','pack'=>30,'frozen'=>false],
 'flour'=>['name'=>'Puistejahu','pack'=>25,'frozen'=>false],
 'go'=>['name'=>'GO pitsapõhjad','pack'=>6,'frozen'=>false],
 'glutenfree'=>['name'=>'Gluteenivabast jahust põhi','pack'=>30,'frozen'=>false],
];
// v17.14: an order can be edited until the supplier cut-off (first 15:05 after it was created).
const PP_DOUGH_EDIT_CUTOFF='15:05';
function pp_dough_edit_until(array $row): ?string {
 $tz=new DateTimeZone('Europe/Tallinn');
 try{$created=new DateTimeImmutable((string)($row['created_at']??''));}catch(Throwable $e){return null;}
 $created=$created->setTimezone($tz);
 [$h,$m]=array_map('intval',explode(':',PP_DOUGH_EDIT_CUTOFF));
 $cut=$created->setTime($h,$m);
 if($created>=$cut)$cut=$cut->modify('+1 day');
 return $cut->format(DATE_ATOM);
}
function pp_dough_editable(array $row,DateTimeImmutable $now): bool {
 if(!in_array((string)($row['status']??''),['Tellitud','Salvestatud'],true))return false;
 $until=pp_dough_edit_until($row);
 return $until!==null&&$now<new DateTimeImmutable($until);
}
$method=$_SERVER['REQUEST_METHOD']??'GET';
if(!in_array($method,['GET','POST'],true))pp_dough_reply(405,['ok'=>false,'error'=>'method_not_allowed']);
if($method==='POST'){
 if(!pp_csrf_valid((string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))pp_dough_reply(403,['ok'=>false,'error'=>'invalid_csrf']);
 if((int)($_SERVER['CONTENT_LENGTH']??0)>8192)pp_dough_reply(413,['ok'=>false,'error'=>'too_large']);
 if(!preg_match('~^application/json(?:\s*;|\s*$)~i',(string)($_SERVER['CONTENT_TYPE']??'')))pp_dough_reply(415,['ok'=>false,'error'=>'json_required']);
}
$dir=dirname(__DIR__).'/private_data';
if(!is_dir($dir)&&!@mkdir($dir,0700,true))pp_dough_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$file=$dir.'/dough-'.$id.'.json';
$lock=@fopen($dir.'/dough-'.$id.'.lock','c');
if(!$lock||!flock($lock,$method==='GET'?LOCK_SH:LOCK_EX))pp_dough_reply(503,['ok'=>false,'error'=>'storage_unavailable']);
$rows=[];
if(is_file($file)){
 $raw=@file_get_contents($file);
 if(!is_string($raw)||strlen($raw)>2500000)pp_dough_reply(503,['ok'=>false,'error'=>'storage_invalid']);
 $decoded=json_decode($raw,true);
 if(!is_array($decoded)||!array_is_list($decoded))pp_dough_reply(503,['ok'=>false,'error'=>'storage_invalid']);
 $rows=$decoded;
}
if($method==='GET'){
 $nowG=new DateTimeImmutable('now',new DateTimeZone('Europe/Tallinn'));
 $list=array_slice(array_reverse($rows),0,100);
 foreach($list as &$row){if(is_array($row)){$row['editable_until']=pp_dough_edit_until($row);$row['editable']=pp_dough_editable($row,$nowG);}}
 unset($row);
 pp_dough_reply(200,['ok'=>true,'orders'=>$list,'edit_cutoff'=>PP_DOUGH_EDIT_CUTOFF,'server_time'=>$nowG->format(DATE_ATOM),'catalog'=>$catalog,'status_flow'=>['Tellitud','Kinnitatud','Tarnitud'],'scope'=>'internal_only']);
}
$input=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($input))pp_dough_reply(422,['ok'=>false,'error'=>'invalid_request']);
$action=$input['action']??'create';
if(!is_string($action)||!in_array($action,['create','edit','status'],true))pp_dough_reply(422,['ok'=>false,'error'=>'invalid_action']);
$now=new DateTimeImmutable('now',new DateTimeZone('Europe/Tallinn'));
$oid=$input['id']??'';
if($action!=='create'&&(!is_string($oid)||!preg_match('/^[a-f0-9]{16}$/D',$oid)))pp_dough_reply(422,['ok'=>false,'error'=>'invalid_id']);
$expected=$input['expected_revision']??null;
if($action!=='create'&&(!is_int($expected)||$expected<0))pp_dough_reply(422,['ok'=>false,'error'=>'revision_required']);
$idx=null;
if($action!=='create'){
 foreach($rows as $i=>$row){if(is_array($row)&&($row['id']??'')===$oid){$idx=$i;break;}}
 if($idx===null)pp_dough_reply(404,['ok'=>false,'error'=>'not_found']);
 if((int)($rows[$idx]['revision']??0)!==$expected)pp_dough_reply(409,['ok'=>false,'error'=>'revision_conflict']);
}
if($action==='status'){
 $status=$input['status']??null;
 $old=(string)($rows[$idx]['status']??'Salvestatud');
 $allowed=['Salvestatud'=>['Kinnitatud','Tühistatud'],'Tellitud'=>['Kinnitatud','Tühistatud'],'Kinnitatud'=>['Tarnitud','Tühistatud'],'Töös'=>['Tarnitud','Tühistatud']];
 if(!is_string($status)||!in_array($status,$allowed[$old]??[],true))pp_dough_reply(409,['ok'=>false,'error'=>'invalid_transition']);
 $rows[$idx]['status']=$status;
 $rows[$idx]['updated_at']=$now->format(DATE_ATOM);
 $rows[$idx]['revision']=$expected+1;
 $events=is_array($rows[$idx]['history']??null)?$rows[$idx]['history']:[];
 $events[]=['at'=>$now->format(DATE_ATOM),'action'=>'status','from'=>$old,'to'=>$status];
 $rows[$idx]['history']=array_slice($events,-30);
 $record=$rows[$idx];
}else{
 $itemsRaw=$input['items']??null;
 if(!is_array($itemsRaw)||count($itemsRaw)>20)pp_dough_reply(422,['ok'=>false,'error'=>'invalid_items']);
 $items=[];$total=0;
 foreach($itemsRaw as $key=>$qty){
  if(!is_string($key)||!isset($catalog[$key])||!is_int($qty)||$qty<0||$qty>200)pp_dough_reply(422,['ok'=>false,'error'=>'invalid_quantity']);
  if(!$qty)continue;
  if($now->format('H:i')>='15:05'&&!$catalog[$key]['frozen'])pp_dough_reply(422,['ok'=>false,'error'=>'after_cutoff_frozen_only']);
  $items[]=['key'=>$key,'name'=>$catalog[$key]['name'],'packages'=>$qty,'units_per_pack'=>$catalog[$key]['pack']];
  $total+=$qty;
 }
 if(!$items||$total>500)pp_dough_reply(422,['ok'=>false,'error'=>'empty_or_large_order']);
 $date=$input['delivery_date']??null;
 if(!is_string($date)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date))pp_dough_reply(422,['ok'=>false,'error'=>'invalid_delivery_date']);
 $delivery=DateTimeImmutable::createFromFormat('!Y-m-d',$date,new DateTimeZone('Europe/Tallinn'));
 $today=$now->setTime(0,0);
 if(!$delivery||$delivery->format('Y-m-d')!==$date||$delivery<$today||$delivery>$today->modify('+90 days'))pp_dough_reply(422,['ok'=>false,'error'=>'delivery_date_out_of_range']);
 if($action==='create'){
  $record=['id'=>bin2hex(random_bytes(8)),'created_at'=>$now->format(DATE_ATOM),'updated_at'=>$now->format(DATE_ATOM),'delivery_date'=>$date,'status'=>'Tellitud','revision'=>0,'items'=>$items,'total_packages'=>$total,'history'=>[['at'=>$now->format(DATE_ATOM),'action'=>'create','to'=>'Tellitud']]];
  $rows[]=$record;if(count($rows)>500)$rows=array_slice($rows,-500);
 }else{
  if(!in_array((string)($rows[$idx]['status']??''),['Tellitud','Salvestatud'],true))pp_dough_reply(409,['ok'=>false,'error'=>'already_confirmed']);
  if(!pp_dough_editable($rows[$idx],$now))pp_dough_reply(409,['ok'=>false,'error'=>'edit_window_closed','editable_until'=>pp_dough_edit_until($rows[$idx])]);
  $before=[];foreach((array)($rows[$idx]['items']??[]) as $it){if(is_array($it)&&is_string($it['key']??null))$before[$it['key']]=(int)($it['packages']??0);}
  $after=[];foreach($items as $it)$after[$it['key']]=$it['packages'];
  $oldDate=(string)($rows[$idx]['delivery_date']??'');
  $rows[$idx]['items']=$items;$rows[$idx]['total_packages']=$total;$rows[$idx]['delivery_date']=$date;
  $rows[$idx]['updated_at']=$now->format(DATE_ATOM);$rows[$idx]['revision']=$expected+1;
  $events=is_array($rows[$idx]['history']??null)?$rows[$idx]['history']:[];
  $changes=[];foreach(array_unique(array_merge(array_keys($before),array_keys($after))) as $k){$b=$before[$k]??0;$a=$after[$k]??0;if($a!==$b)$changes[]=['key'=>$k,'name'=>$catalog[$k]['name']??$k,'from'=>$b,'to'=>$a];}
  $events[]=['at'=>$now->format(DATE_ATOM),'action'=>'edit','delivery_date_before'=>$oldDate,'delivery_date_after'=>$date,'changes'=>array_slice($changes,0,20)];
  $rows[$idx]['history']=array_slice($events,-30);$record=$rows[$idx];
 }
}
$tmp=$file.'.'.bin2hex(random_bytes(8)).'.tmp';
$data=json_encode($rows,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE|JSON_PRETTY_PRINT);
if(!is_string($data)||file_put_contents($tmp,$data,LOCK_EX)===false||!rename($tmp,$file)){
 @unlink($tmp);error_log('[Peetri dough v16.9] save_failure');pp_dough_reply(503,['ok'=>false,'error'=>'storage_write_failed']);
}
@chmod($file,0600);
pp_dough_reply($action==='create'?201:200,['ok'=>true,'order'=>$record,'scope'=>'internal_only']);
