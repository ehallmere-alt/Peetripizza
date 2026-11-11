/* Peetri Pizza 14.5 — strictly local view enhancements; no remote writes. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch(_){return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const prefKey='pp145-preferences';
const validText=new Set(['normal','large','xl']),validDensity=new Set(['normal','tight']);
let prefs=load(prefKey,{text:'normal',density:'normal',contrast:false,urgent:false,repeat:false});
if(!prefs||typeof prefs!=='object')prefs={};
prefs={text:validText.has(prefs.text)?prefs.text:'normal',density:validDensity.has(prefs.density)?prefs.density:'normal',contrast:!!prefs.contrast,urgent:!!prefs.urgent,repeat:!!prefs.repeat};
function applyPrefs(){
 document.documentElement.style.setProperty('--pp145-text-scale',({normal:1,large:1.12,xl:1.22})[prefs.text]);
 document.documentElement.style.setProperty('--pp145-gap',prefs.density==='tight'?'8px':'16px');
 document.body.classList.toggle('pp145-contrast',prefs.contrast);
 const controls={'pp145-text-scale':prefs.text,'pp145-density':prefs.density,'pp145-contrast':prefs.contrast,'pp145-urgent-enabled':prefs.urgent,'pp145-repeat-enabled':prefs.repeat};
 Object.keys(controls).forEach(id=>{const el=$(id);if(el){if(el.type==='checkbox')el.checked=controls[id];else el.value=controls[id]}});
}
applyPrefs();
['pp145-text-scale','pp145-density','pp145-contrast','pp145-urgent-enabled','pp145-repeat-enabled'].forEach(id=>{
 $(id)?.addEventListener('change',e=>{
  const key={'pp145-text-scale':'text','pp145-density':'density','pp145-contrast':'contrast','pp145-urgent-enabled':'urgent','pp145-repeat-enabled':'repeat'}[id];
  prefs[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;save(prefKey,prefs);applyPrefs();
 });
});
$('pp145-settings-reset')?.addEventListener('click',()=>{prefs={text:'normal',density:'normal',contrast:false,urgent:prefs.urgent,repeat:prefs.repeat};save(prefKey,prefs);applyPrefs()});
$('pp145-test-urgent')?.addEventListener('click',()=>window.PPSound?.preview('urgent'));
let currentOrders=[],currentSource='DEMO';
const identified=new Set(),urgentSignaled=new Set();
let baselineReady=false,lastReminder=0;
function pizzaName(raw){
 // Count only product names known to be pizzas; unknown products must not be mislabeled.
 const name=String(raw||'').replace(/\s*\((?:large|small)\).*/i,'').replace(/\s*[—–].*/,'').trim();
 if(/\b(pizza|pitsa)\b/i.test(name))return name;
 if(/^(pepperoni|margherita|margarita|hawaii|bolognese|topolino|bbq kana)(?:\s|$)/i.test(name))return name;
 return '';
}
function updateStats(){
 const done=currentOrders.filter(x=>x.status==='done');
 const counts=new Map();let pizzaTotal=0;
 done.forEach(o=>(o.items||[]).forEach(([raw,qty])=>{const name=pizzaName(raw);if(!name)return;const amount=Math.max(0,Math.min(1000,Number(qty)||0));pizzaTotal+=amount;counts.set(name,(counts.get(name)||0)+amount)}));
 const averageValues=done.filter(o=>Number.isFinite(o.created)&&o.created>0&&o.completed>=o.created).map(o=>(o.completed-o.created)/60000).filter(x=>x>=0&&x<1440);
 $('pp145-pizza-total').textContent=String(pizzaTotal);
 $('pp145-done-total').textContent=String(done.length);
 $('pp145-average-time').textContent=averageValues.length?`${Math.round(averageValues.reduce((a,b)=>a+b,0)/averageValues.length)} min`:'—';
 $('pp145-stats-source').textContent=currentSource==='LIVE'?'LIVE · LAADITUD':currentSource==='JSON'?'JSON · EELVAADE':'DEMO';
 const bins=new Array(24).fill(0);currentOrders.forEach(o=>{if(o.created>0&&Number.isFinite(o.created)){const d=new Date(o.created);if(!isNaN(d))bins[d.getHours()]++}});
 const values=bins.map((count,hour)=>({hour,count})).filter(({count})=>count>0);
 const hours=values.length?Array.from({length:Math.min(8,Math.max(3,values[values.length-1].hour-values[0].hour+1))},(_,i)=>values.length>8?values[Math.round(i*(values.length-1)/7)].hour:Math.max(0,values[0].hour+i)).filter((h,i,a)=>a.indexOf(h)===i):[];
 const max=Math.max(1,...bins);
 $('pp145-hourly').innerHTML=hours.length?hours.map(h=>`<div class="pp145-bar" title="${h}:00 · ${bins[h]} tellimust"><i style="height:${Math.max(3,Math.round(bins[h]/max*104))}px"></i><b>${h}:00</b></div>`).join(''):'<p class="help">Tellimuste ajad puuduvad.</p>';
 $('pp145-hourly').setAttribute('aria-label',`Tellimusi kokku ${currentOrders.length}; jaotus tundide järgi`);
 const ranked=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,5),maximum=ranked[0]?.[1]||1;
 $('pp145-top-pizzas').innerHTML=ranked.length?ranked.map(([name,num])=>{
  const text=name.replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[x]));
  return `<div class="pp145-rank-row"><span>${text}</span><strong>${num}×</strong><div class="pp145-rank-track"><i style="width:${Math.round(100*num/maximum)}%"></i></div></div>`;
 }).join(''):'<p class="help">Valmis pitsasid ei ole laaditud.</p>';
}
// Sound only for known outstanding new orders; never on initial data loading, and never on each poll.
function checkAlerts(){
 if(!baselineReady||!prefs.urgent||document.hidden)return;
 const now=Date.now();
 for(const o of currentOrders){
  if(o.status!=='new'||!identified.has(o.id))continue;
  const deadline=Number(o.deadline)>0?Number(o.deadline):(Number(o.created)||0)+(Number(o.minutes)||20)*60000;
  if(o.created>0&&now>=deadline-5*60000&&!urgentSignaled.has(o.id)){
   urgentSignaled.add(o.id);window.PPSound?.play('urgent');
  }
 }
}
window.addEventListener('pp145:orders',e=>{
 const d=e.detail||{};const next=Array.isArray(d.orders)?d.orders:[];
 if(d.source!==currentSource){currentSource=d.source;identified.clear();urgentSignaled.clear();baselineReady=false;lastReminder=0;}
 currentOrders=next;
 const liveIDs=new Set(next.filter(o=>o.status==='new').map(o=>o.id));
 for(const id of [...identified])if(!liveIDs.has(id))identified.delete(id);
 for(const id of [...urgentSignaled])if(!liveIDs.has(id))urgentSignaled.delete(id);
 if(!baselineReady){next.forEach(o=>{if(o.status==='new'){identified.add(o.id);urgentSignaled.add(o.id)}});baselineReady=true;lastReminder=Date.now();}
 else next.forEach(o=>{if(o.status==='new'&&!identified.has(o.id)){identified.add(o.id);/* new-order alert handled by existing LIVE system */}});
 updateStats();checkAlerts();
});
if(window.pp145LatestSnapshot){window.dispatchEvent(new CustomEvent('pp145:orders',{detail:window.pp145LatestSnapshot}));}
setInterval(()=>{
 if(!baselineReady||document.hidden)return;
 checkAlerts();
 if(!prefs.repeat||currentSource!=='LIVE')return;
 const pending=currentOrders.some(o=>o.status==='new');
 if(pending&&Date.now()-lastReminder>=120000){lastReminder=Date.now();window.PPSound?.play('new')}
 else if(!pending)lastReminder=0;
},15000);
})();
