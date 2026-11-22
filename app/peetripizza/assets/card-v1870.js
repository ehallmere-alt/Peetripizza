/* Peetri Pizza v18.7 — owner 22.11 22:58: "Замена сыра как-то не так".
 * The cheese choice ("Juust: mozzarella", or a bare "Cheese") was grey text under the size chip.
 * Here it becomes one cheese chip at the start of the topping chips: "JUUST mozzarella". Only changes the look of an existing chip. */
(function(){
 'use strict';
 if(window.PP1870)return;window.PP1870=1;
 // owner 23:20 "второй дизайн убирай": every tablet goes back to Kujundus 1 (the switch is hidden in Seaded).
 try{if(localStorage.getItem('pp-kitchen-appearance-v1799')==='2')localStorage.setItem('pp-kitchen-appearance-v1799','1');}catch(_){}
 const classic=()=>{if(document.body&&document.body.classList.contains('pp-design-two')){document.body.classList.remove('pp-design-two');document.documentElement.classList.remove('pp-design-two');}};
 classic();document.addEventListener('DOMContentLoaded',classic);
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function cheese(){
  for(const m of document.querySelectorAll('#ordersPage .pp177-mod:not([data-pp1870])')){
   m.dataset.pp1870='1';
   const t=(m.textContent||'').trim();
   const x=t.match(/^(?:juust|cheese)\s*:\s*(.+)$/i);
   const bare=/^cheese$/i.test(t); // English "Cheese" alone; "JUUST" (extra) and the red "Juust" (without) keep their own chips
   if(!x&&!bare)continue;
   const val=x?x[1].trim():'';
   m.classList.remove('pp177-mod-warn','pp177-mod-info','pp1728-plus');
   m.classList.add('pp1870-cheese');
   m.innerHTML='<small>JUUST</small>'+(val&&!/^(juust|cheese)$/i.test(val)?' '+esc(val):'');
   m.title='Juust: '+(val||'valitud');
   const box=m.parentElement;if(box&&box.firstElementChild!==m)box.prepend(m);
  }
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;try{cheese()}catch(_){}try{classic()}catch(_){}});};
 const start=()=>{const page=document.getElementById('ordersPage');if(page)new MutationObserver(later).observe(page,{childList:true,subtree:true});later();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
