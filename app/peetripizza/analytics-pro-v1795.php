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
<title>Analytics Pro · Peetri Pizza</title>
<link rel="stylesheet" href="assets/analytics-pro-v1795.css">
<script src="assets/analytics-pro-v1795.js" defer></script>
<link rel="stylesheet" href="assets/premium-admin-v1796.css?v=1796">
</head>
<body>
<header>
  <div class="top">
    <a href="settings-pro-v1795.php">← Seaded Pro</a>
    <strong>PEETRI PIZZA <span>OS</span></strong>
  </div>
</header>
<main>
  <div class="eyebrow">ANALYTICS PRO · V17.95</div>
  <h1>Statistika <span>Pro</span></h1>
  <p class="intro">Tellimuste ülevaade ja müügistatistika</p>

  <nav class="periods" aria-label="Periood">
    <button type="button" data-period="today" class="selected">Täna</button>
    <button type="button" data-period="yesterday">Eile</button>
    <button type="button" data-period="7d">7 päeva</button>
    <button type="button" data-period="month">See kuu</button>
  </nav>

  <div id="message" role="status">Andmeid laaditakse…</div>

  <section class="metrics" aria-label="Põhinäitajad">
    <article><small>Tellimused</small><strong id="orders">—</strong><span id="comparison">—</span></article>
    <article><small>Käive</small><strong id="revenue">—</strong><span id="coverage">—</span></article>
    <article><small>Keskmine ost</small><strong id="average">—</strong><span>Salvestatud summade põhjal</span></article>
    <article><small>Pitsad</small><strong id="pizzas">—</strong><span>Salvestatud toodete arv</span></article>
  </section>

  <section class="panel">
    <div class="panel-head">
      <div><small>TELLIMUSTE AKTIIVSUS</small><h2>Tellimused tundide lõikes</h2></div>
      <span id="peak">—</span>
    </div>
    <div class="chart" id="chart" aria-label="Tellimuste graafik"></div>
    <div class="axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
  </section>

  <p class="note">Näidatakse rakenduse sisemiselt salvestatud andmeid. Käive ja keskmine ost võivad olla osalised, kui mõne tellimuse summat pole salvestatud. Andmeid ei muudeta.</p>
</main>
</body>
</html>
