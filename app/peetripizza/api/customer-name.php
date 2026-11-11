<?php
declare(strict_types=1);
/** Kitchen-visible customer name only; never phone/email/address. */
function pp_kitchen_name_text(mixed $value): string {
 if(!is_string($value))return '';
 $value=trim(preg_replace('/[\x{0000}-\x{001F}\x{007F}]/u',' ', $value)??'');
 return function_exists('mb_substr')?mb_substr($value,0,90,'UTF-8'):(function_exists('iconv_substr')?iconv_substr($value,0,90,'UTF-8'):substr($value,0,90));
}
function pp_kitchen_customer_name(array $o): string {
 foreach(['customer_name','customerName','client_name','clientName','customer_full_name','customerFullName','recipient_name','recipientName'] as $key){
  $name=pp_kitchen_name_text($o[$key]??null);
  if($name!=='')return $name;
 }
 foreach(['customer','client','customerInfo','customer_info','orderCustomer','order_customer','recipient'] as $key){
  $value=$o[$key]??null;
  if(is_string($value)){
   $name=pp_kitchen_name_text($value);
   if($name!=='')return $name;
  }
  if(!is_array($value))continue;
  foreach(['fullName','full_name','customerName','customer_name','displayName','display_name','name'] as $field){
   $name=pp_kitchen_name_text($value[$field]??null);
   if($name!=='')return $name;
  }
  $first=pp_kitchen_name_text($value['firstName']??$value['first_name']??null);
  $last=pp_kitchen_name_text($value['lastName']??$value['last_name']??null);
  if($first!==''||$last!=='')return pp_kitchen_name_text(trim($first.' '.$last));
 }
 // Some historical orders expose first/last at the top level.
 $first=pp_kitchen_name_text($o['firstName']??$o['first_name']??null);
 $last=pp_kitchen_name_text($o['lastName']??$o['last_name']??null);
 return $first!==''||$last!==''?pp_kitchen_name_text(trim($first.' '.$last)):'';
}
/** v17.7: customer phone for the kitchen card (staff only, never logged). Digits, spaces and a leading + only. */
function pp_kitchen_customer_phone(array $o): string {
 $pick=static function($v):string{
  if(!is_string($v)&&!is_int($v))return '';
  $s=trim(preg_replace('/[^0-9+ -]/','',(string)$v)??'');
  $s=preg_replace('/(?!^)\+/','',$s)??'';$s=preg_replace('/\s+/',' ',$s)??'';
  return strlen(preg_replace('/\D/','',$s)??'')>=5?substr($s,0,20):'';
 };
 foreach(['customer_phone','customerPhone','phone','phone_number','phoneNumber','client_phone','clientPhone','recipient_phone','contact_phone'] as $k){$p=$pick($o[$k]??null);if($p!=='')return $p;}
 foreach(['customer','client','customerInfo','customer_info','orderCustomer','order_customer','recipient','contact'] as $k){
  $v=$o[$k]??null;if(!is_array($v))continue;
  foreach(['phone','phone_number','phoneNumber','mobile','tel','customer_phone'] as $f){$p=$pick($v[$f]??null);if($p!=='')return $p;}
 }
 return '';
}
