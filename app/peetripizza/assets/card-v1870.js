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
   // owner 23:29 "juust не понятно что это, замену надо выделить, отделить": its own line above the toppings, "⇄ Juust → mozzarella"
   const known=val&&!/^(juust|cheese)$/i.test(val);
   m.innerHTML='<i aria-hidden="true">⇄</i><small>JUUSTU VAHETUS</small>'+(known?'<b>'+esc(val)+'</b>':'<b>vaata tellimust</b>');
   m.title='Juust vahetatud'+(known?': '+val:'');
   const box=m.parentElement;if(!box)continue;
   let row=box.parentElement.querySelector(':scope>.pp1870-swap');
   if(!row){row=document.createElement('div');row.className='pp1870-swap';box.before(row);}
   row.append(m);
   if(!box.children.length)box.hidden=true;
  }
 }
 // owner 23:30 "при выдаче нельзя телефон увидеть": phone on ready cards (from data-phone, already on the card; only the signed-in kitchen sees it)
 function phones(){
  for(const c of document.querySelectorAll('#ordersPage .pp112-done-card[data-phone]')){
   const ph=String(c.dataset.phone||'').replace(/[^0-9+ -]/g,'').trim();
   const box=c.querySelector('.pp112-card-identity>div');if(!box)continue;
   let a=box.querySelector(':scope>.pp1880-phone');
   if(!ph){if(a)a.remove();continue;}
   if(!a){a=document.createElement('a');a.className='pp1880-phone';box.append(a);}
   if(a.dataset.ph!==ph){a.dataset.ph=ph;a.href='tel:'+ph.replace(/ /g,'');a.textContent='📞 '+ph;}
  }
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;try{cheese()}catch(_){}try{classic()}catch(_){}try{phones()}catch(_){}});};
 const start=()=>{const page=document.getElementById('ordersPage');if(page)new MutationObserver(later).observe(page,{childList:true,subtree:true});later();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
