<?php
declare(strict_types=1);
// CLI only. Never print passwords, sessions or access tokens.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root=dirname(__DIR__);
$catalog=require $root.'/auth/public-catalog.php';
$config=dirname($root,2).'/peetri_locations.php';
$existing=is_file($config)?require $config:[];
if (!is_array($existing)) {fwrite(STDERR,"Invalid server configuration.\n");exit(1);}
$mode=$argv[1]??'help';
function norm(string $s):string {return mb_strtolower(trim($s),'UTF-8');}
function csvRow($h,array $row):void {fputcsv($h,$row,',','"','');}
if ($mode==='audit' || $mode==='csv') {
    $h=STDOUT;
    if($mode==='csv')csvRow($h,['city','name','upstream_id','status']);
    $used=[];$confirmed=0;
    foreach($catalog as $branch){
        $id='';$matches=[];
        foreach($existing as $loc){
            if(!is_array($loc)||!isset($loc['id'],$loc['name']))continue;
            $n=norm((string)$loc['name']);$city=norm($branch['city']);$name=norm($branch['name']);
            if(in_array($n,[$name,$city.' / '.$name,$city.' — '.$name,$city.' - '.$name,$city.': '.$name],true))$matches[]=$loc;
        }
        if(count($matches)===1){$id=(string)$matches[0]['id'];$used[$id]=true;$confirmed++;}
        $status=$id!==''?'CONFIGURED':'ID_REQUIRED';
        if($mode==='csv')csvRow($h,[$branch['city'],$branch['name'],$id,$status]);
        else printf("%-18s %-34s %-10s %s\n",$branch['city'],$branch['name'],$id?:'—',$status);
    }
    if($mode==='audit'){
        printf("\nCatalog: %d | matched configured: %d | ID required: %d\n",count($catalog),$confirmed,count($catalog)-$confirmed);
        echo "This checks only local configuration; it does not discover IDs on the upstream server.\n";
    }
    exit;
}
if($mode==='check'){
    $path=$argv[2]??'';
    if(!is_file($path)){fwrite(STDERR,"Usage: php tools/locations.php check /path/to/verified-ids.csv\n");exit(2);}
    $h=fopen($path,'rb');$head=fgetcsv($h,0,',','"','');
    if($head!==['city','name','upstream_id','status']){fwrite(STDERR,"CSV header mismatch.\n");exit(2);}
    $valid=[];$errors=[];$seen=[];$row=1;
    while(($fields=fgetcsv($h,0,',','"',''))!==false){$row++;
        if(count($fields)!==4){$errors[]="row $row: invalid columns";continue;}
        [$city,$name,$id]=$fields;
        $found=false;
        foreach($catalog as $branch)if($branch['city']===$city&&$branch['name']===$name){$found=true;break;}
        if(!$found){$errors[]="row $row: unknown catalog location";continue;}
        if($id==='')continue;
        if(!ctype_digit($id)||(int)$id<1){$errors[]="row $row: invalid ID";continue;}
        if(isset($seen[$id])){$errors[]="row $row: duplicate ID";continue;}
        $seen[$id]=true;$valid[]=['id'=>(int)$id,'name'=>$city.' / '.$name];
    }
    fclose($h);
    if($errors){foreach($errors as $e)fwrite(STDERR,$e."\n");exit(1);}
    echo "Validated ".count($valid)." supplied IDs against catalog names. No network verification performed.\n";
    echo "For safety this command does NOT write the live configuration. Have an administrator verify the IDs before deploying them.\n";
    exit;
}
echo "Peetri Pizza location inventory (CLI only)\n";
echo "  php tools/locations.php audit             # current local ID inventory\n";
echo "  php tools/locations.php csv > ids.csv     # spreadsheet template, empty IDs where unknown\n";
echo "  php tools/locations.php check ids.csv     # validate entered IDs; no writes\n";
