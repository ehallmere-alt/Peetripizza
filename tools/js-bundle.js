#!/usr/bin/env node
/* Peetri Pizza: glue the <script> files at the end of dashboard.php into a few files (same run order).
   usage: node tools/js-bundle.js app/peetripizza 1767
   Run order in the browser before: plain <script> files run first (while the page is parsed), then every
   "defer" file in page order. The bundles keep exactly that order:
     app-a-vNNNN.js  = the plain scripts, then the defer files before app-core
     app-core-v141.js stays its own file (it is 'use strict' and declares the shared globals: const $, toast …)
     app-b-vNNNN.js  = every defer file after app-core
   Each glued file runs inside its own function and try/catch: a crash in one file no longer stops the next,
   the error still reaches window.onerror (client-log). Files with top-level const/let/function are refused
   (they would change meaning inside a function) — only app-core has them.
   The original <script> tags are kept in an HTML comment (humans + smoke check see what is inside).
   Needs the TypeScript package only to check the files (dev tool, not deployed). */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
let ts;try{ts=require('typescript')}catch(_){ts=require('/opt/node22/lib/node_modules/typescript')}
const [app,ver]=process.argv.slice(2);if(!app||!ver)throw new Error('usage: js-bundle.js APP_DIR VERSION(e.g. 1767)');
const dashPath=path.join(app,'dashboard.php');let html=fs.readFileSync(dashPath,'utf8');
const bodyEnd=html.lastIndexOf('</body>');
const re=/<script src="(assets\/[^"?]+\.js)(\?[^"]*)?"( defer)?><\/script>/g;
const tags=[];let m;while((m=re.exec(html))){if(m.index>bodyEnd)break;tags.push({file:m[1],defer:!!m[3],start:m.index,end:m.index+m[0].length,tag:m[0]});}
const body=tags.filter(t=>t.start>html.indexOf('<body'));
if(!body.length)throw new Error('no body scripts (already bundled?)');
// the scripts must be one block (only whitespace between them)
for(let i=1;i<body.length;i++)if(html.slice(body[i-1].end,body[i].start).trim())throw new Error('scripts are not one block near '+body[i].file);
const CORE='assets/app-core-v141.js';
const coreIdx=body.findIndex(t=>t.file===CORE);if(coreIdx<0)throw new Error('app-core not found');
const plain=body.filter(t=>!t.defer),deferred=body.filter(t=>t.defer);
const dCore=deferred.findIndex(t=>t.file===CORE);
const groupA=[...plain,...deferred.slice(0,dCore)],groupB=deferred.slice(dCore+1);
function check(file,src){
 const sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const bad=sf.statements.filter(s=>!ts.isExpressionStatement(s)&&!ts.isEmptyStatement(s));
 if(bad.length)throw new Error(file+': top-level '+bad.map(s=>ts.SyntaxKind[s.kind]).join(',')+' — cannot be wrapped');
 if(sf.parseDiagnostics&&sf.parseDiagnostics.length)throw new Error(file+': syntax error');
}
function build(group,name){
 const parts=['/* Peetri Pizza: '+group.length+' scripts in one file, same run order as the separate <script> tags (tools/js-bundle.js). Do not edit; edit the sources and rebuild. */'];
 for(const t of group){
  const src=fs.readFileSync(path.join(app,t.file),'utf8');check(t.file,src);
  parts.push('/* == '+t.file+' == */\ntry{(function(){\n'+src.replace(/\s+$/,'')+'\n}).call(window);}catch(e){setTimeout(function(){throw e},0);}');
 }
 const out=parts.join('\n')+'\n';fs.writeFileSync(path.join(app,'assets',name),out);
 return '<script src="assets/'+name+'?v='+crypto.createHash('sha256').update(out).digest('hex').slice(0,10)+'" defer></script>';
}
const a=build(groupA,'app-a-v'+ver+'.js'),b=build(groupB,'app-b-v'+ver+'.js');
const core=body[coreIdx].tag;
const block=html.slice(body[0].start,body[body.length-1].end);
const repl=a+core+b+'<!-- app-a-v'+ver+'.js + app-core + app-b-v'+ver+'.js = these, in this run order: '+[...groupA.map(t=>t.tag.replace(/<\/script>$/,'')),'[app-core-v141.js: own tag above]',...groupB.map(t=>t.tag.replace(/<\/script>$/,''))].join(' ')+' -->';
html=html.slice(0,body[0].start)+repl+html.slice(body[body.length-1].end);
fs.writeFileSync(dashPath,html);
console.log('A:',groupA.length,'files  core: 1  B:',groupB.length,'files');
