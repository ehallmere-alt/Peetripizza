<?php
declare(strict_types=1);
/** Read-only Peetri Pizza kitchen DTO. No credentials or raw records. v17.7: customer phone is passed to the signed-in kitchen only (customerPhone), never logged. */
function pp150_text(mixed $v,int $max=150): string {
    if (!is_scalar($v)) return '';
    $text=trim(preg_replace('/[\x{0000}-\x{001F}\x{007F}]/u',' ',(string)$v)??'');
    return function_exists('mb_substr') ? mb_substr($text,0,$max,'UTF-8') : substr($text,0,$max);
}
function pp150_label(mixed $v): string {
    if(is_array($v)){
        foreach(['name','title','label','value','et'] as $k) if(isset($v[$k])&&is_scalar($v[$k]))return pp150_text($v[$k]);
        return '';
    }
    return pp150_text($v);
}
function pp150_epoch(mixed $value): ?int {
    if($value===null||$value==='')return null;
    if(is_numeric($value)){
        $num=(float)$value;
        if($num<=0)return null;
        // Upstream may use seconds or milliseconds. Reject unreasonable dates.
        $ms=$num>=1e11?(int)$num:(int)round($num*1000);
        return $ms>=946684800000&&$ms<=4102444800000?$ms:null;
    }
    if(!is_string($value)||strlen($value)>80)return null;
    $timestamp=strtotime($value);
    return $timestamp!==false&&$timestamp>=946684800&&$timestamp<=4102444800?$timestamp*1000:null;
}
function pp150_products(array $order):array {
    $products=[];
    foreach(['pizzas','simpleProducts'] as $field){
        if(isset($order[$field])&&is_array($order[$field])) foreach($order[$field] as $entry)if(is_array($entry))$products[]=$entry;
    }
    if($products)return $products;
    foreach(['items','products','order_items'] as $field){
        if(isset($order[$field])&&is_array($order[$field]))return array_values($order[$field]);
    }
    return [];
}
function pp150_items(array $order):array {
    $result=[];
    foreach(array_slice(pp150_products($order),0,60) as $item){
        if(!is_array($item))continue;
        $name='';
        foreach(['product_name','name','pizzaName','productName','title','product','pizza'] as $key){
            $name=pp150_label($item[$key]??null); if($name!=='')break;
        }
        if($name==='')$name='Toode (nimi puudub)';
        $size=pp150_label($item['size']??$item['pizzaSize']??null);
        if($size!=='')$name.=' ('.$size.')';
        $spec=[];
        foreach(['base'=>'Põhi','dough'=>'Põhi','doughType'=>'Põhi','rim'=>'Äär','cheese'=>'Juust','packaging'=>'Pakend'] as $key=>$label){
            $v=pp150_label($item[$key]??null);
            if($v==='')continue;
            if($label==='Põhi' && count(array_filter($spec,fn($s)=>str_starts_with($s,'Põhi:'))))continue;
            $spec[]=$label.': '.$v;
        }
        $added=[];
        foreach(['addedToppings','additionalToppings','extraToppings','extras','additions'] as $key){
            if(!isset($item[$key])||!is_array($item[$key]))continue;
            foreach(array_slice($item[$key],0,25) as $t){$v=pp150_label($t);if($v!=='')$added[]=$v;}
        }
        if(isset($item['toppings'])&&is_array($item['toppings'])){
            foreach(array_slice($item['toppings'],0,50) as $t){
                if(!is_array($t))continue;
                $flag=$t['isExtra']??$t['is_extra']??$t['added']??$t['additional']??false;
                if(!in_array($flag,[true,1,'1','true'],true))continue;
                $v=pp150_label($t);if($v!=='')$added[]=$v;
            }
        }
        $added=array_slice(array_unique($added),0,15);
        // v17.54: toppings the customer does NOT want -> "Ilma: x" (red "−" chip on the card). Field names guessed, read-only.
        $removed=[];
        foreach(['removedToppings','removed_toppings','excludedToppings','excluded_toppings','withoutToppings','without_toppings','removed','excluded','without'] as $key){
            if(!isset($item[$key])||!is_array($item[$key]))continue;
            foreach(array_slice($item[$key],0,25) as $t){$v=pp150_label($t);if($v!=='')$removed[]=$v;}
        }
        if(isset($item['toppings'])&&is_array($item['toppings'])){
            foreach(array_slice($item['toppings'],0,50) as $t){
                if(!is_array($t))continue;
                $flag=$t['isRemoved']??$t['is_removed']??$t['removed']??$t['excluded']??$t['is_excluded']??false;
                if(!in_array($flag,[true,1,'1','true'],true))continue;
                $v=pp150_label($t);if($v!=='')$removed[]=$v;
            }
        }
        foreach(array_slice(array_unique($removed),0,15) as $v)$spec[]='Ilma: '.str_replace(';',',',$v);
        if($added)$spec[]='Lisandid: '.implode(', ',$added);
        if($spec)$name.=' — '.implode('; ',$spec);
        $quantity=$item['quantity']??$item['qty']??1;
        $quantity=is_numeric($quantity)?(int)$quantity:1;
        $result[]=[pp150_text($name,400),max(1,min(99,$quantity))];
    }
    return $result;
}
function pp150_clean_order(array $order): array {
    $states=['new'=>'new','pending'=>'new','received'=>'new','sent'=>'new','waiting'=>'new',
        'confirmed'=>'active','accepted'=>'active','preparing'=>'active','in_progress'=>'active','processing'=>'active',
        'ready'=>'done','completed'=>'done','picked_up'=>'done','delivered'=>'done',
        'cancelled'=>'cancelled','canceled'=>'cancelled','declined'=>'cancelled'];
    $rawStatus=strtolower(trim((string)($order['status']??$order['state']??'')));
    $status=$states[$rawStatus]??'active'; // Conservative fallback, never mark unknown state as new.
    $native=pp150_text($order['id']??$order['orderId']??$order['order_id']??'',100);
    $public=pp150_text($order['order_number']??$order['number']??'',40);
    $dateSource=$order['time_sent']??$order['created_at']??$order['created']??null;
    $stable=$native!==''?'id:'.$native:($public!==''?'number:'.$public.'|'.(string)$dateSource:'fingerprint:'.json_encode([
        $dateSource, pp150_products($order),$order['total_amount']??$order['amount']??null
    ],JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE));
    $id='live-'.substr(hash('sha256',$stable),0,24);
    $number=preg_replace('/[^0-9A-Za-z._-]/','',$public!==''?$public:$native);
    if($number==='')$number='teadmata';
    $created=pp150_epoch($order['time_confirmed']??null)
        ??pp150_epoch($order['time_sent']??null)
        ??pp150_epoch($order['created_at']??$order['created']??null)
        ??time()*1000;
    $expected=pp150_epoch($order['time_expected']??$order['expected_at']??null);
    $estimated=max(1,min(240,(int)($order['estimated_minutes']??20)));
    $minutes=$expected!==null?max(1,min(1440,(int)round(($expected-$created)/60000))):$estimated;
    $due=$expected??($created+$minutes*60000);
    $completed=pp150_epoch($order['time_completed']??$order['time_ready']??null);
    // v17.7: same number as the Peetri Pizza panel: YYMMDD-<daily number>, e.g. 261111-2.
    if(preg_match('/^\d{1,5}$/',$public)){$d=(new DateTimeImmutable('@'.intdiv((int)$created,1000)))->setTimezone(new DateTimeZone('Europe/Tallinn'));$number=$d->format('ymd').'-'.$public;}
    $comments='';
    foreach(['customer_comment','customerComment','kitchen_comment','order_comment','note','notes'] as $key){
        $comments=pp150_text($order[$key]??null,400);if($comments!=='')break;
    }
    return ['id'=>$id,'number'=>substr($number,0,24),'status'=>$status,
        'items'=>pp150_items($order),'amount'=>max(0,(float)($order['total_amount']??$order['amount']??0)),
        'created'=>$created,'minutes'=>$minutes,'deadline'=>$due,'deadlineSource'=>$expected!==null?'official':'estimated',
        'serving'=>str_contains(strtolower(pp150_text($order['serving']??'',60)),'deliver')?'delivery':'takeAway',
        // v17.7: eaten in the pizzeria -> no box needed.
        'dineIn'=>(bool)preg_match('/dine|eat.?in|here|kohapeal|restaurant|table|in.?house|on.?site/i',pp150_text($order['serving']??$order['delivery_type']??'',60)),
        'payment'=>pp150_text($order['payment_type']??'—',24),
        'completed'=>$completed??0,'customerName'=>pp_kitchen_customer_name($order),'customerPhone'=>pp_kitchen_customer_phone($order),
        'note'=>$comments,'preview'=>true];
}
