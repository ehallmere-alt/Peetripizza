#!/usr/bin/env node
/* Read-only checks for the event-driven decoration of Valmis cards. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/ops-v1740.js'),'utf8').trimEnd();
const bundle=fs.readFileSync(path.join(root,'assets/app-b-v1767.js'),'utf8');
const header='/* == assets/ops-v1740.js == */\ntry{(function(){\n';
const footer='\n}).call(window);}catch(e){setTimeout(function(){throw e},0);}';
const begin=bundle.indexOf(header);
assert(begin>=0,'missing bundle marker');
const end=bundle.indexOf(footer,begin+header.length);
assert(end>begin,'missing closing wrapper');
assert.equal(bundle.slice(begin+header.length,end),source,'source/bundle drift');
assert(!/setInterval\s*\(\s*decorate\s*,\s*1500\s*\)/.test(source));
assert(source.includes("window.addEventListener('pp145:orders',queue)"));
const rootNode={};
let observerCallback, frames=[], orderListener;
const doc={
  readyState:'complete',
  documentElement:{},
  getElementById:id=>id==='doneOrders'?rootNode:null,
  querySelectorAll:()=>[],
  addEventListener:()=>{},
};
const win={
  addEventListener:(name,fn)=>{if(name==='pp145:orders')orderListener=fn;},
};
const Observer=class {
  constructor(callback){observerCallback=callback;}
  observe(element,options){
    assert.equal(element,rootNode);
    assert.equal(options.childList,true);
    assert.equal(options.subtree,true);
  }
};
vm.runInNewContext(source,{
  window:win,
  document:doc,
  MutationObserver:Observer,
  requestAnimationFrame:callback=>frames.push(callback),
  setTimeout:()=>{throw Error('Unexpected timer in event-driven decoration');},
});
assert.equal(frames.length,1,'initial scan should be scheduled');
frames.shift()();
assert.equal(typeof observerCallback,'function','ready orders observer not installed');
assert.equal(typeof orderListener,'function','orders event not installed');
observerCallback();observerCallback();orderListener();
assert.equal(frames.length,1,'render scheduling was not coalesced');
frames.shift()();
console.log('PASS: decoration source/bundle parity, observer and event coalescing');
