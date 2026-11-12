/* Peetri Pizza v17.36 — owner: a phone handset in front of the name (where the round letter was); tap = call, number stays visible next to the name. */
(function(){
 'use strict';
 if(window.PP1736)return;
 const SVG='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
 function tick(){
  for(const ph of document.querySelectorAll('#ordersPage .ordercard .pp1734-namerow>a.pp177-phone:not([data-pp1736])')){
   ph.dataset.pp1736='1';
   const num=(ph.textContent||'').replace(/[^0-9+ -]/g,'').trim();if(num)ph.textContent=num;
   const row=ph.parentElement;if(row.querySelector('.pp1736-call'))continue;
   const a=document.createElement('a');a.className='pp1736-call';a.href=ph.getAttribute('href')||'';a.title='Helista '+num;a.setAttribute('aria-label','Helista kliendile '+num);a.innerHTML=SVG;
   row.prepend(a);
  }
 }
 window.addEventListener('pp145:orders',()=>setTimeout(tick,20));
 setInterval(tick,1500);setTimeout(tick,300);
 window.PP1736={tick};
})();
