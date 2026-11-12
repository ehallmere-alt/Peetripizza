/* Peetri Pizza v17.36 — owner: a phone handset in front of the name (where the round letter was).
 * The number is hidden; tap the handset to show it, tap the number to call. Tap the handset again to hide it. */
(function(){
 'use strict';
 if(window.PP1736)return;
 const open=new Set();
 const SVG='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
 function tick(){
  for(const ph of document.querySelectorAll('#ordersPage .ordercard .pp1734-namerow>a.pp177-phone:not([data-pp1736])')){
   ph.dataset.pp1736='1';
   const num=(ph.textContent||'').replace(/[^0-9+ -]/g,'').trim();if(num)ph.textContent=num;
   const row=ph.parentElement;if(row.querySelector('.pp1736-call'))continue;
   const b=document.createElement('button');b.type='button';b.className='pp1736-call';b.title='Näita numbrit';b.setAttribute('aria-label','Näita kliendi telefoni');b.innerHTML=SVG;
   row.prepend(b);
   const id=ph.closest('.ordercard')?.dataset.orderId;if(id&&open.has(id))row.classList.add('pp1736-open');
  }
 }
 // live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  const b=t.closest('#ordersPage .pp1736-call');if(!b)return;
  e.preventDefault();e.stopPropagation();
  const row=b.parentElement;const on=row.classList.toggle('pp1736-open');
  const id=b.closest('.ordercard')?.dataset.orderId;if(id){on?open.add(id):open.delete(id);}
  b.title=on?'Peida number':'Näita numbrit';
 },true);
 window.addEventListener('pp145:orders',()=>setTimeout(tick,20));
 setInterval(tick,1500);setTimeout(tick,300);
 window.PP1736={tick};
})();
