<?php
declare(strict_types=1);
/*
 * Peetri Pizza v18.15 — all pizzerias for the login screen.
 * Source: the public list https://peetripizza.ee/api/pizzeria-list (the same list the customer site uses,
 * no login needed). Only id, name and town (region) are kept. Cached 6 h in private_data/pizzeria-list.json;
 * if the site does not answer, the last saved list is used, and if there is none, only the locations
 * configured on the server (peetri_locations.php) are shown — exactly as before.
 * Reading only. The password is still checked by peetripizza.ee itself (pizzeria-login), per pizzeria.
 */
function pp1815_fetch_list(): ?array {
    if(!function_exists('curl_init'))return null;
    $h=curl_init('https://peetripizza.ee/api/pizzeria-list');
    curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>5,
        CURLOPT_HTTPHEADER=>['Accept: application/json'],CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_USERAGENT=>'PeetriKitchenReadOnly/18.15']);
    $body=curl_exec($h);$code=(int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);$err=curl_errno($h);curl_close($h);
    if($err||$code!==200||!is_string($body)||strlen($body)>2000000)return null;
    $j=json_decode($body,true);
    if(!is_array($j))return null;
    if(isset($j['data'])&&is_array($j['data']))$j=$j['data'];
    $out=[];
    foreach($j as $row){
        if(!is_array($row))continue;
        $id=filter_var($row['id']??null,FILTER_VALIDATE_INT);
        $name=is_string($row['name']??null)?trim(preg_replace('/\s+/u',' ',$row['name'])??''):'';
        if(!$id||$id<1||$name===''||strlen($name)>=100)continue;
        $region=is_array($row['region']??null)&&is_string($row['region']['name']??null)?trim($row['region']['name']):'';
        $out[]=['id'=>$id,'name'=>$name,'region'=>strlen($region)<60?$region:''];
    }
    return count($out)>0?$out:null;
}
function pp1815_upstream_list(): array {
    $dir=dirname(__DIR__).'/private_data';
    $file=$dir.'/pizzeria-list.json';
    $old=null;
    if(is_file($file)){
        $old=json_decode((string)@file_get_contents($file),true);
        if(is_array($old)&&is_array($old['items']??null)&&time()-(int)($old['at']??0)<21600)return $old['items'];
    }
    $new=pp1815_fetch_list();
    if($new!==null){
        if(is_dir($dir)||@mkdir($dir,0700,true)){
            $tmp=$file.'.'.bin2hex(random_bytes(6)).'.tmp';
            if(@file_put_contents($tmp,json_encode(['at'=>time(),'items'=>$new],JSON_UNESCAPED_UNICODE))!==false){@rename($tmp,$file);@chmod($file,0600);}
        }
        return $new;
    }
    if(is_array($old)&&is_array($old['items']??null)){
        // Site did not answer: keep the old list, but try again in 5 min, not on every page load.
        $old['at']=time()-21600+300;
        @file_put_contents($file,json_encode($old,JSON_UNESCAPED_UNICODE));
        return $old['items'];
    }
    return [];
}
/** Configured locations first (their names stay as set on the server), then every other pizzeria by name. */
function pp1815_locations(): array {
    $configured=pp_locations();
    $seen=[];$list=[];
    foreach($configured as $loc){$seen[$loc['id']]=true;$list[]=$loc+['region'=>'','configured'=>true];}
    $rest=[];
    foreach(pp1815_upstream_list() as $loc){
        if(!is_array($loc))continue;
        $id=(int)($loc['id']??0);$name=(string)($loc['name']??'');
        if($id<1||$name===''||isset($seen[$id]))continue;
        $seen[$id]=true;$rest[]=['id'=>$id,'name'=>$name,'region'=>(string)($loc['region']??''),'configured'=>false];
    }
    $coll=class_exists('Collator')?new Collator('et_EE'):null;
    usort($rest,static fn($a,$b)=>$coll?$coll->compare($a['name'],$b['name']):strcasecmp($a['name'],$b['name']));
    return array_merge($list,$rest);
}
