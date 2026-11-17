'use strict';
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const app=path.join(root,'app/peetripizza');
const out=path.join(root,'dist/peetri-v1802-production');
const rows=[
 ['assets/kitchen-design-two-v1799.css','f9682b7671850e7edcfc9de5edb54c525c23a768'],
 ['assets/kitchen-design-switch-v1799.js','9bc9e79bf1fcf1fffd61bb472b991acab1efaa3c'],
 ['assets/order-dedup-v1801.js','-'],
 ['assets/official-reference-v1801.css','-'],
 ['assets/official-reference-v1801.js','-'],
 ['assets/app-core-v141.js','1b57baaa57d02d943692c323ec682fbc71f16b72'],
 ['dashboard.php','e6f60aa16db5820d49ae3baf00f9598cfb3e3201'],
 ['index.php','ae114a1d43b704730898fe3209e077bbf3d05fd6']
];
function blob(buf){return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex')}
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,'payload'),{recursive:true});
const manifest=[];
for(const [relative,prior] of rows){
 const input=path.join(app,relative),data=fs.readFileSync(input),target=path.join(out,'payload',relative);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,data);
 manifest.push([relative,blob(data),prior].join('|'));
}
fs.writeFileSync(path.join(out,'manifest.txt'),manifest.join('\n')+'\n');
fs.copyFileSync(path.join(__dirname,'install-peetri-production-v1802.sh'),path.join(out,'install.sh'));
fs.copyFileSync(path.join(__dirname,'restore-peetri-production-v1802.sh'),path.join(out,'restore.sh'));
fs.chmodSync(path.join(out,'install.sh'),0o755);
fs.chmodSync(path.join(out,'restore.sh'),0o755);
fs.writeFileSync(path.join(out,'README.txt'),[
'PEETRI PIZZA v18.02 — PRODUCTION RELEASE',
'Manual installation only. This is not a test page; it updates production files.',
'Upload peetri-v1802-production.zip to the domain ROOT, not the public web directory.',
'SSH using Termius or Termux:',
'cd /www/apache/domains/www.crestudio.ee',
'unzip -q peetri-v1802-production.zip -d peetri-release-staging',
'cd peetri-release-staging/peetri-v1802-production',
'bash install.sh --check',
'bash install.sh --install',
'Installer validates baseline hashes, backs up originals, checks PHP and restores on install failure.',
'Never run during active orders. Inspect LIVE and menu on production after install.',
'If unexpected baseline hash: STOP, do not force installation.',
'Rollback: bash restore.sh /www/apache/domains/www.crestudio.ee/peetri-backups/<printed-directory>'
].join('\n')+'\n');
const archive=path.join(root,'dist/peetri-v1802-production.zip');
fs.rmSync(archive,{force:true});
cp.execFileSync('zip',['-qr',archive,'peetri-v1802-production'],{cwd:path.join(root,'dist')});
console.log('RELEASE SUCCESS:',archive,'bytes',fs.statSync(archive).size);
console.log('Manifest:\n'+manifest.join('\n'));
