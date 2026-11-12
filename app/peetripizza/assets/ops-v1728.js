/* Peetri Pizza v17.28 — order cards clearer (owner: "Го все", all six).
 * 1: pizzas first; drinks, sauces and other non-pizza lines in one "Lisaks" line under them.
 * 2: timer as "Valmis 13:22" + "veel 17 min" (late: "HILJA 3 min" + "pidi 13:22"). The old timer is only hidden.
 * 3: summary chip "3 pitsat · 2 lisa" next to the order number.
 * 4: payment chip (MAKSTUD / SULARAHA / KAART) when the order has a payment value.
 * 5: modifiers marked + (add) or − (remove).
 * 6: the KARBID / KOHAPEAL row moves to the bottom, next to the Valmis button.
 * Cards are only re-arranged on screen; order data, printing and LIVE are untouched.
 */
(function(){
 'use strict';
 if(window.PP1728)return;
 const root=document.documentElement;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pad=n=>String(n).padStart(2,'0');
 const hm=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes());};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 function deadline(o){try{if(typeof orderDeadline==='function')return orderDeadline(o)}catch(_){}const d=Number(o.deadline);return d>0?d:(Number(o.created)||0)+(Number(o.minutes)||20)*60000;}
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 function isPizza(raw){try{const p=window.PPOrderInfo?.parse(raw);return !!(p&&(p.size||p.code));}catch(_){return false}}

 function payChip(p){
  const v=String(p||'').trim().toLowerCase();if(!v||v==='—'||v==='-')return null;
  if(/online|paid|makstud|stripe|montonio|bank|link|prepaid|internet/.test(v))return ['MAKSTUD','paid'];
  if(/cash|sula/.test(v))return ['SULARAHA','cash'];
  if(/card|kaart|terminal/.test(v))return ['KAART','card'];
  return [v.toUpperCase().slice(0,14),'card'];
 }

 function build(card,o){
  const items=Array.isArray(o.items)?o.items:[];
  const lines=[...card.querySelectorAll('.pp117-ticket-items>.product-line')];
  // 1 + 3
  let pz=0,other=0;const extra=[],sizes=new Map();
  if(lines.length===items.length){
   items.forEach((it,i)=>{const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];if(isPizza(raw)){pz+=qty(q);let c='pitsa';try{c=window.PPOrderInfo.parse(raw).code||'pitsa'}catch(_){}sizes.set(c,(sizes.get(c)||0)+qty(q));}else{other+=qty(q);extra.push(i);}});
   if(pz&&extra.length){
    const box=card.querySelector('.pp117-ticket-items');
    const row=document.createElement('div');row.className='pp1728-lisaks';
    row.innerHTML='<b>Lisaks</b>'+extra.map(i=>{const l=lines[i];l.classList.add('pp1728-moved');
     const n=l.querySelector('.product-name');const name=(n?.querySelector('.pp177-name')||n)?.textContent?.trim()||'';
     return '<span><strong>'+esc(l.querySelector('.product-qty')?.textContent?.trim()||'')+'</strong> '+esc(name)+'</span>';}).join('');
    box.append(row);
   }
  }
  const line=card.querySelector('.pp117-identity-line');
  if(line&&(pz||other)){
   const s=document.createElement('span');s.className='pp1728-sum';
   // v17.29: pizzas by size code ("2× SÕ · 1× VP"), then the other products
   s.textContent=[...[...sizes].map(([c,n])=>n+'× '+c),other?other+' lisa':''].filter(Boolean).join(' · ')||(pz?pz+' pitsa':'');
   const t=line.querySelector('.pp118-order-time');t?line.insertBefore(s,t):line.append(s);
  }
  // 4
  const pc=payChip(o.payment);
  if(line&&pc){const s=document.createElement('span');s.className='pp1728-pay pp1728-pay-'+pc[1];s.textContent=pc[0];const t=line.querySelector('.pp1728-sum');t?line.insertBefore(s,t):line.append(s);}
  // 5
  for(const m of card.querySelectorAll('.pp177-mod')){
   const t=(m.textContent||'').trim();
   if(/^(ilma|vähem|without|no\b|-)/i.test(t))m.classList.add('pp1728-minus');
   else if(/^(topelt|lisa|extra|äär|\+|juust$|[\p{L}-]*äär$)/iu.test(t)||/:\s*(juustuäär|extra|topelt)/i.test(t))m.classList.add('pp1728-plus');
  }
  for(const e of card.querySelectorAll('.pp177-extras em'))e.classList.add('pp1728-plus');
  // 6
  const foot=card.querySelector('.cardfoot');
  if(foot)for(const b of card.querySelectorAll(':scope>.pp177-boxes'))foot.before(b);
  // 2
  const meter=card.querySelector('.prep-meter');
  if(meter&&!meter.querySelector('.pp1728-due')){const d=document.createElement('div');d.className='pp1728-due';d.innerHTML='<i></i><b></b><small></small>';meter.prepend(d);}
 }

 function timers(byId){
  const now=Date.now();
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-pp1728]')){
   const o=byId.get(card.dataset.orderId);const d=card.querySelector('.pp1728-due');if(!o||!d)continue;
   const dl=deadline(o),min=Math.ceil((dl-now)/60000);
   const late=dl<now;
   const l=late?'HILJA':'VALMIS';const a=late?'+'+Math.max(1,Math.floor((now-dl)/60000))+' min':hm(dl);
   const b=late?'pidi '+hm(dl):(min<=1?'kohe':'veel '+min+' min');
   const [L,B,S]=d.children;if(L.textContent!==l)L.textContent=l;if(B.textContent!==a)B.textContent=a;if(S.textContent!==b)S.textContent=b;
  }
 }

 function tick(){
  if(root.classList.contains('pp1728-off'))return;
  const list=orders();const byId=new Map(list.map(o=>[String(o.id),o]));
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]:not([data-pp1728])')){
   const o=byId.get(card.dataset.orderId);if(!o)continue;
   card.dataset.pp1728='1';
   try{build(card,o)}catch(_){}
  }
  root.classList.add('pp1728-on');
  try{timers(byId)}catch(_){}
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(tick));
 setInterval(tick,5000);setTimeout(tick,150);

 window.PP1728={tick,payChip};
})();
