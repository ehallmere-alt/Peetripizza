/* Peetri Pizza v17.26 — design pack 5, owner picked 1, 3, 5, 6 (not 2, 4).
 * 1: header sticks to the top on every screen and gets slimmer after scrolling (CSS + html.pp1726-scrolled).
 * 3: "Telli tainas!" reminder as a slim bar at the very bottom; the page gets room so the cards can scroll above it (CSS).
 * 5: when sound is off or blocked by Chrome, a new order flashes the screen frame orange.
 * 6: Tooted tiles compact (CSS).
 * Nothing here talks to the server or to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1726)return;
 const root=document.documentElement;

 /* 1 */
 let ticking=false;
 function onScroll(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;const on=window.scrollY>40;if(root.classList.contains('pp1726-scrolled')!==on)root.classList.toggle('pp1726-scrolled',on);});}
 window.addEventListener('scroll',onScroll,{passive:true});onScroll();

 /* 5: silent flash */
 const seen=new Set(),boot=Date.now()+8000;
 function silent(){
  try{const d=window.PPSound?.diagnostics?.();if(d)return !d.enabled||!d.supported||d.state!=='running';}catch(_){}
  return document.getElementById('soundBtn')?.getAttribute('aria-pressed')==='false';
 }
 let fl=null;
 function flash(){
  if(!fl){fl=document.createElement('div');fl.id='pp1726-flash';fl.setAttribute('aria-hidden','true');document.body.append(fl);}
  fl.classList.remove('on');void fl.offsetWidth;fl.classList.add('on');
  clearTimeout(flash.t);flash.t=setTimeout(()=>fl.classList.remove('on'),3200);
 }
 function check(){
  const ids=[...document.querySelectorAll('#newOrders .ordercard[data-order-id]')].map(c=>c.dataset.orderId);
  let fresh=0;for(const id of ids)if(!seen.has(id)){seen.add(id);fresh++;}
  if(seen.size>500)seen.clear();
  if(fresh&&fresh<=3&&Date.now()>boot&&silent())flash();
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(()=>{try{check()}catch(_){}}));
 setInterval(()=>{try{check()}catch(_){}},2000);setTimeout(check,300);

 window.PP1726={flash,silent,check};
})();
