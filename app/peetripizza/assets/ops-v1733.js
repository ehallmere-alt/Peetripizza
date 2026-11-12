/* Peetri Pizza v17.33 — owner: nicer customer name. Adds a round initial in front of the name (screen only). */
(function(){
 'use strict';
 if(window.PP1733)return;
 function tick(){
  for(const n of document.querySelectorAll('#ordersPage .ordercard .pp92-customer:not([data-pp1733])')){
   n.dataset.pp1733='1';if(n.classList.contains('pp111-name-missing'))continue;
   const t=(n.textContent||'').trim();const ch=(t.match(/\p{L}/u)||[''])[0].toUpperCase();if(!ch)continue;
   const a=document.createElement('span');a.className='pp1733-ini';a.setAttribute('aria-hidden','true');a.textContent=ch;
   const w=document.createElement('span');w.className='pp1733-name';while(n.firstChild)w.append(n.firstChild);
   n.append(a,w);
  }
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(tick));
 setInterval(tick,1500);setTimeout(tick,200);
 window.PP1733={tick};
})();
