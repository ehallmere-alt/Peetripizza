'use strict';
/* Build a STATIC, ISOLATED review archive. No PHP, auth, database or actual orders.
   Browser CSP prevents network API calls and form submissions. */
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const base=path.resolve(__dirname,'../app/peetripizza');
const dist=path.resolve(__dirname,'../dist/peetri-v1802-review');
const fixture=path.join(base,'browser-fixture-v1802.html');
if(!fs.existsSync(fixture))throw Error('First run generate-browser-fixture-v1802.cjs');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
const css='<style id="test-safety-banner">#pp-review-notice{position:fixed;bottom:0;left:0;right:0;z-index:2147483600;padding:8px 14px;background:#162e24;color:#fff;font:700 13px/1.4 system-ui;text-align:center;box-shadow:0 -2px 12px #0003}body{padding-bottom:40px!important}</style>';
const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; font-src \'self\' data:; connect-src \'none\'; form-action \'none\'; frame-src \'none\'; worker-src \'none\'; object-src \'none\'; base-uri \'none\'">';
let html=fs.readFileSync(fixture,'utf8');
html=html.replace(/<head>/i,'<head>'+csp+css);
html=html.replace(/<\/body>/i,'<div id="pp-review-notice">TESTVERSIOON · Ainult näidisandmed · LIVE/API/printimine puudub</div></body>');
fs.writeFileSync(path.join(dist,'index.html'),html);
const assetDir=path.join(base,'assets');
if(!fs.existsSync(assetDir))throw Error('Missing assets');
fs.cpSync(assetDir,path.join(dist,'assets'),{recursive:true,filter:p=>{
 const rel=path.relative(assetDir,p);
 return !/(^|[/\\])(\.env|\.git|node_modules)([/\\]|$)/.test(rel);
}});
fs.writeFileSync(path.join(dist,'robots.txt'),'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(dist,'.htaccess'),'Options -Indexes\n<IfModule mod_headers.c>\nHeader always set X-Robots-Tag "noindex, nofollow, noarchive"\nHeader always set Cache-Control "no-store"\n</IfModule>\n');
const archive=path.resolve(__dirname,'../dist/peetri-v1802-review.zip');
fs.rmSync(archive,{force:true});
cp.execFileSync('zip',['-qr',archive,'peetri-v1802-review'],{cwd:path.dirname(dist)});
console.log('SUCCESS: isolated review ZIP',archive,'bytes',fs.statSync(archive).size);
console.log('NO LIVE / API access; static HTML, CSS and JS only.');
