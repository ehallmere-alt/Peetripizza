<?php
/** Peetri Pizza safe legacy assets quarantine, CLI only, 2026-11-11. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
$manifestPath = $root.'/tools/release-manifest.php';
if (!is_file($manifestPath)) {fwrite(STDERR,"STOP: missing tools/release-manifest.php. Install v16.9.2 first.\n");exit(2);}
$manifest = require $manifestPath;
if (!is_array($manifest) || !isset($manifest['assets/kitchen-release-v166.css']) || !is_file($root.'/assets/menu-live-v1692.js')) {fwrite(STDERR,"STOP: wrong release manifest. Expected v16.9.2.\n");exit(2);}
// v16.9.2 hotfix shipped five updated files without regenerating the old manifest.
// Pin their exact hashes from the distributed v16.9.2 ZIP to prevent false mismatch.
$hotfixHashes = [
 'assets/dough-v169.css'=>'1dcf12f26f1196c6367273f0c47386135bfcae932b55155db320e113c19152f6',
 'assets/dough-v169.js'=>'2239628b8727b0839e9f385aeebb705aa069a0379417b80f3c59a695d7eeb5c8',
 'assets/settings-v169.css'=>'8b2a876abc2495d06fc241190f1738ebddfb2381794debf480d3d45d8b972db2',
 'dashboard.php'=>'1ba0208a2ea035b52603d0f28f946631d32ff926f425f4df114710d4ade9a0e1',
 'dough.php'=>'d9fc5914f744d113a899b12da46cc7d63f97783fc73dcb5ce92e01c7daf56fbe',
 'assets/menu-live-v1692.js'=>'ff17e37140a315b77a5624030f14510cbc2773d2f04214a7e4149dd4f0b0f9a5'
];
$missing=[]; $modified=[];
foreach ($manifest as $rel=>$sha) {
    if (!is_string($rel) || str_contains($rel,'..') || str_starts_with($rel,'/') || !preg_match('/^[a-f0-9]{64}$/',$sha)) {fwrite(STDERR,"STOP: invalid manifest.\n");exit(2);}
    $file=$root.'/'.$rel;
    if (!is_file($file)) $missing[]=$rel;
    elseif (!hash_equals($hotfixHashes[$rel]??$sha,hash_file('sha256',$file))) $modified[]=$rel;
}
if (!hash_equals($hotfixHashes['assets/menu-live-v1692.js'],hash_file('sha256',$root.'/assets/menu-live-v1692.js'))) $modified[]='assets/menu-live-v1692.js';
if ($missing||$modified) {
    fwrite(STDERR,"STOP: release mismatch. Missing=".count($missing).", changed=".count($modified).".\n");
    foreach (array_slice(array_merge($missing,$modified),0,15) as $rel) fwrite(STDERR,"  $rel\n");
    fwrite(STDERR,"Do not clean until release-check.php passes.\n"); exit(2);
}
// Only obsolete versioned JS/CSS files, directly under assets/. No PHP, configuration or data is touched.
$files=[];
foreach (glob($root.'/assets/*')?:[] as $path) {
    if (!is_file($path)||is_link($path)) continue;
    $name=basename($path); $rel='assets/'.$name;
    if (isset($manifest[$rel])) continue;
    if (!preg_match('/^(?:[a-z][a-z0-9-]*-v[0-9][a-z0-9.-]*|[a-z][a-z0-9-]*)\.(?:css|js)$/i',$name)) continue;
    if ($name==='menu-live-v1692.js') continue; // v16.9.2 hotfix asset missing from generated manifest
    $files[$rel]=$path;
}
// Skip anything that is explicitly named by one of the currently installed source files.
$references=[];
foreach ($manifest as $rel=>$sha) {
    if (!preg_match('/\.(?:php|js|css|html)$/i',$rel)) continue;
    $content=file_get_contents($root.'/'.$rel);
    if ($content===false) continue;
    foreach ($files as $oldRel=>$path) {
       if (str_contains($content,basename($path))) $references[$oldRel]=true;
    }
}
foreach (array_keys($references) as $rel) unset($files[$rel]);
ksort($files);
$mode=$argv[1]??'--dry-run';
if (!in_array($mode,['--dry-run','--apply'],true)) {fwrite(STDERR,"Usage: php tools/cleanup-legacy.php [--dry-run|--apply]\n");exit(2);}
echo "Release v16.9.2 checksum: OK (".count($manifest)." files)\n";
echo "Unused versioned CSS/JS candidates: ".count($files)."\n";
foreach ($files as $rel=>$path) echo "  $rel\n";
if ($references) echo "Preserved referenced legacy files: ".count($references)."\n";
if ($mode==='--dry-run') {echo "DRY RUN: nothing changed. To quarantine: --apply\n";exit;}
if (!$files) {echo "Nothing to quarantine.\n";exit;}
$hostRoot=dirname(dirname($root)); // htdocs/peetripizza -> vhost root outside webroot
$tag=date('Ymd-His').'-'.bin2hex(random_bytes(3));
$backup=$hostRoot.'/peetripizza-cleanup-'.$tag;
if (!@mkdir($backup.'/assets',0700,true)) {fwrite(STDERR,"STOP: unable to create $backup. Nothing moved.\n");exit(2);}
$completed=[]; $failure=[];
foreach ($files as $rel=>$path) {
    $target=$backup.'/'.$rel;
    if (!@rename($path,$target)) { $failure[]=$rel; continue; }
    $completed[]=$rel;
}
file_put_contents($backup.'/RESTORE.txt',"Restore with:\ncd ".escapeshellarg($root)."\ncp -an ".escapeshellarg($backup.'/assets/.')." assets/\n\nMoved files:\n".implode("\n",$completed)."\n");
echo "Quarantined ".count($completed)." files to $backup\n";
echo "Restore: cp -an ".escapeshellarg($backup.'/assets/.')." ".escapeshellarg($root.'/assets/')."\n";
if ($failure) {fwrite(STDERR,"FAILED to move: ".implode(', ',$failure)."\n");exit(1);}
