<?php
declare(strict_types=1);
require_once __DIR__.'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; connect-src \'self\'; object-src \'none\'; base-uri \'none\'');
?>
<!doctype html>
<html lang="et">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Seadmed · Peetri Pizza</title>
<style>
:root{font-family:Arial,sans-serif;color:#182b24;background:#f3f6f4}
*{box-sizing:border-box}
body{margin:0}
header{background:#fff;border-bottom:1px solid #dfe8e1;padding:18px 22px}
main{max-width:1100px;margin:auto;padding:24px 18px}
a{color:#167a4c;text-decoration:none}
h1{font-size:27px;margin:8px 0}
small{color:#708078}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}
.box,.device{background:white;border:1px solid #e1e8e3;border-radius:17px;padding:20px}
.box strong{font-size:30px;display:block;margin-top:8px}
.devices{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.device h3{margin:0 0 10px}
.device p{font-size:14px;color:#62736a;margin:8px 0}
.tag{display:inline-block;border-radius:20px;padding:5px 11px;font-size:12px;font-weight:bold;background:#e7f7ee;color:#127443}
.tag.off{background:#f4ecec;color:#945555}
.toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px}
button{background:#16824f;color:white;border:0;border-radius:11px;padding:11px 16px;cursor:pointer}
#error{color:#ad3939}
@media(max-width:650px){
.summary{gap:7px}
.box{padding:12px}
.box strong{font-size:23px}
.devices{grid-template-columns:1fr}
main{padding:16px 12px}
}
</style>
<script src="assets/devices-v1795.js" defer></script>
<link rel="stylesheet" href="assets/premium-admin-v1796.css?v=1796">
</head>
<body>
<header><a href="dashboard.php">← Tagasi töölauale</a></header>
<main>
<small>PEETRI PIZZA · DEVICE CONTROL CENTER</small>
<h1>Ühendatud seadmed</h1>
<div class="toolbar">
<span id="updated">Andmeid laaditakse…</span>
<button id="refresh" type="button">↻ Uuenda</button>
</div>
<div class="summary">
<div class="box"><small>Registreeritud</small><strong id="total">—</strong></div>
<div class="box"><small>Võrgus</small><strong id="online">—</strong></div>
<div class="box"><small>Hoiatused</small><strong id="warnings">—</strong></div>
</div>
<p id="error"></p>
<div id="devices" class="devices"></div>
</main>
</body>
</html>
