/* Peetri Pizza v17.47 — owner picked 1, 2, 3, 4 (12.11.2026).
 * 1: "Valmis" on a card is one tap: no "Kas on valmis?" sheet. Undo stays: LIVE has the 10 s "↶ Tagasi" bar (ops-v1711),
 *    DEMO its own undo bar (app-core). Same trick as ops-v1711 used for LIVE since 17.11: confirm() answers yes for this one click.
 * 2: "Ära unusta" (drinks, sauces, boxes) is now a big panel at the bottom for 10 s after Valmis, with icons. Tap closes it.
 * 3: "Ootel: 2× SÕ · 1× VP" in the "Uued" head (folded pre-orders not counted).
 * 4: a new order has a calm green frame for its first 3 minutes. Nothing blinks.
 * Screen only; order data and LIVE untouched. Off switch: <html class="pp1747-off">.
 */
(function(){
 'use strict';
 if(window.PP1747)return;
 const root=document.documentElement;
 const off=()=>root.classList.contains('pp1747-off');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 const byIdNow=id=>orders().find(o=>String(o.id)===String(id));
 const parse=raw=>{try{return window.PPOrderInfo?.parse(raw)||null}catch(_){return null}};
 const DONE='#ordersPage .ordercard button[data-action="done"],#ordersPage .ordercard button[data-kitchen-action="done"]';

 // 1 + 2
 const DRINK=/cola|pepsi|7\s*up|mirinda|fanta|sprite|vesi|water|mahl|juice|jäätee|lipton|red\s*bull|limonaad|õlu|kali|\d+[.,]\d+\s*l\b/i;
 const SAUCE=/kaste|dip|sauce|ketšup|ketchup|majonees|aioli|salsa/i;
 const IC={
  cup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.4 13.2a1 1 0 0 1-1 .8H8.4a1 1 0 0 1-1-.8z"/><path d="M5 7h14"/><path d="M12 7l2-4h3"/></svg>',
  dip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1.5-1.5 1.5-3M13 7c0-1.5 1.5-1.5 1.5-3"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
  other:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/></svg>'
 };
 function forgetList(o){
  const out=[];
  for(const it of (Array.isArray(o.items)?o.items:[])){
   const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];const p=parse(raw);
   if(p&&(p.size||p.code))continue;
   const name=String((p&&p.name)||raw||'').split(' — ')[0].trim();if(!name)continue;
   out.push([SAUCE.test(name)?'dip':DRINK.test(name)?'cup':'other',qty(q)+'× '+name]);
  }
  let boxes=null;try{boxes=window.PPOrderInfo?.boxes(o)}catch(_){}
  if(Array.isArray(boxes)&&boxes.length)out.push(['box',boxes.map(([k,n])=>n+'× '+k).join(' · ')]);
  return out;
 }
 const panel=document.createElement('div');panel.id='pp1747-forget';panel.hidden=true;panel.setAttribute('role','status');
 document.body.append(panel);
 let hideT=0;
 function hidePanel(){clearTimeout(hideT);panel.hidden=true;}
 function showForget(o){
  const list=forgetList(o);if(!list.length)return;
  panel.innerHTML='<div class="pp1747-fh"><b>ÄRA UNUSTA</b><span>#'+esc(o.number||'')+'</span><i aria-hidden="true">✕</i></div><div class="pp1747-fl">'+
   list.map(([k,t])=>'<span class="pp1747-f-'+k+'"><em>'+IC[k]+'</em>'+esc(t)+'</span>').join('')+'</div>';
  panel.hidden=false;clearTimeout(hideT);hideT=setTimeout(hidePanel,10000);
 }
 panel.addEventListener('click',hidePanel);
 window.addEventListener('click',e=>{
  if(off())return;
  const b=e.target instanceof Element&&e.target.closest(DONE);if(!b||b.disabled)return;
  const id=b.closest('.ordercard')?.dataset.orderId||b.dataset.id;const o=id&&byIdNow(id);
  // one tap: this click's confirm() says yes, then the previous confirm() is back.
  // ops-v1711 does the same for LIVE in an earlier listener, so restore only our own stand-in.
  const prev=window.confirm,yes=()=>true;window.confirm=yes;setTimeout(()=>{if(window.confirm===yes)window.confirm=prev;},0);
  if(o&&o.status!=='done')showForget(o);
 },true);

 // 3
 const ORDER=['SÕ','SP','S','VÕ','VP','V','KÕ','KP','K','Pere Õ','Pere P','Pere'];
 function waiting(byId){
  const head=document.querySelector('#ordersPage .pp1723-col-new .section-head');if(!head)return;
  const count=new Map();
  for(const card of document.querySelectorAll('#newOrders .ordercard[data-order-id]:not(.pp1745-fold)')){
   const o=byId.get(card.dataset.orderId);if(!o)continue;
   for(const it of (Array.isArray(o.items)?o.items:[])){
    const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];const p=parse(raw);
    if(!p||!(p.code||p.size))continue;
    const c=p.code||({large:'S',small:'V',family:'Pere',medium:'K'}[p.size]||'pitsa');
    count.set(c,(count.get(c)||0)+qty(q));
   }
  }
  const rank=c=>{const i=ORDER.indexOf(c);return i<0?99:i;};
  const parts=[...count].sort((a,b)=>rank(a[0])-rank(b[0]));
  let el=head.querySelector(':scope>.pp1747-wait');
  if(!parts.length){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.className='pp1746-oven pp1747-wait';head.firstElementChild?head.firstElementChild.after(el):head.append(el);}
  const html='<b>Ootel</b>'+parts.map(([c,n])=>'<span><strong>'+n+'×</strong> '+esc(c)+'</span>').join('');
  if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}
 }

 // 4
 function fresh(byId,now){
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const o=byId.get(card.dataset.orderId);
   const c=o&&Number(o.created);
   const on=!!(o&&o.status==='new'&&c>0&&now-c>=0&&now-c<3*60000&&card.closest('#newOrders'));
   if(card.classList.contains('pp1747-fresh')!==on)card.classList.toggle('pp1747-fresh',on);
  }
 }

 function tick(){
  if(off()){document.querySelectorAll('.pp1747-wait').forEach(e=>e.remove());return;}
  const now=Date.now();const byId=new Map(orders().map(o=>[String(o.id),o]));
  try{waiting(byId)}catch(_){}
  try{fresh(byId,now)}catch(_){}
  root.classList.add('pp1747-on');
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 window.addEventListener('pp145:orders',()=>setTimeout(later,80));
 try{const r=document.getElementById('ordersPage');if(r)new MutationObserver(later).observe(r,{childList:true,subtree:true});}catch(_){}
 setInterval(tick,5000);setTimeout(tick,300);setTimeout(tick,1200);
 window.PP1747={tick,showForget,hidePanel};
})();
