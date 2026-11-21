/* Peetri Pizza v18.3 — marks drink and sauce lines on the ready (Valmis) cards so CSS can colour them
 * like the "Lisaks" chips on order cards. Only adds data-pp1830 to existing elements; no data changes. */
(function(){
 'use strict';
 if(window.PP1830)return;window.PP1830=1;
 const DRINK=/cola|pepsi|7\s*up|mirinda|fanta|sprite|vesi|water|mahl|juice|jäätee|lipton|red\s*bull|limonaad|õlu|kali|\d+[.,]\d+\s*l\b/i;
 const SAUCE=/kaste|dip|sauce|ketšup|ketchup|majonees|aioli|salsa/i;
 function tag(){
  for(const li of document.querySelectorAll('#ordersPage .pp112-done-card .pp112-product:not([data-pp1830])')){
   if(li.querySelector('.pp119-code')){li.dataset.pp1830='pizza';continue;}
   const t=li.querySelector('.pp112-product-text')?.textContent||'';
   li.dataset.pp1830=SAUCE.test(t)?'sauce':DRINK.test(t)?'drink':'other';
  }
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;try{tag()}catch(_){}});};
 const start=()=>{const page=document.getElementById('ordersPage');if(page)new MutationObserver(later).observe(page,{childList:true,subtree:true});later();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
