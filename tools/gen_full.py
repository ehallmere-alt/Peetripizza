#!/usr/bin/env python3
"""Full-file SSH installer: writes whole files (no diff), so it works even when a server file was changed by hand.
Usage: gen_full.py APP_DIR MIN_FROM TO OUT.txt REF_DASHBOARD files...
 - accepts any installed version >= MIN_FROM and < TO
 - REF_DASHBOARD: the reference dashboard.php of MIN_FROM; if the server copy differs, a diff is saved to the backup
   folder and its first lines are printed (so the owner can send it), then the install goes on.
 - backup of every touched file, manifest hashes updated, release-check + smoke-check, restore on failure."""
import sys, os, json, base64, hashlib
app, fv, tv, out, ref = sys.argv[1:6]
files = sys.argv[6:]
ops = []
for f in files:
    b = open(os.path.join(app, f), 'rb').read()
    ops.append({'f': f, 'c': base64.b64encode(b).decode(), 'h': hashlib.sha256(b).hexdigest()})
refb = open(ref, 'rb').read()
payload = base64.b64encode(json.dumps({'from': fv, 'to': tv, 'ops': ops, 'ref': base64.b64encode(refb).decode()}).encode()).decode()
lines = '\n'.join(payload[i:i+76] for i in range(0, len(payload), 76))
php = r'''<?php
// Peetri Pizza full install __FROM__+ -> __TO__ (whole files, works when files on the server were edited).
declare(strict_types=1);
$root=getcwd();$P=json_decode(base64_decode(preg_replace('/\s+/','',file_get_contents(__FILE__,false,null,__COMPILER_HALT_OFFSET__))),true);
function out($m){fwrite(STDOUT,$m."\n");}
function fail($m){fwrite(STDERR,"ОШИБКА: $m\n");exit(1);}
if(!is_array($P))fail('установщик повреждён при вставке, скопируй команду целиком ещё раз');
if(!is_file("$root/dashboard.php"))fail("здесь нет dashboard.php: $root");
$dash=(string)file_get_contents("$root/dashboard.php");
preg_match('/name="peetri-release" content="([^"]+)"/',$dash,$m);$cur=$m[1]??'?';
if($cur!=='?'&&version_compare($cur,$P['to'],'>=')){out("Стоит версия $cur (не ниже {$P['to']}) — ничего делать не надо.");exit(0);}
if($cur==='?'||version_compare($cur,$P['from'],'<'))fail("стоит версия $cur, а этот установщик для {$P['from']} и новее");
$result=[];
foreach($P['ops'] as $op){$t=base64_decode($op['c'],true);if($t===false||hash('sha256',$t)!==$op['h'])fail("установщик повреждён ({$op['f']})");$result[$op['f']]=$t;}
$mf="$root/tools/release-manifest.php";$man=is_file($mf)?require $mf:[];if(!is_array($man))$man=[];
foreach($P['ops'] as $op)$man[$op['f']]=$op['h'];ksort($man,SORT_STRING);
$code="<?php\n/** Auto-generated {$P['to']} file checksum map; do not include this file itself. */\nreturn [\n";foreach($man as $k=>$v)$code.="    '".$k."' => '".$v."',\n";$code.="];\n";
$result['tools/release-manifest.php']=$code;
$bdir=(is_writable(dirname($root,2))?dirname($root,2):dirname($root)).'/peetri-backups/full-'.$cur.'-to-'.$P['to'].'-'.date('Ymd-His');if(file_exists($bdir))$bdir.='-'.bin2hex(random_bytes(2));
if(!@mkdir($bdir,0700,true))fail("не удалось создать папку бэкапа $bdir");
foreach(array_keys($result) as $f){if(is_file("$root/$f")){@mkdir(dirname("$bdir/$f"),0700,true);copy("$root/$f","$bdir/$f");}}
out("Бэкап: $bdir");
// what was different in dashboard.php on the server (for the developer), install continues anyway
$ref=base64_decode($P['ref']);
if($ref!==$dash){file_put_contents("$bdir/dashboard-reference-{$P['from']}.php",$ref);
 $d=shell_exec('diff '.escapeshellarg("$bdir/dashboard-reference-{$P['from']}.php").' '.escapeshellarg("$bdir/dashboard.php").' 2>/dev/null');
 if(is_string($d)&&$d!==''){file_put_contents("$bdir/dashboard-server-diff.txt",$d);
  out("Заметка: dashboard.php на сервере был изменён вручную. Разница сохранена: $bdir/dashboard-server-diff.txt");
  $ls=preg_split('/\R/',$d);out('--- первые строки разницы ---');foreach(array_slice($ls,0,12) as $l)out(mb_substr($l,0,160));out('---');}}
$written=[];
$restore=function()use(&$written,$bdir,$root){foreach($written as $f){if(is_file("$bdir/$f"))copy("$bdir/$f","$root/$f");else @unlink("$root/$f");}};
foreach($result as $f=>$t){$path="$root/$f";@mkdir(dirname($path),0755,true);$tmp="$path.pp-tmp";
 if(file_put_contents($tmp,$t)===false||!rename($tmp,$path)){$restore();fail("не удалось записать $f — всё возвращено");}
 $written[]=$f;out("  ✓ $f");}
$php=escapeshellarg(PHP_BINARY?:'php');$rc=0;
if(is_file("$root/tools/release-check.php")){passthru("$php ".escapeshellarg("$root/tools/release-check.php")." | grep -v '^  - '",$a);$rc|=$a;}
if(is_file("$root/tools/v17-smoke-check.php")){passthru("$php ".escapeshellarg("$root/tools/v17-smoke-check.php"),$b);$rc|=$b;}
if($rc){$restore();fail("проверка не прошла — прежние файлы восстановлены");}
out("\nГОТОВО: версия {$P['to']}. Обнови страницу на планшетах без кеша.");
out("Откат: cp -r $bdir/. $root/");
__halt_compiler();'''.replace('__FROM__', fv).replace('__TO__', tv)
head = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen_patch.py')).read()
import re
m = re.search(r"NEWHEAD='(.*?)'\n", head, re.S)
newhead = eval("'" + m.group(1) + "'")
body = newhead + php + '\n' + lines + '\nPEETRI_PATCH_END\n[ -f /tmp/pp-patch.php ] && php /tmp/pp-patch.php; rm -f /tmp/pp-patch.php\n'
open(out, 'w').write(body)
print(out, len(body), 'bytes', len(files), 'files')
