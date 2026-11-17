'use strict';
/* Behavioral guard for kitchen menu and LIVE button, using the production JS.
 * No server / login / orders / printer access.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const dir=process.argv[2]||path.resolve(__dirname,'../app/peetripizza');
const core=fs.readFileSync(path.join(dir,'assets/app-core-v141.js'),'utf8');
const bundled=fs.readFileSync(path.join(dir,'assets/app-b-v1767.js'),'utf8');
const dashboard=fs.readFileSync(path.join(dir,'dashboard.php'),'utf8');

function element(id) {
 const classes=new Set(),attributes=new Map();
 const node={
   id,hidden:false,checked:false,children:[],textContent:'',
   classList:{
     add(...names){names.forEach(n=>classes.add(n))},
     remove(...names){names.forEach(n=>classes.delete(n))},
     toggle(name,value){if(value===undefined)value=!classes.has(name);value?classes.add(name):classes.delete(name);return !!value},
     contains(name){return classes.has(name)}
   },
   append(child){if(child.parentElement){const arr=child.parentElement.children;const i=arr.indexOf(child);if(i>=0)arr.splice(i,1)}this.children.push(child);child.parentElement=this},
   setAttribute(k,v){attributes.set(k,String(v))},
   getAttribute(k){return attributes.get(k)||null},
   addEventListener(k,fn){(this.events||(this.events={}))[k]=fn},
   querySelector(){return null},
   querySelectorAll(){return []},
   contains(t){return t===this},
   focus(){},
   click(){this.events?.click?.({target:this})}
 };
 return node;
}
function run(name,fn) {
 try{fn();console.log('PASS:',name)}
 catch(e){console.error('FAIL:',name,e.stack||e);process.exitCode=1}
}
run('Menu opens and closes using the ACTUAL app-core functions',()=>{
 const open=core.match(/function openMenu\(\)\{[^}]+\}/)?.[0];
 const close=core.match(/function closeMenu\(\)\{[^}]+\}/)?.[0];
 assert.ok(open&&close,'Actual menu functions not found');
 const map={drawer:element('drawer'),backdrop:element('backdrop'),menuBtn:element('menuBtn')};
 map.backdrop.hidden=true;
 const context={$:id=>map[id]};
 vm.runInNewContext(open+';'+close+';openMenu();',context);
 assert.equal(map.drawer.classList.contains('open'),true);
 assert.equal(map.drawer.getAttribute('aria-hidden'),'false');
 assert.equal(map.backdrop.hidden,false);
 assert.equal(map.menuBtn.getAttribute('aria-expanded'),'true');
 vm.runInNewContext(close+';closeMenu();',context);
 assert.equal(map.drawer.classList.contains('open'),false);
 assert.equal(map.drawer.getAttribute('aria-hidden'),'true');
 assert.equal(map.backdrop.hidden,true);
 assert.equal(map.menuBtn.getAttribute('aria-expanded'),'false');
 assert.match(core,/\$\('menuBtn'\)\.addEventListener\('click',openMenu\)/);
 assert.match(dashboard,/id="menuBtn"/);
 assert.match(dashboard,/id="drawer"/);
 assert.match(dashboard,/id="backdrop"/);
});
run('LIVE button moves into the kitchen slot and remains present',()=>{
 const start=bundled.indexOf('/* == assets/kitchen-v113.js == */');
 const end=bundled.indexOf('/* == assets/valmis-v134.js == */');
 assert.ok(start>=0 && end>start,'Original LIVE kitchen module not found');
 const moduleCode=bundled.slice(start,end);
 const map={};
 for(const id of ['ordersPage','pp111-live-slot','pp111-tools-panel','pp111-tools-toggle','pp111-tools-actions','pp111-tools-filters','toggleHistory','doneCount','compactMode','dataSourceLabel','pp111-source','newOrders','activeOrders','pp109-tab-new','pp109-tab-active'])map[id]=element(id);
 const live=element('live-button');
 const monitor=element('live-info');
 map.ordersPage.querySelector=selector=>selector==='.history-panel'?element('history-panel'):null;
 const original=element('dashboard-display-controls');
 original.append(live);original.append(monitor);
 const document={
   body:element('body'),
   getElementById:id=>map[id]||null,
   querySelector:sel=>sel==='.dashboard-display-controls button.secondary:not(#toggleOverview)'?live:sel==='.dashboard-display-controls .live-monitor'?monitor:null,
   createElement:()=>element('created'),
   addEventListener:()=>{}
 };
 const context={
   document,
   window:{},
   MutationObserver:class {observe(){}},
   requestAnimationFrame:fn=>fn(),
   setTimeout:()=>{},
   Event:class{},
 };
 vm.runInNewContext(moduleCode,context,{timeout:1000});
 assert.equal(live.parentElement,map['pp111-live-slot'],'LIVE button was not moved into visible slot');
 assert.equal(monitor.parentElement,map['pp111-live-slot'],'LIVE monitor was not moved');
 assert.equal(live.classList.contains('pp111-live-button'),true);
 assert.equal(map['pp111-live-slot'].children.includes(live),true);
 assert.equal(map['pp111-tools-panel'].hidden,true,'Tools panel should begin closed');
 assert.match(dashboard,/id="pp111-live-slot"/);
});
if(process.exitCode)process.exit(process.exitCode);
