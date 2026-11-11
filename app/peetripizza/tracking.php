<?php
declare(strict_types=1);
// Public status page: token is an unguessable 24-hour bearer capability.
header('Cache-Control: no-store, private');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Content-Security-Policy: default-src \'none\'; script-src \'self\'; style-src \'self\'; connect-src \'self\'; img-src \'self\'; base-uri \'none\'; frame-ancestors \'none\'; form-action \'none\'');
$token=$_GET['t']??'';$valid=is_string($token)&&preg_match('/^[1-9][0-9]{0,6}\.[a-f0-9]{64}$/D',$token);
?><!doctype html><html lang="et"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ecf4ee"><title>Tellimuse jälgimine — Peetri Pizza</title><link rel="stylesheet" href="assets/tracking-v156.css?v=15.6.0"></head><body>
<main class="tracking"><div class="heading"><strong>Peetri Pizza</strong><span>KOLDE · tellimuse jälgimine</span></div><div class="track-card"><div class="badge">KÖÖGI TEAVE · MITTE AMETLIK KLIENDISTAATUS</div><h1 id="track-title">Tellimuse olek</h1><p id="track-caption" role="status" aria-live="polite">Kontrollin tellimust…</p><div class="pp156-progress" role="progressbar" aria-label="Tellimuse etapid" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0"><span id="pp156-progress-fill"></span></div><ol id="track-steps"><li>Vastu võetud</li><li>Valmistamisel</li><li>Valmis</li><li>Üle antud</li></ol><div id="pp156-ready-message" class="pp156-ready-message" hidden></div><p id="track-updated" class="updated">—</p><p id="pp156-check-time" class="updated"></p><button type="button" id="pp156-check-now" class="pp156-check-now">↻ Kontrolli olekut</button><p id="track-fresh" class="fresh"></p></div><p class="warning">⚠ See leht näitab köögi sisemist infot, mitte Peetri Pizza ametlikku tellimuse staatust. Tellimuse kohta saab lõpliku kinnituse restoranist. See leht ei saada automaatseid teavitusi.</p><p class="foot">Link kehtib 24 tundi · uuendused iga 10 sekundi järel, kui leht on avatud.</p></main>
<script src="assets/tracking-v156.js?v=15.6.0" data-token="<?= $valid?htmlspecialchars($token,ENT_QUOTES,'UTF-8'):'' ?>" defer></script></body></html>
