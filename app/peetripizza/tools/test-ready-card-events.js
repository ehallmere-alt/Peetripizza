#!/usr/bin/env node
/* Read-only regression guard for ready-card badge event updates.
 * No browser, order, server or device access.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/ops-v1766.js'),'utf8').trimEnd();
const bundle=fs.readFileSync(path.join(root,'assets/app-b-v1767.js'),'utf8');
const start='/* == assets/ops-v1766.js == */\ntry{(function(){\n';
const stop='\n}).call(window);}catch(e){setTimeout(function(){throw e},0);}';
const si=bundle.indexOf(start);
assert(si>=0,'module marker missing');
const ei=bundle.indexOf(stop,si+start.length);
assert(ei>si,'module boundary missing');
assert.equal(bundle.slice(si+start.length,ei),source,'source/bundle drift');
assert(!/setInterval\s*\(\s*tag\s*,\s*1200\s*\)/.test(source),'legacy polling remains');
assert(/new MutationObserver\s*\(queue\)/.test(source),'DOM observer missing');
assert(source.includes("window.addEventListener('pp145:orders',queue)"),'orders event missing');

const cards=[];
const fakeRoot={};
let callback=null;
let pending=[];
const fakeDocument={
  getElementById:k=>k==='doneOrders'?fakeRoot:null,
  querySelectorAll:selector=>selector==='.pp112-done-card'?cards:[],
  readyState:'complete',
  createElement:tag=>({className:'',textContent:''}),
  addEventListener:()=>{},
};
const fakeWindow={addEventListener:()=>{}};
const MutationObserverMock=class {
  constructor(cb){callback=cb;}
  observe(root,config){
    assert.equal(root,fakeRoot);
    assert.equal(config.childList,true);
    assert.equal(config.subtree,true);
  }
};
const vm=require('node:vm');
vm.runInNewContext(source,{
  document:fakeDocument,
  window:fakeWindow,
  MutationObserver:MutationObserverMock,
  requestAnimationFrame:cb=>{pending.push(cb);},
  console,
});
assert.equal(pending.length,1,'initial scan must be queued once');
pending.shift()();
assert.equal(typeof callback,'function','observer must be connected');
callback();
callback();
assert.equal(pending.length,1,'multiple changes must be coalesced');
pending.shift()();
// Model a ready-card lifecycle: add pizza, update quantity, remove product.
// Mutations are explicitly delivered to the mock observer, like browser microtasks.
let badge=null;
let badgeInCard=false;
let products=[];
const card={
  querySelectorAll:sel=>sel==='.pp112-product'?products:[],
  querySelector:sel=>{
    if(sel==='.pp1766-pz')return badgeInCard?badge:null;
    if(sel==='.pp112-card-identity>div')return {append:node=>{assert.equal(node.className,'pp1766-pz');badgeInCard=true;badge=node;}};
    return null;
  },
};
const makeProduct=(quantity,hasPizzaCode)=>({
  querySelector:sel=>{
    if(sel==='.pp177-code')return hasPizzaCode?{}:null;
    if(sel==='.pp112-qty')return {textContent:String(quantity)};
    return null;
  },
});
cards.push(card);
products=[makeProduct(2,true),makeProduct(1,false)];
callback();pending.shift()();
assert.equal(badge.textContent,'2 pitsat','counts only pizzas, not drinks');
products=[makeProduct(3,true)];
callback();pending.shift()();
assert.equal(badge.textContent,'3 pitsat','quantity changes refresh badge');
products=[makeProduct(1,true)];
callback();pending.shift()();
assert.equal(badge.textContent,'1 pitsa','singular label');
products=[];
badge.remove=()=>{badgeInCard=false;};
callback();pending.shift()();
assert.equal(badgeInCard,false,'badge disappears when no pizza remains');

console.log('PASS: pizza count module source/bundle parity, event observer and coalescing');
