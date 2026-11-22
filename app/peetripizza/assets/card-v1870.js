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
   const known0=val&&!/^(juust|cheese)$/i.test(val);
   // owner 00:03 (18.10): the hidden chip still showed, because the .pp1870-cheese CSS (display:inline-flex !important) beat display:none — use a class that only hides
   if(!known0){m.hidden=true;m.classList.add('pp1900-gone');continue;}
   m.classList.remove('pp177-mod-warn','pp177-mod-info','pp1728-plus');
   m.classList.add('pp1870-cheese');
   // owner 23:29 "juust не понятно что это, замену надо выделить, отделить": its own line above the toppings, "⇄ Juust → mozzarella"
   const known=val&&!/^(juust|cheese)$/i.test(val);
   // owner 23:41: a bare "Cheese" with no cheese type says nothing to the cook — hide it
   if(!known){m.hidden=true;m.style.display='none';continue;}
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
   if(!a){a=document.createElement('a');a.className='pp1880-phone';a.hidden=true;box.append(a);}
   c.classList.add('pp1880-has-phone');
   if(a.dataset.ph!==ph){a.dataset.ph=ph;a.href='tel:'+ph.replace(/ /g,'');a.textContent='📞 '+ph;}
  }
 }
 // owner 23:34 pack 2/3/5:
 // 2 — pre-order for another day: folded and grey (tap the card top to open it)
 const open18=new Set();
 function tomorrow(){
  for(const c of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const due=(c.querySelector('.pp1728-due')?.textContent||'');
   const other=!!c.querySelector(':scope>.pp1729-pre')&&/homme|ülehomme|\d{1,2}\.\s?\d{1,2}\.|\b(E|T|K|N|R|L|P),/i.test(due);
   c.classList.toggle('pp1880-later',other);
   c.classList.toggle('pp1880-open',other&&open18.has(c.dataset.orderId));
  }
 }
 window.addEventListener('click',e=>{
  const top=e.target instanceof Element&&e.target.closest('#ordersPage .ordercard.pp1880-later .cardtop');if(!top)return;
  const c=top.closest('.ordercard');const id=c.dataset.orderId;open18.has(id)?open18.delete(id):open18.add(id);
  c.classList.toggle('pp1880-open',open18.has(id));e.preventDefault();e.stopPropagation();
 },true);
 // 3 — not paid yet: big red "MAKSA KOHAL · KAART / SULARAHA" on ready cards
 function pay(){
  for(const b of document.querySelectorAll('#ordersPage .pp112-done-card :is(.pp1728-pay-cash,.pp1728-pay-card):not([data-pp1880])')){
   b.dataset.pp1880='1';b.textContent='MAKSA KOHAL · '+(b.classList.contains('pp1728-pay-cash')?'SULARAHA':'KAART');b.classList.add('pp1880-due');
  }
  for(const t of document.querySelectorAll('#ordersPage .pp112-done-card .pp1730-type'))t.classList.toggle('pp1880-courier',/KULLER/i.test(t.textContent||''));
 }
 // 5 — customer note: each "Aadress: / Kuupäev: / Kellaaeg: / Peoruum: …" on its own line
 const LBL=/\s*(Aadress|Kuupäev|Kellaaeg|Peoruum|Telefon|Uks|Korrus|Korter|Kood|Märkus|Kommentaar)\s*:/g;
 function notes(){
  for(const pEl of document.querySelectorAll('#ordersPage .customer-note p:not([data-pp1880])')){
   pEl.dataset.pp1880='1';
   const w=document.createTreeWalker(pEl,NodeFilter.SHOW_TEXT);const ns=[];while(w.nextNode())ns.push(w.currentNode);
   let first=true;
   for(const t of ns){t.nodeValue=t.nodeValue.replace(LBL,(m,l)=>{const r=(first&&/^\s*$/.test(pEl.textContent.slice(0,pEl.textContent.indexOf(m)))?'':'\n')+l+':';first=false;return r;});}
   pEl.classList.add('pp1880-lines');
  }
 }
 // owner 23:41 "телефон только если нажал на имя": tap the name to show / hide the phone
 window.addEventListener('click',e=>{
  const n=e.target instanceof Element&&e.target.closest('#ordersPage .pp112-done-card.pp1880-has-phone .pp112-customer');if(!n)return;
  const a=n.closest('.pp112-done-card').querySelector('.pp1880-phone');if(!a)return;
  a.hidden=!a.hidden;e.preventDefault();e.stopPropagation();
 },true);
 let q=false;
 // 18.10 owner 00:07 "улучшай": ready cards — stale ones dimmed, short wait text, no repeated size chip
 function ready(){
  for(const c of document.querySelectorAll('#ordersPage .pp112-done-card')){
   const w=c.querySelector('.pp1730-wait');const n=w?parseInt((w.textContent.match(/(\d+)\s*min/)||[])[1]||'0',10):0;
   c.classList.toggle('pp1900-old',n>=120);
   const tag=c.querySelector('.pp154-pickup-tag');
   if(tag&&n){const txt=n>=120?'⏱ Ootab üle 2 h':(n>=60?'⏱ Ootab '+Math.floor(n/60)+' h '+(n%60)+' min':'⏱ Ootab '+n+' min');if(tag.textContent!==txt)tag.textContent=txt;}
   c.classList.toggle('pp1900-one',c.querySelectorAll('.pp112-product[data-pp1830=pizza]').length===1);
  }
 }
 // 18.10 pack 2: 4 — Halduskeskus in the menu gets a line icon like the other items (was the ▦ glyph, off-line)
 function navIcon(){
  const a=document.querySelector('#drawer a.navitem[href*="settings-pro"]>span:first-child:not(.pp162-nav-icon)');if(!a)return;
  a.className='pp162-nav-icon';a.setAttribute('aria-hidden','true');
  a.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
 }
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;try{cheese()}catch(_){}try{classic()}catch(_){}try{phones()}catch(_){}try{tomorrow()}catch(_){}try{pay()}catch(_){}try{notes()}catch(_){}try{ready()}catch(_){}try{navIcon()}catch(_){}});};
 const start=()=>{const page=document.getElementById('ordersPage');if(page)new MutationObserver(later).observe(page,{childList:true,subtree:true});later();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
