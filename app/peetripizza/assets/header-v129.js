/* v12.9 — live workload counters derived from rendered tickets, not synthetic totals. */
(()=>{
 const newHost=document.getElementById('newOrders');
 const activeHost=document.getElementById('activeOrders');
 const newOut=document.getElementById('pp129-new-count');
 const activeOut=document.getElementById('pp129-active-count');
 const wrap=document.getElementById('pp129-workload');
 if(!newHost||!activeHost||!newOut||!activeOut||!wrap)return;
 let scheduled=false;
 const count=(host)=>host.querySelectorAll('.ordercard[data-order-id]').length;
 function update(){
   scheduled=false;
   const n=count(newHost),a=count(activeHost);
   if(newOut.textContent!==String(n))newOut.textContent=String(n);
   if(activeOut.textContent!==String(a))activeOut.textContent=String(a);
   wrap.setAttribute('aria-label',`Uued tellimused: ${n}. Valmistamisel: ${a}.`);
   wrap.classList.toggle('pp129-has-new',n>0);
 }
 function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(update);}
 const observer=new MutationObserver(queue);
 observer.observe(newHost,{childList:true});
 observer.observe(activeHost,{childList:true});
 update();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue();});
})();
