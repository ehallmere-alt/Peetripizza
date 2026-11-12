/* Peetri Pizza v17.23 — design pack 2, owner picked 1, 2, 5.
 * 1: order card contents (CSS only, ops-v1723.css).
 * 2: order columns: coloured strip on top; an empty column says so instead of staying blank.
 * 5: Tooted as tiles: the whole tile is the button. First tap turns the tile orange ("puuduta uuesti"),
 *    second tap within 4 s marks it Otsas / Saadaval. Replaces the browser confirm() window, which froze
 *    timers and LIVE while it was open. Still only a local note on this tablet, nothing goes to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1723)return;
 const $=id=>document.getElementById(id);

 /* 2: empty columns */
 const EMPTY={newOrders:['Uusi tellimusi pole','Uus tellimus ilmub siia koos helisignaaliga.'],activeOrders:['Midagi ei valmistata','Võta tellimus vastu, siis tuleb see siia.']};
 function emptyTick(){
  for(const id in EMPTY){
   const box=$(id);if(!box)continue;const col=box.closest('.ordercol');if(!col)continue;
   col.classList.add('pp1723-col','pp1723-col-'+(id==='newOrders'?'new':'work'));
   let e=col.querySelector(':scope>.pp1723-empty');
   if(!e){e=document.createElement('div');e.className='pp1723-empty';e.innerHTML='<span aria-hidden="true">'+(id==='newOrders'?'🍕':'✓')+'</span><strong>'+EMPTY[id][0]+'</strong><small>'+EMPTY[id][1]+'</small>';box.after(e);}
   const none=!box.querySelector('.ordercard');if(e.hidden===none)e.hidden=!none;
  }
 }
 window.addEventListener('pp145:orders',()=>setTimeout(emptyTick,0));
 setInterval(emptyTick,3000);setTimeout(emptyTick,300);

 /* 5: product tiles, two taps */
 let armed=null,armTimer=0,passing=false;
 function disarm(){if(armed){armed.classList.remove('pp1723-armed');armed.querySelector('.pp1723-hint')?.remove();}armed=null;clearTimeout(armTimer);}
 window.addEventListener('click',e=>{
  if(passing)return; // our own forwarded click goes straight to the old handler
  const t=e.target;if(!(t instanceof Element))return;
  const card=t.closest('#productList .pp140-card');
  if(!card){if(armed&&!t.closest('#productList'))disarm();return;}
  const btn=card.querySelector('[data-product]');if(!btn)return;
  e.preventDefault();e.stopPropagation();
  if(armed!==card){
   disarm();armed=card;card.classList.add('pp1723-armed');
   const h=document.createElement('div');h.className='pp1723-hint';h.textContent=card.classList.contains('is-available')?'Puuduta uuesti → OTSAS':'Puuduta uuesti → SAADAVAL';card.append(h);
   armTimer=setTimeout(disarm,4000);return;
  }
  disarm();
  const keep=window.confirm;window.confirm=()=>true; // the two taps are the confirmation
  passing=true;try{btn.click();}finally{passing=false;window.confirm=keep;}
 },true);

 window.PP1723={emptyTick,disarm};
})();
