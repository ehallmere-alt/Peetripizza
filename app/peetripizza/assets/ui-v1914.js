/* Peetri Pizza 18.14 — owner 24.11 21:56 "давай" (pack of six). Look only: texts, classes, icons. Nothing is sent anywhere. */
(function(){
 'use strict';
 if(window.PP1914)return;window.PP1914=1;
 const orderOf=id=>{try{if(typeof shownOrders==='function')return shownOrders().find(o=>String(o.id)===String(id))||null;}catch(_){}return null;};
 const ICON={
  bag:'<svg class="pp1914-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  car:'<svg class="pp1914-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16v-5l2-5h12l2 5v5"/><path d="M3 16h18M5 11h14"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/></svg>'
 };
 // 1 — order number: date small and grey, the day's number big ("#261122-" small + "5" big; same text)
 function numbers(){
  for(const el of document.querySelectorAll('#ordersPage :is(.order-number,.pp112-number), .pp155-station-order .pp178-who>strong')){
   const raw=el.dataset.pp1914||el.textContent.trim();
   const m=raw.match(/^(#?\d{6}-)(\d{1,5})$/);if(!m)continue;
   if(el.dataset.pp1914===raw&&el.querySelector('.pp1914-n'))continue;
   el.dataset.pp1914=raw;el.classList.add('pp1914-num');
   // textContent stays exactly the same ("#261122-5"): other scripts read the number from it
   el.innerHTML='<small>'+m[1]+'</small><b class="pp1914-n">'+m[2]+'</b>';
   el.title='Tellimus '+raw;
  }
 }
 // 2 — ready cards: line icons instead of 🛍 / 🚗 emoji (same icons as the cards in work)
 function icons(){
  for(const t of document.querySelectorAll('#ordersPage .pp112-done-card .pp1730-type:not([data-pp1914])')){
   const txt=t.textContent.trim();
   const kind=/KULLER/i.test(txt)?'car':(/KAASA/i.test(txt)?'bag':'');if(!kind)continue;
   t.dataset.pp1914='1';
   t.innerHTML=ICON[kind]+'<span>'+txt.replace(/^[^\p{L}]+/u,'')+'</span>';
  }
 }
 // 4 — Väljastus window: short wait text, phone only after tapping the name, "Kullerile antud" for courier orders
 function station(){
  for(const a of document.querySelectorAll('.pp155-station-order')){
   const age=a.querySelector('.pp155-age');
   if(age){const m=(age.textContent||'').match(/Ootab\s+(\d+)\s*min/i);if(m){const n=+m[1];const t=n>=120?'Ootab üle 2 h':(n>=60?'Ootab '+Math.floor(n/60)+' h '+(n%60)+' min':null);if(t&&age.textContent!==t)age.textContent=t;}}
   const ph=a.querySelector('.pp178-phone');
   if(ph){a.classList.add('pp1914-has-phone');if(!a.classList.contains('pp1914-show'))ph.hidden=true;}
   const btn=a.querySelector('[data-pp155-pickup]');const o=btn&&orderOf(btn.dataset.pp155Pickup);
   if(btn&&o&&o.serving==='delivery'&&/^✓\s*Üle antud$/.test(btn.textContent.trim()))btn.textContent='✓ Kullerile antud';
  }
 }
 window.addEventListener('click',e=>{
  const n=e.target instanceof Element&&e.target.closest('.pp155-station-order.pp1914-has-phone .pp178-name');if(!n)return;
  const a=n.closest('.pp155-station-order');const on=a.classList.toggle('pp1914-show');
  const ph=a.querySelector('.pp178-phone');if(ph)ph.hidden=!on;
 },true);
 let q=false;
 const run=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;for(const f of [numbers,icons,station]){try{f()}catch(_){}}});};
 new MutationObserver(run).observe(document.body||document.documentElement,{childList:true,subtree:true});
 setInterval(run,15000);run();
})();
