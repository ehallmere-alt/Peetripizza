<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET'){
 http_response_code(405);header('Allow: GET');echo json_encode(['ok'=>false,'error'=>'bridge_not_enabled']);exit;
}
$loc=$_SESSION['pp_pizzeria']??null;
if(!is_array($loc)||(int)($loc['id']??0)<1){http_response_code(403);echo json_encode(['ok'=>false,'error'=>'pizzeria_required']);exit;}
// Draft states only. The official Peetri Pizza WRITE contract has NOT been verified.
// Never forward credentials, names, notes, or order data to any customer endpoint.
echo json_encode([
 'ok'=>true,'enabled'=>false,'can_write'=>false,'vendor_contract_verified'=>false,
 'mode'=>'disabled_until_authorized_vendor_api',
 'planned_internal_states'=>['new','active','done','handed'],
 'required_before_enable'=>['official_api_documentation','authorized_credentials','test_order','status_mapping','write_retry_and_idempotency','customer_end_to_end_validation'],
 'customer_updates_visible'=>false
],JSON_UNESCAPED_UNICODE);
