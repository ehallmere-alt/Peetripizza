/* Peetri Pizza v17.32 — owner: "Makstud вниз к сумме, Saabus под время". Moves two chips on the card; data untouched. */
(function(){
 'use strict';
 if(window.PP1732)return;
 function tick(){
  for(const c of document.querySelectorAll('#ordersPage .ordercard[data-pp1728]:not([data-pp1732])')){
   c.dataset.pp1732='1';
   const foot=c.querySelector('.cardfoot'),price=foot&&foot.querySelector('.price');
   const pay=c.querySelector('.pp117-identity-line .pp1728-pay');
   if(pay&&foot){price?price.after(pay):foot.prepend(pay);}
   const meter=c.querySelector('.prep-meter'),time=c.querySelector('.pp117-identity-line .pp118-order-time');
   if(meter&&time){
    let col=meter.parentElement.classList.contains('pp1732-timecol')?meter.parentElement:null;
    if(!col){col=document.createElement('div');col.className='pp1732-timecol';meter.before(col);col.append(meter);}
    col.append(time);
   }
  }
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(()=>queueMicrotask(tick)));
 setInterval(tick,1500);setTimeout(tick,300);
 window.PP1732={tick};
})();
