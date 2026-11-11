/* Peetri Pizza v17.12 — keep "Köögimeeskond" out of Seaded and the menu, also when another script adds it later.
 * Hidden (class pp1712-hidden), never removed: other scripts may still look for these elements.
 */
(function(){
 'use strict';
 if(window.pp1712Ops)return;window.pp1712Ops=true;
 const re=/k[öo]{2}gi\s*meeskond/i;
 function sweep(){
  for(const el of document.querySelectorAll('#settingsPage section,#settingsPage .settingsrow,#settingsPage .panel>div,#drawer nav .navitem')){
   if(el.classList.contains('pp1712-hidden'))continue;
   const head=el.querySelector('h2,h3,strong,.section-tag')||el;
   if(re.test(head.textContent||'')){el.classList.add('pp1712-hidden');el.setAttribute('aria-hidden','true');}
  }
 }
 let q=false;const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;sweep();});};
 function start(){sweep();for(const id of ['settingsPage','drawer']){const n=document.getElementById(id);if(n)new MutationObserver(later).observe(n,{childList:true,subtree:true});}}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
