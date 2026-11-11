/* Peetri Pizza 13.3 — read-only kitchen load status. */
(()=>{
 'use strict';
 const n=document.getElementById('newOrders');
 const a=document.getElementById('activeOrders');
 const box=document.getElementById('pp133-load');
 const label=document.getElementById('pp133-load-label');
 if(!n||!a||!box||!label)return;
 let queued=false;
 function update(){
   queued=false;
   const total=n.querySelectorAll('.ordercard[data-order-id]').length+a.querySelectorAll('.ordercard[data-order-id]').length;
   const level=total>=6?3:total>=3?2:1;
   const names=['','Rahulik','Mõõdukas','Kiire'];
   box.dataset.level=String(level);
   label.textContent=names[level];
   box.setAttribute('aria-label',`Köögi koormus: ${names[level]}. Nähtavaid tellimusi: ${total}.`);
   box.title=`Köögi koormus: ${names[level]} · ${total} nähtavat tellimust`;
 }
 function queue(){if(queued)return;queued=true;window.requestAnimationFrame(update);}
 const observer=new MutationObserver(queue);
 observer.observe(n,{childList:true});
 observer.observe(a,{childList:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue();});
 update();
})();
