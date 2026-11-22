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
 const BOXWORD={V:'VÄIKE',K:'KESKMINE',S:'SUUR',P:'PERE'};
 function countSizes(card,done){
  const count={};
  for(const code of card.querySelectorAll('.pp119-code[data-size]')){
   const row=code.closest(done?'.pp112-product':'.product-line');if(!row)continue;
   const k=String(code.dataset.size||'').toUpperCase().charAt(0);
   count[k]=(count[k]||0)+num(row.querySelector(done?'.pp112-qty':'.product-qty')?.textContent);
  }
  return count;
 }
 const sizeHtml=count=>SIZES.filter(([k])=>count[k]).map(([k,w])=>'<span><b>'+count[k]+'</b> '+w+'</span>').join('<i aria-hidden="true">·</i>');
 function put(parent,cls,html,before){
  let el=parent.querySelector(':scope>.'+cls);
  if(!html){if(el)el.remove();return null;}
  if(!el){el=document.createElement('span');el.className=cls;before?parent.insertBefore(el,before):parent.append(el);}
  if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}
  return el;
 }
 function sizes(){
  for(const card of document.querySelectorAll('#ordersPage .ordercard,#ordersPage .pp112-done-card')){
   const done=card.classList.contains('pp112-done-card');
   const line=done?card.querySelector('.pp112-card-identity>div'):card.querySelector('.pp117-identity-line');
   if(!line)continue;
   const count=countSizes(card,done);
   // extras (drinks, sauces, other) as "+N lisa" inside the same chip, so the top of the card stays one row
   let extra=0;
   if(done){for(const li of card.querySelectorAll('.pp112-product[data-pp1830]:not([data-pp1830=pizza])'))extra+=num(li.querySelector('.pp112-qty')?.textContent);}
   else{for(const l of card.querySelectorAll('.product-line.pp1728-moved'))extra+=num(l.querySelector('.product-qty')?.textContent);}
   let html=sizeHtml(count);
   if(html&&extra)html+='<i aria-hidden="true">·</i><span class="pp1830-extra">+'+extra+' lisa</span>';
   put(line,'pp1830-sizes',html);
   card.classList.toggle('pp1830-has-sizes',!!html);
   // boxes row hidden when it says exactly the same as the size chip (no branded boxes, not dine-in)
   const boxRow=card.querySelector(done?'.pp1748-boxes':'.pp177-boxes:not(.pp177-dinein)');
   let same=false;
   if(boxRow&&html){
    const want={};for(const k in count)want[BOXWORD[k]]=count[k];
    const got={};let ok=true;
    for(const it of boxRow.querySelectorAll(done?':scope>span':'em')){const m=(it.textContent||'').trim().match(/^(\d+)\s*×\s*(.+)$/);if(!m){ok=false;break;}got[m[2].trim().toUpperCase()]=(got[m[2].trim().toUpperCase()]||0)+Number(m[1]);}
    const keys=new Set([...Object.keys(want),...Object.keys(got)]);
    same=ok&&keys.size>0&&[...keys].every(k=>want[k]===got[k]);
   }
   card.classList.toggle('pp1830-box-same',same);
  }
  // column heads: "Ootel / Ahju" in the same words as the cards
  for(const [col,list] of [['.pp1723-col-new,.ordercol:has(#newOrders)','#newOrders'],['.pp1723-col-work,.ordercol:has(#activeOrders)','#activeOrders']]){
   const head=document.querySelector('#ordersPage :is('+col+') .section-head');const oven=head&&head.querySelector(':scope>.pp1746-oven');
   if(!head)continue;
   const total={};for(const card of document.querySelectorAll('#ordersPage '+list+' .ordercard')){const c=countSizes(card,false);for(const k in c)total[k]=(total[k]||0)+c[k];}
   const label=oven?.querySelector('b')?.textContent?.trim()||'';
   const html=sizeHtml(total);
   put(head,'pp1830-headsizes',html&&oven?(label?'<em>'+label.replace(/[&<>]/g,'')+'</em>':'')+html:'',oven?oven.nextSibling:null);
   head.classList.toggle('pp1830-head-has',!!(html&&oven));
  }
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;try{tag()}catch(_){}try{sizes()}catch(_){}});};
 const start=()=>{const page=document.getElementById('ordersPage');if(page)new MutationObserver(later).observe(page,{childList:true,subtree:true});later();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
