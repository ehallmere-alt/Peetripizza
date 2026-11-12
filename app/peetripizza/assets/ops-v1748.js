/* Peetri Pizza v17.48 — Väljastus (ready orders waiting for the customer) in the look of the order cards.
 * Adds a KARBID row from the card's own data-boxes, so the person handing over sees which boxes. Screen only.
 * Off switch: <html class="pp1748-off">. */
(function(){
 'use strict';
 if(window.PP1748)return;
 const root=document.documentElement;
 const BOX='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>';
 function tick(){
  if(root.classList.contains('pp1748-off'))return;
  for(const c of document.querySelectorAll('#pp1711-pickup .pp1711-copy,#pp155-station-list .pp155-station-order')){
   const raw=c.dataset.boxes||c.closest('[data-boxes]')?.dataset.boxes||'';
   let row=c.querySelector(':scope .pp1748-boxes');
   if(!raw||raw==='KOHAPEAL'||c.classList.contains('pp155-station-order')){if(row)row.remove();continue;}
   const html='<i>'+BOX+'</i><b>KARBID</b>'+raw.split(' · ').map(s=>'<span>'+s.replace(/[&<>"']/g,'')+'</span>').join('');
   if(!row){row=document.createElement('div');row.className='pp1748-boxes';const f=c.querySelector('.pp112-card-footer');f?f.before(row):c.append(row);}
   if(row.dataset.h!==html){row.dataset.h=html;row.innerHTML=html;}
  }
  root.classList.add('pp1748-on');
 }
 let q=false;const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 try{new MutationObserver(later).observe(document.body,{childList:true,subtree:true});}catch(_){}
 setInterval(tick,4000);setTimeout(tick,400);
 window.PP1748={tick};
})();
