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
 // owner 22.11 02:03: "сколько маленьких сколько больших отдельно" — size summary chip on every card ("2 väike · 1 suur"),
 // read from the size chips already drawn on the card (data-size = first letter of the code).
 const SIZES=[['V','väike'],['K','keskmine'],['S','suur'],['P','pere']];
 const num=t=>{const n=parseInt(String(t||'').replace(/[^0-9]/g,''),10);return n>0?n:1;};
 function sizes(){
  for(const card of document.querySelectorAll('#ordersPage .ordercard,#ordersPage .pp112-done-card')){
   const done=card.classList.contains('pp112-done-card');
   const line=done?card.querySelector('.pp112-card-identity>div'):card.querySelector('.pp117-identity-line');
   if(!line)continue;
   const count={};
   for(const code of card.querySelectorAll('.pp119-code[data-size]')){
    const row=code.closest(done?'.pp112-product':'.product-line');if(!row)continue;
    const k=String(code.dataset.size||'').toUpperCase().charAt(0);
    count[k]=(count[k]||0)+num(row.querySelector(done?'.pp112-qty':'.product-qty')?.textContent);
   }
   const parts=SIZES.filter(([k])=>count[k]).map(([k,w])=>'<span><b>'+count[k]+'</b> '+w+'</span>');
   let el=line.querySelector(':scope>.pp1830-sizes');
   if(!parts.length){if(el)el.remove();card.classList.remove('pp1830-has-sizes');continue;}
   const html=parts.join('<i aria-hidden="true">·</i>');
   if(!el){el=document.createElement('span');el.className='pp1830-sizes';line.append(el);}
   if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}
   card.classList.add('pp1830-has-sizes');
  }
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;try{tag()}catch(_){}try{sizes()}catch(_){}});};
 const start=()=>{const page=document.getElementById('ordersPage');if(page)new MutationObserver(later).observe(page,{childList:true,subtree:true});later();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
