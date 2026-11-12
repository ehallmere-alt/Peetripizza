/* Peetri Pizza v17.29 — order card, pack 2 (owner: "Давай", all six). Screen only, data untouched.
 * 1: summary by size ("2× SÕ · 1× VP") — in ops-v1728.js.
 * 2: print mark on the card: "⎙ prinditud 13:05" / "⎙ ei prinditud" (from the shared print log, PPPrintMonitor).
 * 3: tap on the customer name folds the card to its header + button; tap again unfolds. Remembered per order on this tablet until reload.
 * 4: pre-order: when the official ready time is 90+ min after the order came in, a line "ETTETELLIMUS · 18:30" on top.
 * 5: simpler bottom: price and ⓘ small, the action button takes the rest of the width (CSS).
 * 6: the "Kas valmis?" sheet lists what is easy to forget: drinks, sauces, boxes.
 */
(function(){
 'use strict';
 if(window.PP1729)return;
 const pad=n=>String(n).padStart(2,'0');
 const hm=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes());};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 const byId=id=>orders().find(o=>String(o.id)===String(id));
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 const PRE=90*60000;

 /* 3: folded cards */
 const folded=new Set();
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  const n=t.closest('#ordersPage .ordercard .pp92-customer');if(!n)return;
  const card=n.closest('.ordercard[data-order-id]');if(!card)return;
  e.preventDefault();e.stopPropagation();
  const id=card.dataset.orderId,on=!folded.has(id);
  on?folded.add(id):folded.delete(id);card.classList.toggle('pp1729-folded',on);
 },true);

 function tick(){
  const list=orders(),map=new Map(list.map(o=>[String(o.id),o]));
  const pm=window.PPPrintMonitor;
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const id=card.dataset.orderId,o=map.get(id);if(!o)continue;
   if(card.classList.contains('pp1729-folded')!==folded.has(id))card.classList.toggle('pp1729-folded',folded.has(id));
   // 4
   const dl=Number(o.deadline),cr=Number(o.created);
   const pre=o.deadlineSource==='official'&&dl>0&&cr>0&&dl-cr>=PRE&&o.status!=='done';
   let p=card.querySelector(':scope>.pp1729-pre');
   if(pre&&!p){p=document.createElement('div');p.className='pp1729-pre';card.prepend(p);}
   if(p){if(!pre)p.remove();else{const tx='ETTETELLIMUS · '+hm(dl);if(p.textContent!==tx)p.textContent=tx;}}
   // 2
   if(pm&&typeof pm.record==='function'){
    const foot=card.querySelector('.cardfoot');if(!foot)continue;
    let m=foot.querySelector('.pp1729-print');
    if(!m){m=document.createElement('span');m.className='pp1729-print';const price=foot.querySelector('.price');price?price.after(m):foot.prepend(m);}
    let r=null;try{r=pm.record(id)}catch(_){}
    const done=!!(r&&r.count>0);const tx=done?'⎙ prinditud '+(r.last_at?hm(r.last_at):''):'⎙ ei prinditud';
    if(m.textContent!==tx){m.textContent=tx;m.classList.toggle('is-done',done);}
   }
  }
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(()=>{try{tick()}catch(_){}}));
 setInterval(()=>{try{tick()}catch(_){}},4000);setTimeout(tick,400);

 /* 6: reminder inside the Valmis sheet (17.24) */
 let doneId=null,doneAt=0;
 window.addEventListener('click',e=>{
  const b=e.target instanceof Element&&e.target.closest('#ordersPage .ordercard button[data-action="done"],#ordersPage .ordercard button[data-kitchen-action="done"]');
  if(b){doneId=b.closest('.ordercard')?.dataset.orderId||b.dataset.id||null;doneAt=Date.now();}
 },true);
 function remind(o){
  const parts=[];
  for(const it of (Array.isArray(o.items)?o.items:[])){
   const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];let p=null;try{p=window.PPOrderInfo?.parse(raw)}catch(_){}
   if(p&&(p.size||p.code))continue;
   parts.push(qty(q)+'× '+String((p&&p.name)||raw||'').split(' — ')[0]);
  }
  let boxes=null;try{boxes=window.PPOrderInfo?.boxes(o)}catch(_){}
  if(Array.isArray(boxes))for(const [k,n] of boxes)parts.push(n+' karp '+k);
  return parts;
 }
 new MutationObserver(ms=>{
  for(const m of ms)for(const n of m.addedNodes){
   if(!(n instanceof Element)||!n.classList.contains('pp1724-sheet-wrap'))continue;
   if(!doneId||Date.now()-doneAt>1500)continue;
   const o=byId(doneId);if(!o)continue;const list=remind(o);if(!list.length)continue;
   const box=document.createElement('div');box.className='pp1729-forget';
   box.innerHTML='<b>Ära unusta</b>'+list.map(x=>'<span>'+esc(x)+'</span>').join('');
   n.querySelector('.pp1724-sheet-btns')?.before(box);
  }
 }).observe(document.body,{childList:true});

 window.PP1729={tick,folded};
})();
