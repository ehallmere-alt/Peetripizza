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
  createElement:()=>({className:'',innerHTML:''}),
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
  shownOrders:()=>[{id:'D1',serving:'delivery'},{id:'T2',serving:'pickup'}],
});
assert.equal(frames.length,1,'initial scan should be scheduled');
frames.shift()();
assert.equal(typeof observerCallback,'function','ready orders observer not installed');
assert.equal(typeof orderListener,'function','orders event not installed');
observerCallback();observerCallback();orderListener();
assert.equal(frames.length,1,'render scheduling was not coalesced');
frames.shift()();
// Simulate two newly rendered ready orders (delivery and pickup).
let addedNodes=[];
let delivery={
  dataset:{orderId:'D1'},
  tags:[],
  inserted:null,
  classList:{add(...args){delivery.tags.push(...args);}},
  querySelector(sel){
    if(sel==='.pp112-number')return {after(node){delivery.inserted=node;}};
    if(sel==='.pp1730-chips')return delivery.inserted;
    return null;
  },
};
let takeaway={
  dataset:{orderId:'T2'},
  tags:[],
  inserted:null,
  classList:{add(...args){takeaway.tags.push(...args);}},
  querySelector(sel){
    if(sel==='.pp112-number')return {after(node){takeaway.inserted=node;}};
    if(sel==='.pp1730-chips')return takeaway.inserted;
    return null;
  },
};
addedNodes=[delivery,takeaway];
doc.querySelectorAll=sel=>{
  assert.equal(sel,'#doneOrders .pp112-done-card[data-order-id]:not([data-pp1740])');
  return addedNodes.filter(c=>!c.dataset.pp1740);
};
observerCallback();
frames.shift()();
assert(delivery.tags.includes('pp1730-t-kuller'),'delivery badge must be applied');
assert(takeaway.tags.includes('pp1730-t-kaasa'),'takeaway badge must be applied');
assert(delivery.inserted.innerHTML.includes('KULLERIGA'),'delivery label');
assert(takeaway.inserted.innerHTML.includes('KAASA'),'takeaway label');
observerCallback();
frames.shift()();
assert(delivery.dataset.pp1740==='1','card must not be decorated twice');
console.log('PASS: decoration source/bundle parity, observer and event coalescing');
