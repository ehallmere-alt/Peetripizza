<?php
declare(strict_types=1);
require_once __DIR__.'/auth/bootstrap.php';
pp_require_login();
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'");
?>
<!doctype html>
<html lang="et">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Seaded Pro · Peetri Pizza</title>
<link rel="stylesheet" href="assets/settings-pro-v1795.css">
<link rel="stylesheet" href="assets/premium-admin-v1796.css?v=1796">
</head>
<body>
<header>
  <div class="top">
    <a class="back" href="dashboard.php">← Töölaud</a>
    <span class="brand">PEETRI PIZZA <b>OS</b></span>
  </div>
</header>

<main>
  <div class="eyebrow">HALDUSKESKUS · V17.95</div>
  <h1>Seaded <span>Pro</span></h1>
  <p class="intro">Seadmed, diagnostika ja haldustööriistad ühes kohas.</p>

  <section class="overview">
    <div class="overview-icon">⚙</div>
    <div>
      <strong>Süsteemi juhtimiskeskus</strong>
      <p>Peetri Pizza töövahendid ja süsteemi jälgimine.</p>
    </div>
    <span class="pill">HALDUS</span>
  </section>

  <h2>Süsteemi haldus</h2>
  <div class="cards">

    <a class="card" href="devices-v1795.php">
      <span class="icon">▣</span>
      <span class="body">
        <strong>Ühendatud seadmed</strong>
        <small>Arvutid, tahvlid, LIVE-ühendus ja versioonid</small>
      </span>
      <span class="arrow">→</span>
    </a>

    <a class="card" href="health-v1795.php">
      <span class="icon">✚</span>
      <span class="body">
        <strong>Süsteemi tervis</strong>
        <small>Server, failide terviklus ja hoiatused</small>
      </span>
      <span class="arrow">→</span>
    </a>

  </div>

  <h2>Töölaud</h2>
  <div class="cards">

    <a class="card" href="dashboard.php">
      <span class="icon">⚙</span>
      <span class="body">
        <strong>Rakenduse seaded</strong>
        <small>Olemasolevad seadistused ja töölaud</small>
      </span>
      <span class="arrow">→</span>
    </a>

    <a class="card" href="analytics-pro-v1795.php">
      <span class="icon">▥</span>
      <span class="body">
        <strong>Analytics Pro</strong>
        <small>Tellimused, müük ja tunnipõhine statistika</small>
      </span>
      <span class="arrow">→</span>
    </a>

  </div>

  <p class="note">
    See juhtimiskeskus ei muuda tellimusi,
    heli, printimist ega LIVE-ühenduse seadistusi.
  </p>
</main>
</body>
</html>
