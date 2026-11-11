<?php
declare(strict_types=1);
/** Private, per-pizzeria storage for manually shared customer status links. */
function pp155_dir(): string {
    $dir=dirname(__DIR__).'/private_data';
    if(!is_dir($dir) && !@mkdir($dir,0700,true)) throw new RuntimeException('storage_unavailable');
    return $dir;
}
function pp155_read_json(string $filename): array {
    if(!is_file($filename)) return [];
    $s=@file_get_contents($filename);
    if($s===false || strlen($s)>600000 || !is_array($v=json_decode($s,true))) throw new RuntimeException('storage_corrupt');
    return $v;
}
function pp155_locked(int $tenant,string $prefix,bool $write,callable $fn): mixed {
    if($tenant<1 || $tenant>9999999 || !preg_match('/^[a-z-]+$/D',$prefix)) throw new RuntimeException('invalid_scope');
    $dir=pp155_dir();
    $filename=$dir.'/'.$prefix.'-'.$tenant.'.json';
    $lock=@fopen($dir.'/'.$prefix.'-'.$tenant.'.lock','c');
    if(!$lock||!flock($lock,$write?LOCK_EX:LOCK_SH)) throw new RuntimeException('storage_unavailable');
    try {
        $data=pp155_read_json($filename);
        $result=$fn($data);
        if($write){
            if(!is_array($data))throw new RuntimeException('invalid_storage');
            $json=json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
            if($json===false||strlen($json)>600000)throw new RuntimeException('storage_full');
            $tmp=$filename.'.'.bin2hex(random_bytes(8)).'.tmp';
            if(file_put_contents($tmp,$json,LOCK_EX)===false||!rename($tmp,$filename)){
                @unlink($tmp);throw new RuntimeException('storage_write_failed');
            }
            @chmod($filename,0600);
        }
        return $result;
    } finally {flock($lock,LOCK_UN);fclose($lock);}
}
function pp155_capture_live(int $tenant,array $orders): void {
    pp155_locked($tenant,'live-index',true,static function(array &$data)use($orders):void {
        $now=time();
        $rows=is_array($data['orders']??null)?$data['orders']:[];
        foreach($orders as $o){
            if(!is_array($o))continue;
            $id=$o['id']??'';
            if(!is_string($id)||!preg_match('/^live-[a-f0-9]{24}$/D',$id))continue;
            $status=$o['status']??'';
            if(!in_array($status,['new','active','done'],true))continue;
            $rows[$id]=['status'=>$status,'seen'=>$now];
        }
        $rows=array_filter($rows,static fn($row)=>is_array($row)&&($row['seen']??0)>$now-86400);
        if(count($rows)>2000){uasort($rows,static fn($a,$b)=>(int)($b['seen']??0)<=>(int)($a['seen']??0));$rows=array_slice($rows,0,1600,null,true);}
        $data=['orders'=>$rows,'updated_at'=>$now];
    });
}
