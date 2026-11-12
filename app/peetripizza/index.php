<?php
declare(strict_types=1);
require_once __DIR__ . '/auth/bootstrap.php';
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
pp_start();
if (($_SERVER['REQUEST_METHOD']??'GET')==='POST' && ($_POST['action']??'')==='logout') {
    if (pp_csrf_valid((string)($_POST['csrf']??''))) {
        $_SESSION=[];
        session_regenerate_id(true);
    }
    header('Location: /peetripizza/',true,303);exit;
}
if (pp_authenticated()) {require __DIR__.'/dashboard.php';exit;}
$error='';$errorKind='';$chosen=0;
if (($_SERVER['REQUEST_METHOD']??'GET')==='POST') {
    $chosen=(int)filter_var($_POST['pizzeria_id']??0,FILTER_VALIDATE_INT);
    if (!pp_csrf_valid((string)($_POST['csrf']??''))) $error='Vigane päring. Proovi uuesti.';
    elseif (!pp_limit_attempts()) {http_response_code(429);$error='Liiga palju katseid. Proovi 15 minuti pärast.';}
    else {
        $locationId=filter_var($_POST['pizzeria_id']??null,FILTER_VALIDATE_INT);
        $locations=pp_locations();
        $location=null;
        foreach($locations as $loc)if($loc['id']===$locationId){$location=$loc;break;}
        $password=(string)($_POST['password']??'');
        if($location&&$password!==''&&strlen($password)<=256){
            $token=pp_upstream_login($location['id'],$password);
            if($token!==null){
                session_regenerate_id(true);
                $_SESSION['pp_pizzeria']=$location;
                $_SESSION['pp_upstream_session']=$token;
                $_SESSION['pp_logged_in']=time();
                $_SESSION['pp_last_seen']=time();
                header('Location: /peetripizza/',true,303);exit;
            }
            $error=($GLOBALS['pp_login_fail']??'')==='denied'?'Vale parool. Kontrolli ja proovi uuesti.':'Peetri Pizza server ei vasta. Kontrolli internetti ja proovi mõne hetke pärast uuesti.';
            $errorKind=($GLOBALS['pp_login_fail']??'')==='denied'?'password':'network';
        } else $error='Vali seadistatud pitseeria ja sisesta parool.';
    }
}
function pp_e(string $v): string {return htmlspecialchars($v,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function pp_norm_name(string $v): string {
    $v=trim(preg_replace('/\s+/u',' ',$v)??$v);
    return function_exists('mb_strtolower')?mb_strtolower($v,'UTF-8'):strtolower($v);
}
$configured=pp_locations();
if(!$chosen&&count($configured)===1)$chosen=(int)$configured[0]['id'];
$notice='';
if(!$error&&isset($_GET['aegus']))$notice='Sessioon aegus. Logi uuesti sisse, et tellimused jälle tuleksid.';
$many=count($configured)>6;
?><!doctype html>
<html lang="et"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#00824a">
<title>Peetri Pizza — Köögi sisselogimine</title>
<link rel="stylesheet" href="assets/login-v175.css?v=17.5.0"><link rel="stylesheet" href="assets/login-v1720.css?v=17.20.0">
<link rel="stylesheet" href="assets/login-v1740.css?v=17.40.0"><link rel="manifest" href="assets/manifest-v1740.json"><link rel="apple-touch-icon" href="assets/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="192x192" href="assets/icon-192.png"><script src="assets/login-v175.js?v=17.20.0" defer></script>
</head><body class="pl-body">
<main class="pl-shell">
<section class="pl-brand" aria-hidden="false">
 <div class="pl-brand-top"><span class="pl-logo"><img src="assets/pp-logo-square.png" alt="Peetri Pizza" width="120" height="120"></span></div>
 <div class="pl-brand-mid">
  <div class="pl-clock" id="pl-clock" aria-hidden="true">--:--</div>
  <div class="pl-date" id="pl-date"></div>
  <p class="pl-tag">Köögi töölaud</p>
 </div>
 <ul class="pl-points">
  <li><span class="pl-dot"></span>LIVE tellimused otse köögiekraanile</li>
  <li><span class="pl-dot"></span>Taimerid, heli ja 80 mm print</li>
  <li><span class="pl-dot"></span>Taigna tellimine ühest kohast</li>
 </ul>
 <div class="pl-ver">Service App v17.53</div>
</section>
<section class="pl-panel">
 <form method="post" action="/peetripizza/" autocomplete="on" id="pl-form" class="pl-card" novalidate>
  <input type="hidden" name="csrf" value="<?= pp_e(pp_csrf()) ?>">
  <h1>Logi sisse</h1>
  <p class="pl-lead">Vali töökoht ja sisesta selle parool.</p>
  <?php if($error): ?><div class="pl-msg pl-msg-error" role="alert" data-kind="<?= pp_e($errorKind) ?>"><?= pp_e($error) ?></div><?php endif; ?>
  <?php if($notice): ?><div class="pl-msg pl-msg-info" role="status"><?= pp_e($notice) ?></div><?php endif; ?>
  <div class="pl-msg pl-msg-warn" id="pl-offline" role="status" hidden>Internet puudub. Sisselogimine töötab, kui ühendus tagasi tuleb.</div>
  <fieldset class="pl-field">
   <legend>Töökoht</legend>
   <?php if(!$configured): ?>
   <div class="pl-msg pl-msg-error">Ühtegi pitseeriat pole serveris seadistatud. Võta ühendust administraatoriga.</div>
   <?php else: ?>
   <?php if($many): ?><input type="search" id="pl-search" class="pl-input pl-search" placeholder="Otsi pitseeriat…" autocomplete="off" spellcheck="false" aria-label="Otsi pitseeriat" hidden><?php endif; ?>
   <div class="pl-places<?= $many?' pl-places-many':'' ?>" id="pl-places" role="radiogroup" aria-label="Töökoht">
   <?php foreach($configured as $loc): $lid=(int)$loc['id']; ?>
    <label class="pl-place" data-name="<?= pp_e(pp_norm_name($loc['name'])) ?>"><input type="radio" name="pizzeria_id" value="<?= $lid ?>" required<?= $lid===$chosen?' checked':'' ?>><span class="pl-place-box"><span class="pl-place-icon" aria-hidden="true"><?= pp_e(function_exists('mb_substr')?mb_strtoupper(mb_substr($loc['name'],0,1,'UTF-8'),'UTF-8'):strtoupper(substr($loc['name'],0,1))) ?></span><span class="pl-place-name"><?= pp_e($loc['name']) ?></span><span class="pl-place-last" hidden>Viimati</span></span></label>
   <?php endforeach; ?>
   </div>
   <p class="pl-empty" id="pl-empty" hidden>Sellise nimega pitseeriat ei leitud.</p>
   <?php endif; ?>
  </fieldset>
  <div class="pl-field">
   <label for="password" class="pl-label">Parool</label>
   <div class="pl-pass"><input id="password" class="pl-input" name="password" type="password" autocomplete="current-password" placeholder="Sisesta parool" maxlength="256" required<?= $errorKind==='password'?' aria-invalid="true"':'' ?>><button type="button" class="pl-eye" id="pl-eye" aria-label="Näita parooli" aria-pressed="false">Näita</button></div>
   <p class="pl-caps" id="pl-caps" hidden>⇪ Caps Lock on sees</p>
  </div>
  <button type="submit" class="pl-submit" id="pl-submit"><span class="pl-submit-text">Ava köögi töölaud</span><span class="pl-spin" aria-hidden="true"></span></button>
  <p class="pl-foot">🔒 Iga pitseeria parool on eraldi. Parooli ei salvestata selles seadmes. LIVE on ainult lugemiseks.</p>
 </form>
</section>
</main>
</body></html>
