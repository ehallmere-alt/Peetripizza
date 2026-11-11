#!/usr/bin/env python3
"""Generate a paste-into-SSH patch script for Peetri Pizza.
usage: gen_patch.py BASE_DIR NEW_DIR FROM_VER TO_VER OUT.sh file1 file2 ...
Modified files -> unique (old,new) replacement pairs; new files -> full content.
Every result is verified by sha256 before anything is written; backup + checks + auto-restore."""
import sys,os,hashlib,base64,difflib,json
base,new,fv,tv,out=sys.argv[1:6];files=sys.argv[6:]
def rd(p):return open(p,'rb').read().decode('utf-8') if os.path.exists(p) else None
ops=[]
for f in files:
    a,b=rd(os.path.join(base,f)),rd(os.path.join(new,f))
    if a==b:continue
    if a is None:
        ops.append({'f':f,'new':True,'c':b,'h':hashlib.sha256(b.encode()).hexdigest()});continue
    sm=difflib.SequenceMatcher(None,a,b,autojunk=False)
    diffs=[(i1,i2,j1,j2) for tag,i1,i2,j1,j2 in sm.get_opcodes() if tag!='equal']
    # group nearby changes into regions (a-span, b-span)
    regs=[]
    for i1,i2,j1,j2 in diffs:
        if regs and i1-regs[-1][1]<80: regs[-1]=[regs[-1][0],i2,regs[-1][2],j2]
        else: regs.append([i1,i2,j1,j2])
    for ctx in (16,32,64,128,256,512):
        spans=[]
        for i1,i2,j1,j2 in regs:
            s0,e0=max(0,i1-ctx),min(len(a),i2+ctx)
            while a.count(a[s0:e0])!=1 and (s0>0 or e0<len(a)): s0,e0=max(0,s0-ctx),min(len(a),e0+ctx)
            js,je=j1-(i1-s0),j2+(e0-i2)
            if spans and s0<spans[-1][1]: spans[-1]=[spans[-1][0],e0,spans[-1][2],je]
            else: spans.append([s0,e0,js,je])
        pairs=[[a[s0:e0],b[js:je]] for s0,e0,js,je in spans]
        t=a;ok=True
        for o,n in pairs:
            if t.count(o)!=1: ok=False;break
            t=t.replace(o,n)
        if ok and t==b: break
    else: raise SystemExit('cannot build pairs for '+f)
    ops.append({'f':f,'new':False,'p':pairs,'h':hashlib.sha256(b.encode()).hexdigest(),'h0':hashlib.sha256(a.encode()).hexdigest()})
payload=base64.b64encode(json.dumps({'from':fv,'to':tv,'ops':ops},ensure_ascii=False).encode()).decode()
lines='\n'.join(payload[i:i+76] for i in range(0,len(payload),76))
php=r'''<?php
// Peetri Pizza patch __FROM__ -> __TO__. Verifies every file by SHA-256 before writing anything.
declare(strict_types=1);
$root=getcwd();$P=json_decode(base64_decode(preg_replace('/\s+/','',file_get_contents(__FILE__,false,null,__COMPILER_HALT_OFFSET__))),true);
function out($m){fwrite(STDOUT,$m."\n");}
function fail($m){fwrite(STDERR,"ОШИБКА: $m\n");exit(1);}
if(!is_array($P))fail('патч повреждён при вставке, скопируй команду целиком ещё раз');
if(!is_file("$root/dashboard.php"))fail("здесь нет dashboard.php: $root");
preg_match('/name="peetri-release" content="([^"]+)"/',(string)file_get_contents("$root/dashboard.php"),$m);$cur=$m[1]??'?';
if(version_compare($cur,$P['to'],'>=')){out("Стоит версия $cur (не ниже {$P['to']}) — пропускаю этот шаг.");exit(0);}
if($cur!==$P['from'])fail("ожидалась версия {$P['from']}, а стоит $cur — патч не подходит");
$result=[];
foreach($P['ops'] as $op){$f=$op['f'];$path="$root/$f";
 if($op['new']){$t=$op['c'];}
 else{ if(!is_file($path))fail("нет файла $f");$t=file_get_contents($path);
  if(hash('sha256',$t)!==$op['h0'])fail("файл $f на сервере отличается от $P[from] — патч не применён, ничего не изменено");
  foreach($op['p'] as [$o,$n]){if(substr_count($t,$o)!==1)fail("не найдено место правки в $f");$t=str_replace($o,$n,$t);} }
 if(hash('sha256',$t)!==$op['h'])fail("контрольная сумма $f не совпала — ничего не изменено");
 $result[$f]=$t;}
// manifest: set expected hashes for touched files
$mf="$root/tools/release-manifest.php";$man=require $mf;foreach($P['ops'] as $op)$man[$op['f']]=$op['h'];ksort($man,SORT_STRING);
$code="<?php\n/** Auto-generated {$P['to']} file checksum map; do not include this file itself. */\nreturn [\n";foreach($man as $k=>$v)$code.="    '".$k."' => '".$v."',\n";$code.="];\n";
$result['tools/release-manifest.php']=$code;
$bdir=(is_writable(dirname($root,2))?dirname($root,2):dirname($root)).'/peetri-backups/patch-'.$P['from'].'-to-'.$P['to'].'-'.date('Ymd-His');if(file_exists($bdir))$bdir.='-'.bin2hex(random_bytes(2));
if(!@mkdir($bdir,0700,true))fail("не удалось создать папку бэкапа $bdir");
foreach(array_keys($result) as $f){if(is_file("$root/$f")){@mkdir(dirname("$bdir/$f"),0700,true);copy("$root/$f","$bdir/$f");}}
out("Бэкап изменяемых файлов: $bdir");
$written=[];
$restore=function()use(&$written,$bdir,$root){foreach($written as $f){if(is_file("$bdir/$f"))copy("$bdir/$f","$root/$f");else @unlink("$root/$f");}};
foreach($result as $f=>$t){$path="$root/$f";@mkdir(dirname($path),0755,true);$tmp="$path.pp-tmp";
 if(file_put_contents($tmp,$t)===false||!rename($tmp,$path)){$restore();fail("не удалось записать $f — всё возвращено");}
 if(str_ends_with($f,'.sh'))@chmod($path,0755);$written[]=$f;out("  ✓ $f");}
$php=escapeshellarg(PHP_BINARY?:'php');$rc=0;
passthru("$php ".escapeshellarg("$root/tools/release-check.php")." | grep -v '^  - '",$a);$rc|=$a;
passthru("$php ".escapeshellarg("$root/tools/v17-smoke-check.php"),$b);$rc|=$b;
if($rc){$restore();fail("проверка не прошла — прежние файлы восстановлены");}
out("\nГОТОВО: версия {$P['to']}. Обнови страницу на планшетах без кеша.");
out("Откат: cp -r $bdir/. $root/");
__halt_compiler();
'''.replace('__FROM__',fv).replace('__TO__',tv)
NEWHEAD='# Peetri: ищу папку приложения (можно задать вручную: PP_APP=/путь/к/peetripizza)\nPP_APP="${PP_APP:-}"\nif [ -z "$PP_APP" ]; then for d in /www/apache/domains/www.crestudio.ee/htdocs/peetripizza "$HOME/htdocs/peetripizza" "$HOME/peetripizza" "$PWD"; do if [ -f "$d/dashboard.php" ] && [ -f "$d/auth/bootstrap.php" ]; then PP_APP="$d"; break; fi; done; fi\nif [ -z "$PP_APP" ]; then PP_FOUND=$(find "$HOME" /www /var/www /data01 -maxdepth 8 -type f -path \'*/peetripizza/auth/bootstrap.php\' 2>/dev/null | head -n 5); if [ "$(printf \'%s\\n\' "$PP_FOUND" | grep -c .)" = "1" ]; then PP_APP=$(dirname "$(dirname "$PP_FOUND")"); fi; fi\nrm -f /tmp/pp-patch.php\n[ -n "$PP_APP" ] || echo "ОШИБКА: не нашёл папку приложения (peetripizza). Пришли разработчику вывод: find / -name dashboard.php -path \'*peetripizza*\' 2>/dev/null"\n[ -n "$PP_APP" ] && echo "Папка приложения: $PP_APP" && cd "$PP_APP" && cat > /tmp/pp-patch.php <<\'PEETRI_PATCH_END\'\n'
sh=(NEWHEAD+php+lines+"\nPEETRI_PATCH_END\n[ -f /tmp/pp-patch.php ] && php /tmp/pp-patch.php; rm -f /tmp/pp-patch.php\n")
open(out,'w').write(sh);print(out,len(sh),'bytes',len(ops),'files')
