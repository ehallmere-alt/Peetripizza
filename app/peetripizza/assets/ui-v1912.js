/* Peetri Pizza 18.12 — owner 24.11 20:42 "давай" (pack of six). Adds classes and short texts only; no data is sent anywhere. */
(function(){
 'use strict';
 if(window.PP1912)return;window.PP1912=1;
 const pad=n=>String(n).padStart(2,'0');
 const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
 const prep=()=>{let m=0;try{if(typeof minutes!=='undefined')m=Number(minutes);}catch(_){}return m>0?m:20;};
 // 1 — pre-order for another day (grey, folded card in the work column): "Alusta HH:MM" = due time minus Valmistamisaeg
 function start(){
  for(const c of document.querySelectorAll('#ordersPage .ordercard.pp1880-later')){
   const due=c.querySelector('.pp1728-due');if(!due)continue;
   const m=(due.textContent||'').match(/(\d{1,2}):(\d{2})/);if(!m)continue;
   const d=new Date();d.setHours(+m[1],+m[2]-prep(),0,0);
   const txt='Alusta '+hm(d);
   let s=due.querySelector(':scope>.pp1912-start');
   if(!s){s=document.createElement('em');s.className='pp1912-start';due.append(s);}
   if(s.textContent!==txt)s.textContent=txt;
  }
 }
 // 2 — courier order: "Kullerile antud" instead of "Üle antud" (only the label; the button and its action stay the same)
 function courier(){
  for(const b of document.querySelectorAll('#ordersPage .pp112-done-card.pp1730-t-kuller .pp154-handover, #ordersPage .pp112-done-card.pp1730-t-kuller .pp158-handover')){
   const sp=b.querySelector('span');const el=sp||b;
   const t=(el.textContent||'').trim();
   if(/^✓?\s*Üle antud$/.test(t))el.textContent=(sp?'':'✓ ')+'Kullerile antud';
  }
 }
 // 3 — Ooteaeg 45 min or more: amber box (no blinking)
 function wait(){
  const b=document.getElementById('pp1722-wait'),v=document.getElementById('pp1722-wait-v');if(!b||!v)return;
  const n=parseInt((v.textContent||'').replace(/\D+/g,''),10)||0;
  b.classList.toggle('pp1912-busy',n>=45);
 }
 // 4 — new order not accepted for over 5 minutes: orange frame (no blinking)
 function slow(){
  const now=new Date();
  for(const c of document.querySelectorAll('#ordersPage .ordercard.pp118-new')){
   const t=c.querySelector('.pp118-order-time');const m=t&&(t.textContent||'').match(/(\d{1,2}):(\d{2})/);
   let late=false;
   if(m){const d=new Date(now);d.setHours(+m[1],+m[2],0,0);let diff=(now-d)/60000;if(diff<-720)diff+=1440;late=diff>5;}
   c.classList.toggle('pp1912-slow',late);
  }
 }
 // 5 — Tooted: red "N otsas" on each category tab, so switched-off products are seen from any tab
 function outTabs(){
  let list=null;try{if(typeof products!=='undefined'&&Array.isArray(products))list=products;}catch(_){}
  if(!list)return;
  for(const btn of document.querySelectorAll('#pp137-category-tabs [data-category]')){
   const cat=btn.dataset.category;
   const n=list.filter(p=>!p.available&&(cat==='Kõik'||p.category===cat)).length;
   let e=btn.querySelector(':scope>.pp1912-out');
   if(!n){if(e)e.remove();continue;}
   if(!e){e=document.createElement('em');e.className='pp1912-out';btn.append(e);}
   const txt=n+' otsas';if(e.textContent!==txt)e.textContent=txt;
  }
 }
 // 6 — tap the logo: back to Tellimused from any page
 window.addEventListener('click',e=>{
  const l=e.target instanceof Element&&e.target.closest('header.topbar .pp116-logo');if(!l)return;
  const nav=document.querySelector('[data-page="orders"]');if(nav){nav.click();}
 },true);
 let q=false;
 const run=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;for(const f of [start,courier,wait,slow,outTabs]){try{f()}catch(_){}}});};
 const root=document.body||document.documentElement;
 new MutationObserver(run).observe(root,{childList:true,subtree:true,characterData:true});
 setInterval(run,15000);run();
})();
