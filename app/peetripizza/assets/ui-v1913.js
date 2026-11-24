/* Peetri Pizza 18.13 — owner 24.11 21:50 "давай" (pack of six). Only shows what the order already says; nothing is sent anywhere. */
(function(){
 'use strict';
 if(window.PP1913)return;window.PP1913=1;
 const orderOf=id=>{try{if(typeof shownOrders==='function')return shownOrders().find(o=>String(o.id)===String(id))||null;}catch(_){}return null;};
 // 1 — allergy words also on ready cards (the order card marks them since 17.17; the ready card had no note at all)
 function allergy(){
  if(typeof pp1717Find!=='function')return;
  for(const c of document.querySelectorAll('#ordersPage .pp112-done-card[data-order-id]')){
   const o=orderOf(c.dataset.orderId);
   const text=o?[o.note||'',...(Array.isArray(o.items)?o.items.map(i=>Array.isArray(i)?i[0]:''):[])].join(' '):'';
   const found=o?[...new Set(pp1717Find(text).map(x=>x.toLocaleUpperCase('et-EE')))].slice(0,3):[];
   let el=c.querySelector('.pp1913-allergy');
   if(!found.length){if(el)el.remove();continue;}
   const first=c.querySelector('.pp112-product');if(!first)continue;
   if(!el||el.nextElementSibling!==first){if(el)el.remove();el=document.createElement('div');el.className='pp1913-allergy';first.before(el);}
   const t='⚠ '+found.join(' · ');if(el.textContent!==t)el.textContent=t;
  }
 }
 // 2 — ready card: drinks and sauces under one small "KOTTI" label (they were already listed as chips)
 function bag(){
  for(const c of document.querySelectorAll('#ordersPage .pp112-done-card')){
   const first=c.querySelector('.pp112-product:is([data-pp1830=drink],[data-pp1830=sauce])');
   const has=c.querySelector('.pp1913-bag');
   if(!first){if(has)has.remove();continue;}
   if(has&&has.nextElementSibling===first)continue;
   if(has)has.remove();
   const l=document.createElement('div');l.className='pp1913-bag';l.textContent='KOTTI';first.before(l);
  }
 }
 // 3 — 5 pizzas or more: "SUUR TELLIMUS" chip (count from the dark size chip, e.g. "3 SÕ · 2 VÕ")
 function big(){
  for(const c of document.querySelectorAll('#ordersPage :is(.ordercard,.pp112-done-card)')){
   const s=c.querySelector('.pp1830-sizes');
   const n=s?[...s.querySelectorAll('b')].reduce((a,b)=>a+(parseInt(b.textContent,10)||0),0):0;
   let chip=c.querySelector('.pp1913-big');
   if(n<5){if(chip)chip.remove();continue;}
   if(!chip){chip=document.createElement('span');chip.className='pp1913-big';chip.textContent='SUUR TELLIMUS';s.after(chip);}
  }
 }
 // 4 — customer note: "Kellaaeg: 17:45" in bold
 function time(){
  for(const p of document.querySelectorAll('#ordersPage .customer-note p:not([data-pp1913])')){
   p.dataset.pp1913='1';
   const w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
   for(const t of nodes){
    const m=t.nodeValue.match(/(Kellaaeg|Kell|Aeg|Time)\s*:\s*\d{1,2}[:.]\d{2}/i);if(!m)continue;
    const b=document.createElement('b');b.className='pp1913-time';
    const before=t.nodeValue.slice(0,m.index),after=t.nodeValue.slice(m.index+m[0].length);
    b.textContent=m[0];const f=document.createDocumentFragment();f.append(before,b,after);t.replaceWith(f);break;
   }
  }
 }
 // 6 — Tooted: calm green line when nothing is switched off
 function allOk(){
  const list=document.getElementById('productList');if(!list)return;
  let prods=null;try{if(typeof products!=='undefined'&&Array.isArray(products))prods=products;}catch(_){}
  if(!prods)return;
  const ok=prods.length>0&&prods.every(p=>p.available);
  let l=document.getElementById('pp1913-allok');
  if(!ok){if(l)l.remove();return;}
  if(!l){l=document.createElement('div');l.id='pp1913-allok';l.textContent='✓ Kõik tooted saadaval';list.before(l);}
 }
 let q=false;
 const run=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;for(const f of [allergy,bag,big,time,allOk]){try{f()}catch(_){}}});};
 new MutationObserver(run).observe(document.body||document.documentElement,{childList:true,subtree:true});
 setInterval(run,15000);run();
})();
