/* Peetri Pizza v17.34 — owner: pizzas ordered several at a time go first, then big before small; phone next to the name.
 * Only moves elements that are already on the card; order data, printing and LIVE are untouched.
 */
(function(){
 'use strict';
 if(window.PP1734)return;
 const SIZE={family:0,large:1,medium:2,small:3};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 function sortCard(card,o){
  const box=card.querySelector('.pp117-ticket-items');if(!box)return;
  const lines=[...box.querySelectorAll(':scope>.product-line')];if(lines.length<2)return;
  const items=Array.isArray(o.items)?o.items:[];
  if(!lines.every(l=>l.dataset.pp1734i!==undefined)){
   if(lines.length!==items.length)return;
   lines.forEach((l,i)=>{l.dataset.pp1734i=String(i);});
  }
  const key=l=>{const it=items[Number(l.dataset.pp1734i)]||[];const raw=Array.isArray(it)?it[0]:it?.name;const q=qty(Array.isArray(it)?it[1]:it?.quantity);
   let p=null;try{p=window.PPOrderInfo?.parse(raw)}catch(_){}
   const pizza=!!(p&&(p.size||p.code));
   return [pizza?0:1,q>1?0:1,p&&p.size in SIZE?SIZE[p.size]:9,String(p?.name||raw||'').toLowerCase(),Number(l.dataset.pp1734i)];};
  const cmp=(a,b)=>{const x=key(a),y=key(b);for(let i=0;i<x.length;i++){if(x[i]<y[i])return -1;if(x[i]>y[i])return 1;}return 0;};
  const sorted=[...lines].sort(cmp);
  if(sorted.every((l,i)=>l===lines[i]))return;
  const anchor=lines[0].previousSibling;let ref=anchor?anchor.nextSibling:box.firstChild;
  for(const l of sorted){box.insertBefore(l,ref);ref=l.nextSibling;}
 }
 function phoneNext(card){
  const name=card.querySelector('.pp117-ticket-identity>.pp92-customer');const ph=card.querySelector('.pp117-identity-line .pp177-phone');
  if(!name||!ph)return;
  const row=document.createElement('div');row.className='pp1734-namerow';
  name.before(row);row.append(name,ph);
 }
 function tick(){
  const byId=new Map(orders().map(o=>[String(o.id),o]));
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const o=byId.get(card.dataset.orderId);
   if(o)try{sortCard(card,o)}catch(_){}
   try{phoneNext(card)}catch(_){}
  }
 }
 window.addEventListener('pp145:orders',()=>setTimeout(tick,0));
 setInterval(tick,1500);setTimeout(tick,250);
 window.PP1734={tick};
})();
