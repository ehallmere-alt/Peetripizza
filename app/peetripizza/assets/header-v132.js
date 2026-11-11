/* v13.1: read-only urgency overview from currently rendered kitchen tickets. */
(()=>{
 const urgent=document.getElementById('pp131-urgent-count');
 const late=document.getElementById('pp131-late-count');
 const lateBadge=document.getElementById('pp131-overdue');
 const widget=document.getElementById('pp131-urgency');
 const label=widget?.querySelector('.pp131-urgency-label');
 const hosts=[document.getElementById('newOrders'),document.getElementById('activeOrders')];
 if(!urgent||!late||!lateBadge||!widget||hosts.some(h=>!h))return;
 let scheduled=false;
 const update=()=>{
   scheduled=false;
   let urgentCount=0,lateCount=0;
   for(const host of hosts){
     for(const card of host.querySelectorAll('.ordercard[data-order-id]')){
       if(card.classList.contains('urgency-late')){urgentCount++;lateCount++;}
       else if(card.classList.contains('urgency-soon')){urgentCount++;}
     }
   }
   // v17.1: write only on change, so the 1s timer tick does not cascade into other observers.
   const set=(el,v)=>{if(el.textContent!==v)el.textContent=v};
   set(urgent,String(urgentCount));
   set(late,String(lateCount));
   if(lateBadge.hidden!==(lateCount===0))lateBadge.hidden=lateCount===0;
   if(label)set(label,urgentCount>0?'Kiire':'Rahulik');
   widget.classList.toggle('pp131-alert',urgentCount>0);
   widget.classList.toggle('pp132-calm',urgentCount===0);
   widget.classList.toggle('pp131-critical',lateCount>0);
   const aria=`Kiired tellimused: ${urgentCount}; hilinenud tellimused: ${lateCount}`;if(widget.getAttribute('aria-label')!==aria)widget.setAttribute('aria-label',aria);
 };
 const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(update);};
 const observer=new MutationObserver(schedule);
 hosts.forEach(h=>observer.observe(h,{childList:true,subtree:true,attributes:true,attributeFilter:['class']}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 schedule();
})();
