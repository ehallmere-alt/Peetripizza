<?php
declare(strict_types=1);
// v17.10: read-only "which version is installed" check for Seaded. Login required.
// Returns only the release number and file names from tools/release-manifest.php. No orders, no secrets.
require_once dirname(__DIR__).'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
if(($_SERVER['REQUEST_METHOD']??'')!=='GET'){http_response_code(405);echo '{"ok":false,"error":"method_not_allowed"}';exit;}
$root=dirname(__DIR__);
$html=@file_get_contents($root.'/dashboard.php',false,null,0,4096);
$version=(is_string($html)&&preg_match('/name="peetri-release" content="([0-9]+(?:\.[0-9]+){1,3})"/',$html,$m))?$m[1]:'';
$ok=0;$missing=[];$changed=[];$total=0;$manifestOk=false;
$manifestFile=$root.'/tools/release-manifest.php';
if(is_file($manifestFile)){
 $manifest=@include $manifestFile;
 if(is_array($manifest)){
  $manifestOk=true;
  foreach($manifest as $rel=>$expected){
   if(!is_string($rel)||!is_string($expected)||str_contains($rel,'..')||str_starts_with($rel,'private_data'))continue;
   ++$total;$file=$root.'/'.$rel;
   if(!is_file($file)){$missing[]=$rel;continue;}
   if(!hash_equals($expected,(string)hash_file('sha256',$file))){$changed[]=$rel;continue;}
   ++$ok;
  }
 }
}
// Newest version in the public GitHub repo, fetched by the server (the page CSP allows only 'self').
// Cached 10 min in private_data so the tablet never hits GitHub's rate limit. ?force=1 skips the cache (min 30 s).
const PP1710_REPO='ehallmere-alt/Peetripizza';
function pp1710_get(string $url,bool $json): ?string {
 if(!function_exists('curl_init'))return null;
 $h=curl_init($url);
 curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>4,CURLOPT_TIMEOUT=>8,
  CURLOPT_HTTPHEADER=>[$json?'Accept: application/vnd.github+json':'Accept: text/plain'],CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_USERAGENT=>'PeetriKitchenVersionCheck/17.10']);
 $body=curl_exec($h);$code=(int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);$err=curl_errno($h);curl_close($h);
 return(!$err&&$code===200&&is_string($body)&&strlen($body)<2000000)?$body:null;
}
function pp1710_github(): ?array {
 $base=getenv('PP_GITHUB_API')?:'https://api.github.com';$raw=getenv('PP_GITHUB_RAW')?:'https://raw.githubusercontent.com';
 $b=pp1710_get($base.'/repos/'.PP1710_REPO.'/releases/latest',true);
 if($b!==null){$j=json_decode($b,true);
  if(is_array($j)&&preg_match('/([0-9]+(?:\.[0-9]+){1,3})/',(string)($j['tag_name']??''),$m))return['version'=>$m[1],'from'=>'release','url'=>'https://github.com/'.PP1710_REPO.'/releases/latest'];}
 $b=pp1710_get($raw.'/'.PP1710_REPO.'/main/app/peetripizza/dashboard.php',false);
 if($b!==null&&preg_match('/name="peetri-release" content="([0-9]+(?:\.[0-9]+){1,3})"/',$b,$m))return['version'=>$m[1],'from'=>'main','url'=>'https://github.com/'.PP1710_REPO.'/releases'];
 return null;
}
$github=null;
if(($_GET['github']??'')==='1'){
 $dir=$root.'/private_data';$file=$dir.'/github-latest.json';
 $old=is_file($file)?json_decode((string)@file_get_contents($file),true):null;
 $age=is_array($old)?time()-(int)($old['at']??0):PHP_INT_MAX;
 $ttl=(($_GET['force']??'')==='1')?30:600;
 if(is_array($old)&&$age<$ttl&&!empty($old['version']))$github=$old;
 else{
  $new=pp1710_github();
  if($new){$new['at']=time();$github=$new;
   if(is_dir($dir)||@mkdir($dir,0700,true)){$tmp=$file.'.'.bin2hex(random_bytes(6)).'.tmp';if(@file_put_contents($tmp,json_encode($new))!==false){@rename($tmp,$file);@chmod($file,0600);}}}
  elseif(is_array($old)&&!empty($old['version'])){$github=$old;$github['stale']=true;}
 }
 if($github)$github=['version'=>(string)$github['version'],'from'=>(string)($github['from']??''),'url'=>(string)($github['url']??''),'stale'=>!empty($github['stale'])];
}
echo json_encode([
 'ok'=>true,
 'version'=>$version,
 'files'=>['checked'=>$manifestOk,'ok'=>$ok,'total'=>$total,'missing'=>array_slice($missing,0,30),'changed'=>array_slice($changed,0,30),'missingCount'=>count($missing),'changedCount'=>count($changed)],
 'github'=>$github,
 'php'=>PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION,
 'checkedAt'=>gmdate('c'),
],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
