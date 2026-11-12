<?php
declare(strict_types=1);
// v17.48: login lasts 14 days, or 2 days without any use (was 12 h / 1 h idle).
const PP_SESSION_MAX=1209600;
const PP_SESSION_IDLE=172800;
function pp_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    if (!headers_sent()) {
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_secure', '1');
        ini_set('session.cookie_samesite', 'Strict');
        session_name('PEETRI_STAFF');
        // v17.48 (owner): the kitchen tablet stays logged in for days. Own session folder, so the hosting's
        // shared 24-minute session cleanup cannot log the tablet out; falls back to the default folder.
        $sd=dirname(__DIR__).'/private_data/sessions';
        if(!is_dir($sd)&&@mkdir($sd,0700,true))@file_put_contents($sd.'/.htaccess',"Require all denied\n");
        if(is_dir($sd)&&is_writable($sd))session_save_path($sd);
        ini_set('session.gc_maxlifetime', (string)PP_SESSION_MAX);
        session_set_cookie_params(['lifetime'=>PP_SESSION_MAX,'path'=>'/peetripizza/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
    }
    session_start();
}
function pp_credentials_file(): string {return dirname(__DIR__, 3) . '/peetri_staff_auth.php';}
function pp_credentials(): array {
    $path = pp_credentials_file();
    if (!is_file($path)) return [];
    $data = require $path;
    return is_array($data) ? $data : [];
}
function pp_authenticated(): bool {
    pp_start();
    if ((empty($_SESSION['pp_staff']) || !is_string($_SESSION['pp_staff'])) && (empty($_SESSION['pp_pizzeria']) || !is_array($_SESSION['pp_pizzeria']))) return false;
    $now=time();
    if (($now - (int)($_SESSION['pp_last_seen'] ?? 0)) > PP_SESSION_IDLE || ($now - (int)($_SESSION['pp_logged_in'] ?? 0)) > PP_SESSION_MAX) {
        unset($_SESSION['pp_staff'],$_SESSION['pp_pizzeria'],$_SESSION['pp_upstream_session'],$_SESSION['pp_last_seen'],$_SESSION['pp_logged_in']);
        return false;
    }
    $_SESSION['pp_last_seen']=$now;
    return true;
}
function pp_require_login(bool $json=true): void {
    if (pp_authenticated()) return;
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        http_response_code(401);
        echo json_encode(['ok'=>false,'error'=>'authentication_required']);
    } else {
        header('Location: /peetripizza/', true, 302);
    }
    exit;
}
function pp_csrf(): string {
    pp_start();
    if (!isset($_SESSION['pp_csrf'])) $_SESSION['pp_csrf']=bin2hex(random_bytes(32));
    return $_SESSION['pp_csrf'];
}
function pp_csrf_valid(string $token): bool {return hash_equals(pp_csrf(),$token);}
function pp_limit_attempts(): bool {
    $ip=$_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key=hash('sha256','peetri-login:'.$ip);
    $file=sys_get_temp_dir().'/pp-login-'.$key.'.json';
    $h=@fopen($file,'c+');
    if (!$h) return false;
    if (!flock($h,LOCK_EX)) {fclose($h);return false;}
    $data=json_decode(stream_get_contents($h),true);
    if (!is_array($data) || time()-(int)($data['start']??0)>900) $data=['start'=>time(),'count'=>0];
    $allowed=(int)$data['count']<8;
    if ($allowed) $data['count']++;
    rewind($h);ftruncate($h,0);fwrite($h,json_encode($data));fflush($h);flock($h,LOCK_UN);fclose($h);
    return $allowed;
}

function pp_locations(): array {
    $file=dirname(__DIR__,3).'/peetri_locations.php';
    $items=is_file($file)?require $file:[['id'=>65,'name'=>'Kose']];
    if(!is_array($items))return [];
    $safe=[];
    foreach($items as $item){
        if(!is_array($item))continue;
        $id=filter_var($item['id']??null,FILTER_VALIDATE_INT);
        $name=$item['name']??null;
        if($id&&$id>0&&is_string($name)&&$name!==''&&(function_exists('mb_strlen')?mb_strlen($name,'UTF-8'):strlen($name))<100)$safe[]=['id'=>$id,'name'=>$name];
    }
    return $safe;
}
function pp_upstream_login(int $id,string $password): ?string {
    // v17.5: remember WHY a login failed (wrong password vs. peetripizza.ee unreachable) for a clearer message.
    $GLOBALS['pp_login_fail']='network';
    if(!function_exists('curl_init'))return null;
    $h=curl_init('https://peetripizza.ee/api/pizzeria-login');
    curl_setopt_array($h,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode(['pizzeriaId'=>(string)$id,'password'=>$password]),CURLOPT_HTTPHEADER=>['Accept: application/json','Content-Type: application/json'],CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>12,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
    $body=curl_exec($h);$status=curl_getinfo($h,CURLINFO_RESPONSE_CODE);$err=curl_errno($h);curl_close($h);
    if(!$err&&in_array($status,[400,401,403,404,422],true))$GLOBALS['pp_login_fail']='denied';
    if($err||$status!==200||!is_string($body)||strlen($body)>8192)return null;
    $GLOBALS['pp_login_fail']='denied';
    $result=json_decode($body,true);
    if(!is_array($result)||($result['success']??false)!==true)return null;
    $token=$result['sessionId']??null;
    return is_string($token)&&strlen($token)>=12&&strlen($token)<=512?$token:null;
}
