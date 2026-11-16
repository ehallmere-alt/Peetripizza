<?php
declare(strict_types=1);
require_once __DIR__.'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'");
?>
<!doctype html>
<html lang="et">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Süsteemi tervis · Peetri Pizza</title>
<link rel="stylesheet" href="assets/health-v1795.css">
<script src="assets/health-v1795.js" defer></script>
<link rel="stylesheet" href="assets/premium-admin-v1796.css?v=1796">
</head>
<body>
<header><a href="dashboard.php">← Tagasi töölauale</a></header>
<main>
<div class="eyebrow">PEETRI PIZZA · SYSTEM HEALTH 2.0</div>
<h1>Süsteemi tervis</h1>
<p class="sub">Serveri diagnostika ja failide tervikluse kontroll</p>
<section class="hero">
<div>
<small>ÜLDINE OLEK</small>
<h2 id="overall">Kontrollin süsteemi…</h2>
<p id="updated">Andmeid laaditakse</p>
</div>
<button type="button" id="refresh">↻ Kontrolli uuesti</button>
</section>
<div class="metrics">
<article><small>Korras</small><strong id="okCount">—</strong></article>
<article><small>Hoiatused</small><strong id="warnCount">—</strong></article>
<article><small>Vead</small><strong id="errorCount">—</strong></article>
</div>
<h2 class="section-title">Diagnostika</h2>
<div id="checks" class="checks"></div>
<p id="problem" role="alert"></p>
<p class="footnote">See leht ei muuda tellimusi ega seadistusi. Välise tellimusserveri ja avalike HTTP-kaitsereeglite tööd ei kinnitata selle kontrolliga.</p>
</main>
</body>
</html>
