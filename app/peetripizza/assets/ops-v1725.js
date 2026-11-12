/* Peetri Pizza v17.25 — design pack 4, owner picked 1, 2, 4, 5, 6 ("все кроме 3").
 * 1: Uued counter in the header pulses orange while a new order waits (CSS only).
 * 2: a new order card slides in and glows orange for 10 s.
 * 4: order details sheet looks like the card: name, number, type and the products big on top,
 *    office data small below, big Prindi + Võta vastu / Valmis buttons at the bottom.
 * 5: Tooted: category tabs and search stuck under the header, the big counters and duplicate quick chips hidden.
 * 6: one set of line icons instead of emoji (emoji look different on every Android).
 * Nothing here talks to the server or to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1725)return;
 const $=id=>document.getElementById(id);
 const root=document.documentElement;

 /* 6: icons */
 const P={
  car:'<path d="M4 16v-5l2-5h12l2 5v5"/><path d="M3 16h18M5 11h14"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  bag:'<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  dine:'<path d="M7 3v18M5 3v5a2 2 0 0 0 4 0V3"/><path d="M17 21V3c-2 1-3 4-3 8h3"/>',
  box:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  flag:'<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  warn:'<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  pizza:'<path d="M3 21 11 2c4.8 1.4 8.2 4.8 10 9.5L3 21Z"/><circle cx="11" cy="12" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M7 17h4"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  bread:'<path d="M5 19c-2.5-2.5 0-7 4-11s8.5-6.5 11-4-0 7-4 11-8.5 6.5-11 4z"/><path d="m9 10 2 2m1-5 2 2m-8 4 2 2"/>',
  receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'
 };
 const MAP={'🚗':'car','🛵':'car','🛍':'bag','🍽':'dine','📦':'box','⚑':'flag','🚩':'flag','⚠':'warn','🍕':'pizza','🥖':'bread','🧾':'receipt'};
 const RE=new RegExp('('+Object.keys(MAP).join('|')+')\\uFE0F?\\s?','gu');
 const svg=k=>'<svg class="pp1725-i pp1725-i-'+k+'" viewBox="0 0 24 24" aria-hidden="true">'+P[k]+'</svg>';
 const ROOTS='#ordersPage .ordercard,#statisticsPage .pp1719-service,.pp1723-empty,.pp179-dough-box,#orderDialog,#pp1711-shift .pp1711-shift-head,#pp1714-print-dialog';
 function iconize(el){
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>{RE.lastIndex=0;return RE.test(n.nodeValue)&&!n.parentElement?.closest('.prep-label,script,style,textarea,input,svg')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
  const list=[];let n;while((n=w.nextNode()))list.push(n);
  for(const t of list){
   const html=t.nodeValue.split(RE);const frag=document.createDocumentFragment();
   html.forEach((part,i)=>{
    if(i%2===1){const s=document.createElement('span');s.className='pp1725-ic';s.innerHTML=svg(MAP[part]);frag.append(s);}
    else if(part)frag.append(document.createTextNode(part));
   });
   t.replaceWith(frag);
  }
 }
 function icons(){if(root.classList.contains('pp1725-emoji'))return;for(const el of document.querySelectorAll(ROOTS)){try{iconize(el)}catch(_){}}}

 /* 2: new order glows for 10 s */
 const seen=new Set(),fresh=new Map(),boot=Date.now()+8000;
 function freshTick(){
  const now=Date.now(),add=[];
  for(const c of document.querySelectorAll('#newOrders .ordercard[data-order-id]')){
   const id=c.dataset.orderId;if(!seen.has(id)){seen.add(id);add.push(id);}
  }
  // no glow while the page or LIVE is loading (many cards at once)
  if(now>boot&&add.length<=3)for(const id of add)fresh.set(id,now+10000);
  for(const c of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const until=fresh.get(c.dataset.orderId),on=!!until&&until>now&&c.closest('#newOrders');
   if(c.classList.contains('pp1725-fresh')!==!!on)c.classList.toggle('pp1725-fresh',!!on);
  }
  for(const [id,u] of fresh)if(u<=now)fresh.delete(id);
  if(seen.size>500)seen.clear();
 }

 function tick(){try{freshTick()}catch(_){}try{icons()}catch(_){}}
 window.addEventListener('pp145:orders',()=>queueMicrotask(tick));
 setInterval(tick,1000);setTimeout(tick,200);

 /* 4: order details like a card */
 window.addEventListener('pp168:details-opened',e=>{
  const id=String(e.detail?.id||'');const body=$('detailBody'),dlg=$('orderDialog');if(!body||!dlg)return;
  dlg.classList.add('pp1725-details');
  dlg.querySelector('.pp1725-dfoot')?.remove();body.querySelector('.pp1725-dhead')?.remove();
  const card=id?document.querySelector('#ordersPage .ordercard[data-order-id="'+CSS.escape(id)+'"]'):null;
  dlg.classList.toggle('pp1725-has-card',!!card);
  if(!card)return;
  const head=document.createElement('div');head.className='pp1725-dhead';
  const top=card.querySelector('.pp117-ticket-identity');const boxes=card.querySelectorAll('.pp177-boxes,.pp177-dinein');const items=card.querySelector('.pp117-ticket-items');
  if(top)head.append(top.cloneNode(true));
  for(const b of boxes)if(!b.closest('.pp117-ticket-identity'))head.append(b.cloneNode(true));
  if(items){const it=items.cloneNode(true);it.classList.add('pp1725-ditems');head.append(it);}
  head.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
  head.querySelectorAll('button').forEach(x=>x.remove());
  body.prepend(head);
  // bottom bar: print (the existing button is moved visually by CSS) + the card's own action button
  const act=card.querySelector('.cardfoot button[data-action="accept"],.cardfoot button[data-action="done"],.cardfoot button[data-kitchen-action]');
  const foot=document.createElement('div');foot.className='pp1725-dfoot';
  const pr=document.createElement('button');pr.type='button';pr.className='pp1725-dprint';pr.textContent='Prindi';
  pr.addEventListener('click',()=>$('pp168-print-order')?.click());
  foot.append(pr);
  if(act&&!act.disabled){
   const b=document.createElement('button');b.type='button';
   const accept=(act.dataset.kitchenAction||act.dataset.action)==='accept'||(act.dataset.kitchenAction==='active');
   b.className='pp1725-dact '+(accept?'accept':'done');b.textContent=accept?'Alusta valmistamist':'✓ Valmis';
   b.addEventListener('click',()=>{try{dlg.close()}catch(_){};const again=document.querySelector('#ordersPage .ordercard[data-order-id="'+CSS.escape(id)+'"] .cardfoot '+(act.dataset.kitchenAction?'button[data-kitchen-action]':'button[data-action="'+act.dataset.action+'"]'));(again||act).click();});
   foot.append(b);
  }
  dlg.querySelector('.modalbody')?.append(foot);
  try{icons()}catch(_){}
 });

 /* 5: Tooted — show how many are out on the "Otsas" filter */
 function outCount(){
  const n=$('pp140-out')?.textContent?.trim();const tabs=$('pp140-status-tabs');if(!tabs)return;
  const b=[...tabs.querySelectorAll('button')].find(x=>/otsas/i.test(x.textContent));if(!b)return;
  let s=b.querySelector('.pp1725-n');if(!s){s=document.createElement('b');s.className='pp1725-n';b.append(s);}
  const v=n&&n!=='0'?n:'';if(s.textContent!==v)s.textContent=v;s.hidden=!v;
 }
 setInterval(outCount,2000);setTimeout(outCount,500);

 /* 6: sound button icon follows aria-pressed (CSS) */
 window.PP1725={icons,freshTick,outCount};
})();
