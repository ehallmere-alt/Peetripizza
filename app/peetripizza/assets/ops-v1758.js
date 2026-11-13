/* Peetri Pizza v17.58 — owner: «сделай все красиво строго и интуитивно».
   2) the "Uus tellimus" strip hides itself after 10 s (shows again when another new order arrives);
   5) the ⓘ button is hidden, so tapping the customer name or order number opens the details instead. */
(()=>{
 'use strict';
 if(window.pp1758)return;window.pp1758=true;
 /* ---------- 2: strip goes away by itself ---------- */
 let lastKey='',timer=0;
 function watchStrip(box){
  const check=()=>{
   if(box.hidden){lastKey='';clearTimeout(timer);box.classList.remove('pp1758-gone');return;}
   const key=[...box.querySelectorAll('strong,small')].map(e=>e.textContent).join('|');
   if(key===lastKey)return;
   lastKey=key;box.classList.remove('pp1758-gone');clearTimeout(timer);
   timer=setTimeout(()=>box.classList.add('pp1758-gone'),10000);
  };
  new MutationObserver(check).observe(box,{childList:true,attributes:true,attributeFilter:['hidden']});check();
 }
 const findStrip=()=>{const b=document.getElementById('pp179-new');if(b){watchStrip(b);return true}return false};
 if(!findStrip()){let n=0;const t=setInterval(()=>{if(findStrip()||++n>40)clearInterval(t)},500);}

 /* ---------- 5: name / number opens details ---------- */
 window.addEventListener('click',e=>{
  const hit=e.target.closest&&e.target.closest('#ordersPage .ordercard .pp1733-name, #ordersPage .ordercard .order-number');
  if(!hit)return;
  const btn=hit.closest('.ordercard').querySelector('.pp1741-det,[data-action="details"]');
  if(!btn)return;
  e.preventDefault();e.stopPropagation();btn.click();
 },true);
})();
