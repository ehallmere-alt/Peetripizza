/* Peetri Pizza v17.11
 *  A) "Klienti ootavad tellimused" on the home screen shows full ready cards (name, number, products, sum, Üle antud)
 *     instead of the 3 short rows. Cards are copies of the real #doneOrders cards; every button forwards to the original one.
 *  B) "↶ Tagasi" for 10 s after Võta vastu / Valmis (LIVE) and after Üle antud (LIVE and DEMO). Our server only.
 *  C) "Lõpeta vahetus": end-of-shift summary with 80 mm print. Read-only.
 * Nothing is sent to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.pp1711Ops)return;window.pp1711Ops=true;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const live=()=>document.body.classList.contains('live-active');
 const scopeKey=id=>(live()?'live:':'demo:')+id;
 const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
 const withConfirmYes=fn=>{const old=window.confirm;window.confirm=()=>true;try{return fn()}finally{window.confirm=old}};
 let pickupRecords={},pickupConnected=false;
 window.addEventListener('pp155:pickup-state',e=>{pickupRecords=e.detail?.records||{};pickupConnected=!!e.detail?.connected;});

 /* ---------- A: full cards in "Klienti ootavad tellimused" ---------- */
 const done=$('doneOrders');
 let wrap=null,lastSig='',queued=false;
 function waitingCards(){
  if(!done)return [];
  return [...done.querySelectorAll('.pp112-done-card')].filter(card=>{
   const id=card.dataset.orderId||'';
   if(live()?!/^live-[a-f0-9]{24}$/.test(id):!/^demo-[a-zA-Z0-9-]{1,80}$/.test(id))return false;
   return !pickupRecords[scopeKey(id)]?.handed_at;
  }).sort((a,b)=>{const x=Number(a.dataset.readyAt)||Number.MAX_SAFE_INTEGER,y=Number(b.dataset.readyAt)||Number.MAX_SAFE_INTEGER;return x-y;});
 }
 function ensureWrap(){
  if(wrap&&wrap.isConnected)return wrap;
  const rows=$('pp158-pickup-rows');if(!rows)return null;
  wrap=document.createElement('div');wrap.id='pp1711-pickup';wrap.className='pp1711-pickup';wrap.setAttribute('aria-live','polite');
  rows.insertAdjacentElement('afterend',wrap);document.body.classList.add('pp1711-cards');
  return wrap;
 }
 function renderCards(){
  queued=false;const box=ensureWrap();if(!box)return;
  const cards=waitingCards();
  const sig=cards.map(c=>c.outerHTML).join('')+'|'+pickupConnected;
  if(sig===lastSig&&box.childElementCount)return;lastSig=sig;
  if(!cards.length){box.innerHTML='<p class="pp1711-empty">'+(pickupConnected?'Kõik valmis tellimused on väljastatud.':'Valmis tellimusi pole.')+'</p>';return;}
  const frag=document.createDocumentFragment();
  for(const card of cards){
   const copy=card.cloneNode(true);
   copy.dataset.pp1711Id=card.dataset.orderId;copy.removeAttribute('data-order-id');copy.classList.add('pp1711-copy');
   copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
   const at=Number(card.dataset.readyAt);copy.classList.toggle('pp1711-late',at>0&&Date.now()-at>=15*60000);
   frag.appendChild(copy);
  }
  box.replaceChildren(frag);
 }
 const scheduleCards=()=>{if(queued)return;queued=true;requestAnimationFrame(renderCards);};
 if(done)new MutationObserver(scheduleCards).observe(done,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','class','data-ready-at']});
 window.addEventListener('pp155:pickup-state',scheduleCards);
 for(const ev of ['pp150:live-synced','pp150:live-stopped','pp145:orders'])window.addEventListener(ev,scheduleCards);
 setInterval(()=>{if(!document.hidden)scheduleCards();},15000);
 // Buttons in a copy press the same button of the real card (same position), so all existing logic stays in one place.
 window.addEventListener('click',e=>{
  const btn=e.target.closest?.('#pp1711-pickup .pp1711-copy button');if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();
  const copy=btn.closest('.pp1711-copy'),id=copy.dataset.pp1711Id;
  const real=done&&[...done.querySelectorAll('.pp112-done-card')].find(c=>c.dataset.orderId===id);
  if(!real)return;
  const i=[...copy.querySelectorAll('button')].indexOf(btn),target=real.querySelectorAll('button')[i];
  if(target&&!target.disabled&&target.className===btn.className){btn.disabled=true;target.click();}
 },true);

 /* ---------- B: undo for 10 seconds ---------- */
 const bar=document.createElement('div');bar.id='pp1711-undo';bar.hidden=true;bar.setAttribute('role','status');
 bar.innerHTML='<span id="pp1711-undo-text"></span><button type="button" id="pp1711-undo-btn">↶ Tagasi <b id="pp1711-undo-left">10</b></button>';
 document.body.appendChild(bar);
 let undo=null,tick=null;
 function hideUndo(){undo=null;clearInterval(tick);bar.hidden=true;}
 function offerUndo(label,run){
  clearInterval(tick);undo={run,until:Date.now()+10000};
  $('pp1711-undo-text').textContent=label;$('pp1711-undo-left').textContent='10';$('pp1711-undo-btn').disabled=false;bar.hidden=false;
  tick=setInterval(()=>{const left=Math.ceil((undo.until-Date.now())/1000);if(left<=0)return hideUndo();$('pp1711-undo-left').textContent=String(left);},250);
 }
 window.pp1711OfferUndo=offerUndo;
 $('pp1711-undo-btn').addEventListener('click',async()=>{
  if(!undo)return;const run=undo.run;$('pp1711-undo-btn').disabled=true;clearInterval(tick);
  try{await run();toast2('↶ Tagasi võetud');}catch(err){toast2('⚠ Tagasivõtmine ebaõnnestus: '+(err&&err.message||err));}
  hideUndo();
 });
 function toast2(m){try{if(typeof window.toast==='function')return window.toast(m);}catch(_){}
  const t=$('toast');if(t){t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);}}
 const numberOf=id=>{const o=(window.pp153RawLiveOrders||[]).find(x=>x&&x.id===id)||(window.pp145LatestSnapshot?.orders||[]).find(x=>x&&x.id===id);return o?.number?'#'+o.number:'Tellimus';};

 // LIVE Võta vastu / Valmis: the undo bar replaces the "Kas tellimus on valmis?" question.
 window.addEventListener('click',e=>{
  const b=e.target.closest?.('button[data-kitchen-action="done"]');if(!b||!live())return;
  const old=window.confirm;window.confirm=()=>true;setTimeout(()=>{window.confirm=old;},0);
 },true);
 let reverting=false;
 window.addEventListener('pp155:status-saved',e=>{
  const id=e.detail?.id,next=e.detail?.status;if(reverting||!id||!/^live-[a-f0-9]{24}$/.test(id))return;
  const back=next==='active'?'new':next==='done'?'active':null;if(!back)return;
  offerUndo(numberOf(id)+' → '+(next==='done'?'Valmis':'Valmistamisel'),async()=>{
   const raw=(window.pp153RawLiveOrders||[]).find(o=>o&&o.id===id);if(!raw)throw new Error('tellimust ei leitud');
   await window.PPKitchenStatus?.pull?.(false);
   reverting=true;
   try{
    const r=await fetch('api/kitchen-status.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-Token':csrf},
     body:JSON.stringify({id,status:back,official_status:raw.status,expected_revision:window.PPKitchenStatus?.revision?.(id)||0})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.ok)throw new Error(r.status===409?'teine töötaja muutis tellimust':(j.error||'HTTP '+r.status));
   }finally{reverting=false;await window.PPKitchenStatus?.pull?.(true);window.pp153UpdateKitchenUI?.();}
  });
 });
 // Üle antud (any button that hands over: card, home section, Väljastus window): offer undo once the server confirms.
 const handing=new Map();
 window.addEventListener('click',e=>{
  const b=e.target.closest?.('.pp154-handover,.pp158-handover,[data-pp155-pickup]');if(!b)return;
  let id=b.dataset.pp155Pickup||b.closest('[data-order-id]')?.dataset.orderId||b.closest('[data-pp1711-id]')?.dataset.pp1711Id||'';
  if(!id){const row=b.closest('.pp158-pickup-row');id=row?.dataset.orderId||'';}
  if(!id)return;const k=scopeKey(id);if(pickupRecords[k]?.handed_at)return; // that click was an undo, not a handover
  handing.set(k,{id,at:Date.now()});
 },true);
 window.addEventListener('pp155:pickup-state',()=>{
  for(const [k,v] of handing){
   if(Date.now()-v.at>20000){handing.delete(k);continue;}
   if(!pickupRecords[k]?.handed_at)continue;
   handing.delete(k);
   offerUndo(numberOf(v.id)+' → Üle antud',async()=>{
    const real=done&&[...done.querySelectorAll('.pp112-done-card')].find(c=>c.dataset.orderId===v.id);
    const btn=real?.querySelector('.pp154-handover');if(!btn||btn.disabled)throw new Error('nuppu ei leitud');
    withConfirmYes(()=>btn.click());
   });
  }
 });

 /* ---------- C: Lõpeta vahetus ---------- */
 const dlg=document.createElement('dialog');dlg.id='pp1711-shift';dlg.className='pp1711-shift';
 dlg.innerHTML='<div class="pp1711-shift-head"><div><small>PEETRI PIZZA · VAHETUSE KOKKUVÕTE</small><h2>🧾 Lõpeta vahetus</h2></div><button type="button" id="pp1711-shift-close" aria-label="Sulge">✕</button></div><div id="pp1711-shift-body" class="pp1711-shift-body"></div><div class="pp1711-shift-actions"><button type="button" id="pp1711-shift-print">⎙ Prindi 80 mm</button><button type="button" class="secondary" id="pp1711-shift-done">Sulge</button></div>';
 document.body.appendChild(dlg);
 $('pp1711-shift-close').addEventListener('click',()=>dlg.close());$('pp1711-shift-done').addEventListener('click',()=>dlg.close());
 const tzDay=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit'});
 const tzTime=new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit'});
 const tzDate=new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',day:'numeric',month:'long',year:'numeric'});
 const dayOf=t=>tzDay.format(new Date(t));
 const money=n=>new Intl.NumberFormat('et-EE',{style:'currency',currency:'EUR'}).format(n||0);
 const baseName=n=>String(n||'').split(/\s+[—–-]\s+/)[0].replace(/\s*\((small|large|family|väike|suur|pere)[^)]*\)/ig,'').trim().slice(0,60);
 let lastShift=null;
 async function shiftData(){
  const now=Date.now(),today=dayOf(now);
  const snap=window.pp145LatestSnapshot;const orders=(Array.isArray(snap?.orders)?snap.orders:[]).filter(o=>o&&o.created&&dayOf(o.created)===today);
  const src=live()||String(snap?.source||'').startsWith('LIVE')?'LIVE':'DEMO';
  const sum=orders.reduce((s,o)=>s+(Number(o.amount)||0),0);
  const doneN=orders.filter(o=>o.status==='done').length,open=orders.filter(o=>o.status!=='done').length;
  const late=orders.filter(o=>o.status==='done'&&o.completed&&o.deadline&&o.completed>o.deadline).length;
  let avg=null;
  if(src==='LIVE'){
   try{const r=await fetch('api/kitchen-history.php?limit=500',{credentials:'same-origin',cache:'no-store'});const j=await r.json();
    if(r.ok&&j.ok&&Array.isArray(j.events)){const acc=new Map(),fin=new Map();
     for(const ev of j.events){const t=Date.parse(ev.at);if(!t||dayOf(t)!==today)continue;
      if(ev.to==='active'&&ev.from==='new'&&(!acc.has(ev.order)||acc.get(ev.order)>t))acc.set(ev.order,t);
      if(ev.to==='done'&&(!fin.has(ev.order)||fin.get(ev.order)<t))fin.set(ev.order,t);}
     const spans=[];for(const [id,t] of fin){const a=acc.get(id);if(a&&t>a)spans.push(t-a);}
     if(spans.length)avg=Math.round(spans.reduce((s,x)=>s+x,0)/spans.length/60000);}}catch(_){}
  }
  const pre=src==='LIVE'?'live:':'demo:';let handed=0;const waits=[];
  for(const [k,r] of Object.entries(pickupRecords)){if(!k.startsWith(pre)||!r?.handed_at||dayOf(r.handed_at)!==today)continue;handed++;
   const w=(Date.parse(r.handed_at)-Date.parse(r.ready_at))/60000;if(Number.isFinite(w)&&w>=0&&w<600)waits.push(w);}
  const pickupAvg=waits.length?Math.round(waits.reduce((s,x)=>s+x,0)/waits.length):null;
  const boxes=new Map();let dine=0;const info=window.PPOrderInfo;
  if(info)for(const o of orders){const b=info.boxes(o);if(b===null){dine++;continue;}for(const [k,n] of b)boxes.set(k,(boxes.get(k)||0)+n);}
  const boxRows=info?info.boxOrder.filter(k=>boxes.has(k)).map(k=>[k,boxes.get(k)]):[];
  const top=new Map();for(const o of orders)for(const it of (Array.isArray(o.items)?o.items:[])){const n=baseName(it[0]);if(n)top.set(n,(top.get(n)||0)+(Number(it[1])||0));}
  const topRows=[...top.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
  const first=orders.reduce((m,o)=>Math.min(m,Number(o.created)||m),now);
  return {src,date:tzDate.format(new Date(now)),from:orders.length?tzTime.format(new Date(first)):'—',to:tzTime.format(new Date(now)),
   count:orders.length,sum,doneN,open,late,avg,handed,pickupAvg,boxRows,boxTotal:[...boxes.values()].reduce((a,b)=>a+b,0),dine,topRows,location:document.querySelector('.drawer-header strong')?.textContent||''};
 }
 function shiftHtml(d){
  const tile=(l,v,h)=>'<div class="pp1711-tile"><small>'+esc(l)+'</small><strong>'+esc(v)+'</strong>'+(h?'<span>'+esc(h)+'</span>':'')+'</div>';
  return '<p class="pp1711-shift-when">'+esc(d.date)+' · '+esc(d.from)+'–'+esc(d.to)+' · '+esc(d.src)+'</p>'+
   '<div class="pp1711-tiles">'+tile('Tellimusi',d.count,d.open?d.open+' veel pooleli':'kõik valmis')+tile('Tellimuste summa',money(d.sum),'')+
   tile('Valmis',d.doneN,d.late?d.late+' hilinenud':'hilinenuid pole')+tile('Keskmine valmimisaeg',d.avg==null?'—':d.avg+' min',d.src==='LIVE'?'Võta vastu → Valmis':'ainult LIVE')+
   tile('Üle antud',d.handed,'')+tile('Ootas leti ääres',d.pickupAvg==null?'—':d.pickupAvg+' min','keskmiselt')+'</div>'+
   '<h3>📦 Karbid · '+esc(d.boxTotal)+'</h3>'+(d.boxRows.length?'<div class="pp1711-list">'+d.boxRows.map(([k,n])=>'<div><span>'+esc(k)+'</span><b>'+esc(n)+'</b></div>').join('')+'</div>':'<p class="pp1711-none">Karpe ei läinud.</p>')+(d.dine?'<p class="pp1711-none">Kohapeal: '+esc(d.dine)+' tellimust</p>':'')+
   '<h3>🍕 Enim tellitud</h3>'+(d.topRows.length?'<div class="pp1711-list">'+d.topRows.map(([k,n])=>'<div><span>'+esc(k)+'</span><b>'+esc(n)+'×</b></div>').join('')+'</div>':'<p class="pp1711-none">Tellimusi pole.</p>');
 }
 async function openShift(){
  $('pp1711-shift-body').innerHTML='<p class="pp1711-none">Arvutan…</p>';if(!dlg.open)dlg.showModal();
  lastShift=await shiftData();$('pp1711-shift-body').innerHTML=shiftHtml(lastShift);
 }
 window.pp1711OpenShift=openShift;
 $('pp1711-shift-print').addEventListener('click',()=>{
  const d=lastShift;if(!d)return;
  const line=(l,v)=>'<div class="r"><span>'+esc(l)+'</span><b>'+esc(v)+'</b></div>';
  const page='<!doctype html><html lang="et"><head><meta charset="utf-8"><title>Vahetuse kokkuvõte</title><style>@page{size:80mm auto;margin:3mm}body{margin:0;font:13px/1.35 Arial,sans-serif;color:#000}main{max-width:74mm;margin:0 auto}h1{font-size:18px;text-align:center;margin:4px 0}p{text-align:center;margin:0 0 6px;font-size:12px}h2{font-size:14px;border-top:1.5px dashed #000;padding-top:5px;margin:8px 0 3px}.r{display:flex;justify-content:space-between;gap:6px}.r b{white-space:nowrap}</style></head><body><main>'+
   '<h1>VAHETUSE KOKKUVÕTE</h1><p>'+esc(d.date)+'<br>'+esc(d.from)+'–'+esc(d.to)+' · '+esc(d.src)+'</p>'+
   line('Tellimusi',d.count)+line('Tellimuste summa',money(d.sum))+line('Valmis',d.doneN)+line('Pooleli',d.open)+line('Hilinenud',d.late)+line('Keskm. valmimisaeg',d.avg==null?'—':d.avg+' min')+line('Üle antud',d.handed)+line('Ootas leti ääres',d.pickupAvg==null?'—':d.pickupAvg+' min')+
   '<h2>Karbid ('+esc(d.boxTotal)+')</h2>'+(d.boxRows.map(([k,n])=>line(k,n)).join('')||'<div>—</div>')+(d.dine?line('Kohapeal',d.dine):'')+
   '<h2>Enim tellitud</h2>'+(d.topRows.map(([k,n])=>line(k,n+'×')).join('')||'<div>—</div>')+'<p style="margin-top:10px">Prinditud '+esc(tzTime.format(new Date()))+'</p></main></body></html>';
  let w=null;try{w=window.open('','_blank','width=460,height=700');}catch(_){}
  if(!w){toast2('Brauser blokeeris printimise akna.');return;}
  w.document.open();w.document.write(page);w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(_){}},350);
 });
 function placeShiftButtons(){
  const stats=$('statisticsPage')?.querySelector('.panel');
  if(stats&&!$('pp1711-shift-open')){const b=document.createElement('button');b.type='button';b.id='pp1711-shift-open';b.className='pp1711-shift-open';b.textContent='🧾 Lõpeta vahetus';
   const h=stats.querySelector('h2');(h||stats).insertAdjacentElement(h?'afterend':'afterbegin',b);b.addEventListener('click',openShift);}
  const nav=document.querySelector('#drawer nav');
  if(nav&&!$('pp1711-shift-nav')){const b=document.createElement('button');b.type='button';b.id='pp1711-shift-nav';b.className='navitem';b.innerHTML='<span>🧾</span> Lõpeta vahetus';
   nav.appendChild(b);b.addEventListener('click',()=>{$('closeDrawer')?.click();openShift();});}
 }

 function start(){ensureWrap();scheduleCards();placeShiftButtons();}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
