/* Peetri Pizza v17.46 — owner picked 1 and 4 (12.11.2026).
 * 1: "Ahju: 3× SÕ · 2× VÕ" in the "Valmistamisel" column head = pizzas by size code in all orders being made.
 * 4: icons in the "Lisaks" row: a cup for drinks, a dip bowl for sauces.
 * Screen only: data, LIVE, printing and buttons untouched. Off switch: <html class="pp1746-off">.
 */
(function(){
 'use strict';
 if(window.PP1746)return;
 const root=document.documentElement;
 const ORDER=['SÕ','SP','S','VÕ','VP','V','KÕ','KP','K','Pere Õ','Pere P','Pere'];
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}

 // 1
 function oven(byId){
  const head=document.querySelector('#ordersPage .pp1723-col-work .section-head');if(!head)return;
  const count=new Map();
  for(const card of document.querySelectorAll('#activeOrders .ordercard[data-order-id]')){
   const o=byId.get(card.dataset.orderId);if(!o)continue;
   for(const it of (Array.isArray(o.items)?o.items:[])){
    const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];let p=null;try{p=window.PPOrderInfo?.parse(raw)}catch(_){}
    if(!p||!(p.code||p.size))continue;
    const c=p.code||({large:'S',small:'V',family:'Pere',medium:'K'}[p.size]||'pitsa');
    count.set(c,(count.get(c)||0)+qty(q));
   }
  }
  const rank=c=>{const i=ORDER.indexOf(c);return i<0?99:i;};
  const parts=[...count].sort((a,b)=>rank(a[0])-rank(b[0]));
  let el=head.querySelector(':scope>.pp1746-oven');
  if(!parts.length){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.className='pp1746-oven';head.firstElementChild?head.firstElementChild.after(el):head.append(el);}
  const html='<b>Ahju</b>'+parts.map(([c,n])=>'<span><strong>'+n+'×</strong> '+c.replace(/[&<>]/g,'')+'</span>').join('');
  if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}
 }

 // 4
 const DRINK=/cola|pepsi|7\s*up|mirinda|fanta|sprite|vesi|water|mahl|juice|jäätee|lipton|red\s*bull|limonaad|õlu|kali|\(?\d+[.,]\d+\s*l\)?|\b0[.,]\d+l\b/i;
 const SAUCE=/kaste|dip|sauce|ketšup|ketchup|majonees|aioli|salsa/i;
 const CUP='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.4 13.2a1 1 0 0 1-1 .8H8.4a1 1 0 0 1-1-.8z"/><path d="M5 7h14"/><path d="M12 7l2-4h3"/></svg>';
 const DIP='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1.5-1.5 1.5-3M13 7c0-1.5 1.5-1.5 1.5-3"/></svg>';
 function icons(){
  for(const s of document.querySelectorAll('#ordersPage .pp1728-lisaks>span:not([data-pp1746])')){
   s.dataset.pp1746='1';
   const t=s.textContent||'';
   const k=SAUCE.test(t)?'dip':DRINK.test(t)?'cup':'';
   if(!k)continue;
   const i=document.createElement('i');i.className='pp1746-ic pp1746-'+k;i.innerHTML=k==='cup'?CUP:DIP;s.prepend(i);
  }
 }

 function tick(){
  if(root.classList.contains('pp1746-off'))return;
  const byId=new Map(orders().map(o=>[String(o.id),o]));
  try{oven(byId)}catch(_){}
  try{icons()}catch(_){}
  root.classList.add('pp1746-on');
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 window.addEventListener('pp145:orders',()=>setTimeout(later,80));
 try{const r=document.getElementById('ordersPage');if(r)new MutationObserver(later).observe(r,{childList:true,subtree:true});}catch(_){}
 setInterval(tick,5000);setTimeout(tick,300);setTimeout(tick,1200);
 window.PP1746={tick};
})();
