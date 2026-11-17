/* Peetri Pizza v17.66 — 5: "N pitsat" chip on Valmis / Väljastus cards (main cards already have it from app-core).
   Counts quantities of lines that have a size code (= pizzas); drinks and sauces are not counted. */
(()=>{
 'use strict';
 if(window.pp1766)return;window.pp1766=true;
 function tag(){
  for(const c of document.querySelectorAll('.pp112-done-card')){
   let n=0;
   for(const li of c.querySelectorAll('.pp112-product')){if(!li.querySelector('.pp177-code'))continue;n+=parseInt(li.querySelector('.pp112-qty')?.textContent,10)||1;}
   let chip=c.querySelector('.pp1766-pz');
   if(!n){chip?.remove();continue;}
   const txt=n+(n===1?' pitsa':' pitsat');
   if(!chip){const box=c.querySelector('.pp112-card-identity>div');if(!box)continue;chip=document.createElement('span');chip.className='pp1766-pz';box.append(chip);} // at the end: keeps .pp1730-chips+.pp1730-chips hiding intact
   if(chip.textContent!==txt)chip.textContent=txt;
  }
 }
 // React to card DOM changes instead of scanning every 1.2 seconds.
 const root=document.getElementById('doneOrders');
 let scheduled=false;
 function queue(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;tag();});
 }
 if(root){
  new MutationObserver(queue).observe(root,{childList:true,subtree:true});
 }
 window.addEventListener('pp145:orders',queue);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});
 else queue();
})();
