<?php
// Fake peetripizza.ee for API tests. Mode in /tmp file next to this script.
$mode=@trim((string)@file_get_contents(__DIR__.'/mode.txt'))?:'ok';
$u=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
header('Content-Type: application/json');
if($u==='/api/pizzeria-login'){if($mode==='down'){http_response_code(503);echo 'x';exit;}$b=json_decode(file_get_contents('php://input'),true);if(($b['password']??'')==='right-pass'){echo json_encode(['success'=>true,'sessionId'=>'upstream-token-123456789']);}else{http_response_code(401);echo '{"error":"bad"}';}exit;}
if($u==='/api/orders'){
 if(($_SERVER['HTTP_X_SESSION_ID']??'')!=='upstream-token-123456789'||$mode==='expired'){http_response_code(401);echo '{"error":"session"}';exit;}
 if($mode==='down'){http_response_code(500);echo 'x';exit;}
 $t=time();
 echo json_encode(['orders'=>[
  ['id'=>9001,'order_number'=>'A101','status'=>'pending','time_sent'=>date('c',$t-300),'estimated_minutes'=>20,'total_amount'=>15.9,'customer_name'=>'Mari Maasikas','customer_phone'=>'+372 5555 1234','customer_email'=>'mari@example.com','address'=>'Tamme 5','products'=>[['name'=>'Pepperoni (large)','quantity'=>1,'options'=>['Põhi: thin']]],'delivery_type'=>'takeaway','payment_method'=>'card'],
  ['id'=>9002,'order_number'=>'A102','status'=>'preparing','time_sent'=>date('c',$t-900),'time_expected'=>date('c',$t+600),'total_amount'=>22,'customer'=>['firstName'=>'Jaan','lastName'=>'Tamm','phone'=>'5551111'],'products'=>[['name'=>'Margherita','quantity'=>2]]],
  ['id'=>9003,'order_number'=>'A103','status'=>'cancelled','time_sent'=>date('c',$t-100),'products'=>[]],
 ]]);exit;}
if($u==='/api/pizzeria'){if(($_SERVER['HTTP_X_SESSION_ID']??'')!=='upstream-token-123456789'||$mode==='expired'){http_response_code(401);echo '{}';exit;}if($mode==='down'){http_response_code(500);exit;}
 echo json_encode(['id'=>(int)(@file_get_contents(__DIR__.'/pid.txt')?:47),'name'=>'Test','wait_time_minutes'=>45,'is_temporarily_closed'=>is_file(__DIR__.'/closed.txt'),'websocket_key'=>'SECRET-WS','missingToppingIds'=>[3],'missingSimpleProductIds'=>[11,99],'opening_hours'=>[['days'=>[1,2,3,4,5,6,7],'mode'=>'range','fromHour'=>10,'toHour'=>22]]]);exit;}
if($u==='/api/pizzeria-list'){echo json_encode([['id'=>47,'name'=>'Kolde','wait_time_minutes'=>30,'is_temporarily_closed'=>false,'missingToppingIds'=>[],'missingSimpleProductIds'=>[]]]);exit;}
if($u==='/api/toppings'){echo json_encode(['data'=>[['id'=>3,'name'=>['et'=>'Jalapeño <b>','en'=>'Jalapeno']]]]);exit;}
if($u==='/api/simple-products'){echo json_encode([['id'=>11,'name'=>'Coca-Cola 0,5l']]);exit;}
http_response_code(404);echo '{}';
