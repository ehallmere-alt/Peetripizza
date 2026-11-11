<?php
declare(strict_types=1);
// CLI-only registration of user-verified Kolde ID. Does not test authentication.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root=dirname(__DIR__);
$config=dirname($root,2).'/peetri_locations.php';
$target=['id'=>47,'name'=>'Tallinn / Kolde Selver'];
$items=is_file($config)?require $config:[];
if(!is_array($items)){fwrite(STDERR,"Invalid existing configuration\n");exit(1);}
foreach($items as $entry){
 if(!is_array($entry))continue;
 if((int)($entry['id']??0)===47 && ($entry['name']??'')!==$target['name']){
  fwrite(STDERR,"ID 47 is assigned to another location. No changes.\n");exit(1);
 }
 if(stripos((string)($entry['name']??''),'Kolde')!==false && (int)($entry['id']??0)!==47){
  fwrite(STDERR,"Kolde already has a different ID. No changes.\n");exit(1);
 }
 if((int)($entry['id']??0)===47 && ($entry['name']??'')===$target['name']){
  echo "Kolde already registered (ID 47). No changes.\n";exit;
 }
}
$items[]=$target;
$body="<?php\nreturn ".var_export($items,true).";\n";
if(is_file($config)){
 $backup=$config.'.bak-'.date('Ymd-His');
 if(!copy($config,$backup)){fwrite(STDERR,"Could not create backup.\n");exit(1);}
}
$tmp=tempnam(dirname($config),'.pp-locations-');
if($tmp===false||file_put_contents($tmp,$body,LOCK_EX)===false){fwrite(STDERR,"Could not stage configuration.\n");exit(1);}
chmod($tmp,0600);
$check=0;exec('php -l '.escapeshellarg($tmp).' 2>&1',$out,$check);
if($check!==0){@unlink($tmp);fwrite(STDERR,"PHP syntax validation failed.\n");exit(1);}
if(!rename($tmp,$config)){@unlink($tmp);fwrite(STDERR,"Could not activate configuration.\n");exit(1);}
echo "Registered Kolde Selver with upstream numeric ID 47.\n";
echo "No password stored; LIVE login not tested.\n";
