/* Peetri Pizza v17.40 — owner picked 1,2,3,4,6. Here: #2 finished orders on the Valmis page look like the kitchen cards
 * (type stripe, number chip, KAASA/KULLERIGA/KOHAPEAL + payment chips, no big check square). Layout only. */
(function(){
 'use strict';
 if(window.PP1740)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function byId(id){try{return (typeof shownOrders==='function'?shownOrders():[]).find(o=>String(o.id)===String(id))||null}catch(_){return null}}
 function decorate(){
  for(const c of document.querySelectorAll('#doneOrders .pp112-done-card[data-order-id]:not([data-pp1740])')){
   c.dataset.pp1740='1';
   const o=byId(c.dataset.orderId);
   const t=o?(o.dineIn?'kohapeal':o.serving==='delivery'?'kuller':'kaasa'):'kaasa';
   c.classList.add('pp1740-card','pp1730-t-'+t);
   const num=c.querySelector('.pp112-number');
   if(num&&o&&!c.querySelector('.pp1730-chips')){
    const line=document.createElement('span');line.className='pp1730-chips';
    const label={kuller:'KULLERIGA',kaasa:'KAASA',kohapeal:'KOHAPEAL'}[t];
    let pay=null;try{pay=window.PP1728?.payChip(o.payment)}catch(_){}
    line.innerHTML='<span class="pp1730-type">'+label+'</span>'+(pay?'<span class="pp1728-pay pp1728-pay-'+pay[1]+'">'+esc(pay[0])+'</span>':'');
    num.after(line);
   }
  }
 }
 setInterval(decorate,1500);setTimeout(decorate,300);
 window.addEventListener('pp145:orders',()=>setTimeout(decorate,30));
 window.PP1740={decorate};
})();
