<?php
declare(strict_types=1);
/* Peetri Pizza v17.49 — owner's check page: are the kitchen tablets alive, is LIVE coming, which version. Read-only. */
require_once __DIR__.'/auth/bootstrap.php';
pp_require_login(false);
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
$loc=$_SESSION['pp_pizzeria']??null;
$name=htmlspecialchars((string)(is_array($loc)?($loc['name']??''):''),ENT_QUOTES,'UTF-8');
?><!doctype html><html lang="et"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#00824a"><title>Köögi kontroll — Peetri Pizza</title><link rel="stylesheet" href="assets/check-v1749.css?v=17.49.0"><link rel="icon" type="image/png" sizes="192x192" href="assets/icon-192.png"></head>
<body><main class="pp1749-check">
<header><a href="dashboard.php" class="pp1749-back">← Tellimused</a><div><small>Peetri Pizza · <?= $name ?></small><h1>Köögi kontroll</h1></div></header>
<section class="pp1749-sum" id="sum" aria-live="polite"><p>Laen…</p></section>
<section><h2>Tahvlid</h2><div id="list" class="pp1749-list"></div></section>
<p class="pp1749-note">Tahvel annab endast märku iga minut, kui töölaud on lahti. Siin pole tellimusi ega kliendi andmeid. Leht uueneb ise iga 30 sekundi järel.</p>
</main><script src="assets/check-v1749.js?v=17.49.0"></script></body></html>
