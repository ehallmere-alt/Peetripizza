<?php
/** Read-only v16.9.1 deployment checksum audit. Execute via CLI from any CWD. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
$manifest = require __DIR__ . '/release-manifest.php';
if (!is_array($manifest)) { fwrite(STDERR, "Manifest invalid.\n"); exit(2); }
$missing=[]; $changed=[]; $ok=0;
foreach ($manifest as $rel=>$expected) {
    if (!is_string($rel)||!is_string($expected)||str_contains($rel,'..')) {fwrite(STDERR,"Invalid manifest.\n");exit(2);}
    $file = $root . '/' . $rel;
    if (!is_file($file)) { $missing[]=$rel; continue; }
    if (!hash_equals($expected, hash_file('sha256',$file))) { $changed[]=$rel; continue; }
    ++$ok;
}
$extra=[];
foreach (glob($root.'/assets/*')?:[] as $path) {
    if (!is_file($path)) continue;
    $rel='assets/'.basename($path);
    if (!isset($manifest[$rel])) $extra[]=$rel;
}
foreach (glob($root.'/README-v*.md')?:[] as $path) $extra[]=basename($path);
foreach (['tests-v150.php','sample-orders.json'] as $rel) if (is_file($root.'/'.$rel)) $extra[]=$rel;
$extra=array_values(array_unique($extra));sort($extra);
echo "Peetri Pizza Service App v17.55.0 — audit installed files\n";
echo "Matched: $ok / ".count($manifest)." | Missing: ".count($missing)." | Modified: ".count($changed)." | Legacy leftovers: ".count($extra)."\n";
foreach (['Missing files'=>$missing,'Modified files'=>$changed,'Legacy leftovers (review before manual deletion)'=>$extra] as $title=>$items) {
    if (!$items) continue;
    echo "\n$title:\n";
    foreach ($items as $rel) echo "  - $rel\n";
}
echo "\nImportant: This tool does not delete anything, check LIVE/server state, or verify HTTP access controls.\n";
if ($missing || $changed) exit(1);
if ($extra) echo "Release files are correct; obsolete files remain and can be cleaned only after backup.\n";
else echo "Release files are correct; no old assets/README files detected.\n";
exit(0);
