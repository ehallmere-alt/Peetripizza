/* Peetri Pizza v17.9 — new order visible without sound, urgent orders on top, 14:00 dough reminder.
 * Local only: nothing is sent to peetripizza.ee or to the dough supplier.
 */
(function(){
 'use strict';
 if(window.pp179Ops)return;window.pp179Ops=true;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v===null?f:v}catch(_){return f}};
 const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
 const play=k=>{try{return window.PPSound?.play?.(k)}catch(_){return false}};
 const tallinn=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const now=()=>{const p=Object.fromEntries(tallinn.formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,hm:`${p.hour}:${p.minute}`,min:Number(p.hour)*60+Number(p.minute)}};

 /* ---------- 1: new order you can see without sound ---------- */
 const alertBox=document.createElement('div');alertBox.id='pp179-new';alertBox.hidden=true;alertBox.setAttribute('role','alert');
 document.body.appendChild(alertBox);
 let known=null;const pending=new Map();
 function info(o){
  const raw=(window.pp153RawLiveOrders||[]).find(x=>x&&x.id===o.id)||o;
  const items=Array.isArray(o.items)?o.items:[];
  return {id:o.id,number:o.number,name:raw.customerName||'',count:items.reduce((n,i)=>n+(Number(i[1])||0),0)};
 }
 function paintAlert(){
  if(!pending.size){alertBox.hidden=true;document.body.classList.remove('pp179-flash');return;}
  const list=[...pending.values()];const first=list[0];
  alertBox.innerHTML='<div class="pp179-new-box"><span class="pp179-new-tag">UUS TELLIMUS'+(list.length>1?' · '+list.length:'')+'</span><strong>#'+esc(first.number)+'</strong>'+(first.name?'<b>'+esc(first.name)+'</b>':'')+(first.count?'<em>'+esc(first.count)+' toodet</em>':'')+(list.length>1?'<small>+ '+esc(list.slice(1).map(x=>'#'+x.number).join(', '))+'</small>':'')+'<button type="button">Selge</button></div>';
  alertBox.hidden=false;document.body.classList.add('pp179-flash');
 }
 alertBox.addEventListener('click',()=>{pending.clear();paintAlert();document.getElementById('newOrders')?.scrollIntoView({block:'start',behavior:'smooth'});});
 window.addEventListener('pp145:orders',()=>{
  const snap=window.pp145LatestSnapshot;const orders=Array.isArray(snap?.orders)?snap.orders:[];
  const ids=new Set(orders.map(o=>o.id));
  if(known===null||known.src!==snap?.source){known={src:snap?.source,ids};return;} // first data / DEMO<->LIVE switch: baseline only
  for(const o of orders)if(o.status==='new'&&!known.ids.has(o.id))pending.set(o.id,info(o));
  for(const id of [...pending.keys()]){const o=orders.find(x=>x.id===id);if(!o||o.status!=='new')pending.delete(id);} // accepted elsewhere
  known.ids=ids;paintAlert();
 });

 /* ---------- 3: urgent orders on top + one short signal ---------- */
 const URG_KEY='pp179-urgent-signalled';let signalled=new Set(read(URG_KEY,[]));
 function urgentPass(){
  for(const col of ['newOrders','activeOrders']){const box=$(col);if(!box)continue;
   const cards=[...box.querySelectorAll(':scope > .ordercard, :scope .ordercard')];
   for(const c of cards){const late=c.classList.contains('urgency-late'),soon=c.classList.contains('urgency-soon');
    c.classList.toggle('pp179-top',late||soon);
    const id=c.dataset.orderId;if(!id||!(late||soon))continue;
    const key=id+(late?':late':':soon');
    if(!signalled.has(key)){signalled.add(key);if(!document.hidden)play('urgent');c.classList.add('pp179-pulse');setTimeout(()=>c.classList.remove('pp179-pulse'),4000);}
   }}
  if(signalled.size>400)signalled=new Set([...signalled].slice(-200));save(URG_KEY,[...signalled]);
 }
 // Remember already-urgent orders at start so a reload does not beep for all of them.
 let mutQueued=false;const mo=new MutationObserver(()=>{if(mutQueued)return;mutQueued=true;queueMicrotask(()=>{mutQueued=false;markTop();});});
 function markTop(){document.querySelectorAll('#newOrders .ordercard,#activeOrders .ordercard').forEach(c=>c.classList.toggle('pp179-top',c.classList.contains('urgency-late')||c.classList.contains('urgency-soon')));}
 for(const col of ['newOrders','activeOrders'])if($(col))mo.observe($(col),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 setTimeout(()=>{document.querySelectorAll('.ordercard.urgency-late,.ordercard.urgency-soon').forEach(c=>{const id=c.dataset.orderId;if(id){signalled.add(id+':soon');if(c.classList.contains('urgency-late'))signalled.add(id+':late');}});setInterval(urgentPass,2000);urgentPass();},2500);

 /* ---------- 6 (replaced): dough reminder at 14:00, order closes 15:05 ---------- */
 const START=14*60,CLOSE=15*60+5;
 const bar=document.createElement('div');bar.id='pp179-dough';bar.hidden=true;bar.setAttribute('role','alert');document.body.appendChild(bar);
 let orderedCache={date:'',at:0,ordered:false};
 async function orderedToday(date){
  if(orderedCache.date===date&&orderedCache.ordered)return true;
  if(orderedCache.date===date&&Date.now()-orderedCache.at<120000)return orderedCache.ordered;
  try{const r=await fetch('api/dough.php',{credentials:'same-origin',cache:'no-store'});const j=await r.json();
   const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit'});
   const ok=r.ok&&j.ok&&Array.isArray(j.orders)&&j.orders.some(o=>o&&o.created_at&&fmt.format(new Date(o.created_at))===date&&o.status!=='Tühistatud');
   // v17.48: also counts dough already ordered today in the official Peetri Pizza panel (read-only)
   let site=false;if(!ok){try{const r2=await fetch('api/dough-site.php',{credentials:'same-origin',cache:'no-store'});const j2=await r2.json();site=!!(r2.ok&&j2.ok&&Array.isArray(j2.orders)&&j2.orders.length);}catch(_){}}
   orderedCache={date,at:Date.now(),ordered:!!(ok||site)};return !!(ok||site);
  }catch(_){return false}
 }
 async function doughCheck(){
  const t=now();const snoozeUntil=Number(read('pp179-dough-snooze',0))||0;
  if(t.min<START||t.min>=CLOSE||read('pp179-dough-done',null)===t.date||Date.now()<snoozeUntil){bar.hidden=true;return;}
  if(await orderedToday(t.date)){save('pp179-dough-done',t.date);bar.hidden=true;return;}
  const left=CLOSE-t.min;const urgent=left<=20;
  bar.className=urgent?'pp179-dough-urgent':'';
  bar.innerHTML='<div class="pp179-dough-box"><span class="pp179-dough-ico">🥖</span><div><strong>Telli tainas!</strong><small>Tellimine sulgub kell 15:05 · jäänud '+left+' min. Pärast seda ainult külmutatud tooted.</small></div><a class="pp179-dough-go" href="dough.php">Telli nüüd</a><button type="button" data-pp179="snooze">15 min pärast</button></div>';
  if(bar.hidden){bar.hidden=false;play(urgent?'urgent':'new');}
 }
 bar.addEventListener('click',e=>{const b=e.target.closest('[data-pp179]');if(!b)return;if(b.dataset.pp179==='snooze'){save('pp179-dough-snooze',Date.now()+15*60000);bar.hidden=true;}});
 window.pp179DoughCheck=doughCheck;
 const tick=()=>{if(!document.hidden)doughCheck();};
 setInterval(tick,60000);document.addEventListener('visibilitychange',tick);setTimeout(tick,3000);
})();
