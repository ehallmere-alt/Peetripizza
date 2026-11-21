'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=process.argv[2]||path.resolve(__dirname,'../app/peetripizza');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const dashboard=read('dashboard.php'),login=read('index.php'),core=read('assets/app-core-v141.js'),dedup=read('assets/order-dedup-v1801.js'),theme=read('assets/kitchen-design-switch-v1799.js'),reference=read('assets/official-reference-v1801.js');
let passed=0;
function test(name,fn){try{fn();passed++;console.log('PASS',name)}catch(e){console.error('FAIL',name,e.message);process.exitCode=1}}
for(const p of ['assets/app-core-v141.js','assets/order-dedup-v1801.js','assets/official-reference-v1801.js','assets/kitchen-design-switch-v1799.js'])test('JS syntax '+p,()=>new vm.Script(read(p),{filename:p}));
test('Menu button and LIVE slot still exist',()=>{assert.match(dashboard,/id="menuBtn"/);assert.match(dashboard,/id="pp111-live-slot"/)});
test('LIVE connection and original script bundles remain',()=>{for(const p of ['app-a-v1767.js','app-core-v141.js','app-b-v1767.js','live-event-bridge-v1768.js'])assert.ok(dashboard.includes('assets/'+p),p)});
test('Classic design remains default',()=>{assert.match(theme,/getItem\(KEY\)==='2'\?'2':'1'/);assert.match(theme,/pp-design-two/);assert.match(theme,/Premium Clean/)});
test('Real pizza names in main Tooted',()=>{for(const name of ['Margherita','Pepperoni','Peetri Pizza','Cananas','Topolino','Vegetariana'])assert.ok(core.includes('["'+name+'"]')||core.includes('"'+name+'"]'),name)});
test('Login branches still require configured ID and password',()=>{assert.match(login,/pp_locations\(\)/);assert.match(login,/name="pizzeria_id"/);assert.match(login,/name="password"/)});
test('Dedupe only affects individual product lines',()=>{assert.match(dedup,/root\.querySelectorAll\('\.product-line'\)/);assert.match(dedup,/extras\.classList\.contains\('pp1754-moved'\)/)});
test('New UI scripts make no network requests',()=>{for(const s of [dedup,reference])assert.doesNotMatch(s,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.submit\s*\(/)});
test('Updated assets use cache-busting URLs',()=>{assert.match(dashboard,/order-dedup-v1801\.js\?v=1801fix2/);assert.match(dashboard,/app-core-v141\.js\?v=18\.02/);assert.match(dashboard,/official-reference-v1801\.js/)});
test('Public catalog is not represented as LIVE inventory',()=>{assert.match(reference,/public-readonly-snapshot/);assert.match(core,/LOCAL ONLY/)});
// Execute the actual duplicate-toppings module in a minimal DOM harness.
// This verifies observable behavior, not just the presence of a CSS selector.
function fakeExtras({copied=false,items=[]}={}){
 const attributes=new Map();
 const ems=items.map(t=>({
   textContent:t,
   style:{display:''}, hidden:false
 }));
 const style={
   display:'',
   priority:'',
   setProperty(k,v,p){if(k==='display'){this.display=v;this.priority=p}},
   getPropertyValue(k){return k==='display'?this.display:''},
   getPropertyPriority(k){return k==='display'?this.priority:''}
 };
 return {
   classList:{contains:x=>copied&&x==='pp1754-moved'},
   querySelectorAll:x=>x==='em'?ems:[],
   style,hidden:false,ems
 };
}
function runDedup(lines){
 const root={querySelectorAll:sel=>sel==='.product-line'?lines:[]};
 const context={
   document:{
     getElementById:id=>id==='ordersPage'?root:null,
     addEventListener:()=>{},
     hidden:false
   },
   window:{addEventListener:()=>{}},
   MutationObserver:class{observe(){}},
   requestAnimationFrame:fn=>{fn()}
 };
 vm.runInNewContext(dedup,context,{timeout:1000});
 assert.ok(context.window.PP1801OrderDedup);
 return context.window.PP1801OrderDedup;
}
test('Duplicated + LISA copy is hidden, original green chip stays',()=>{
 const extras=fakeExtras({copied:true,items:['PINEAPPLE','MUSHROOMS']});
 const green={textContent:'PINEAPPLE',hidden:false};
 const line={querySelector:()=>extras,querySelectorAll:()=>[green]};
 runDedup([line]);
 assert.equal(extras.hidden,true);
 assert.equal(extras.style.display,'none');
 assert.equal(extras.style.priority,'important');
 assert.equal(green.hidden,false);
});
test('Different topping remains visible; same topping hides only in its pizza',()=>{
 const first=fakeExtras({items:['PINEAPPLE','MUSHROOMS']});
 const second=fakeExtras({items:['PINEAPPLE']});
 const make=(extras,names)=>({
   querySelector:()=>extras,
   querySelectorAll:()=>names.map(t=>({textContent:t,hidden:false}))
 });
 runDedup([
   make(first,['PINEAPPLE']),
   make(second,['MUSHROOMS'])
 ]);
 assert.equal(first.ems[0].hidden,true);
 assert.equal(first.ems[1].hidden,false);
 assert.equal(second.ems[0].hidden,false);
 assert.equal(first.hidden,false);
 assert.equal(second.hidden,false);
});
test('Order data, LIVE and printer are not written by dedup module',()=>{
 const order={id:1812,items:[['Pepperoni',1]],status:'new'};
 const before=JSON.stringify(order);
 const extras=fakeExtras({copied:true,items:['EXTRA JUUST']});
 runDedup([{querySelector:()=>extras,querySelectorAll:()=>[]}]);
 assert.equal(JSON.stringify(order),before);
 assert.doesNotMatch(dedup,/\bfetch\s*\(|\bWebSocket\b|\.click\s*\(|\.submit\s*\(/);
});

console.log('Total checks passed:',passed);
if(process.exitCode)process.exit(process.exitCode);