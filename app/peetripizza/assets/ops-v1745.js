/* Peetri Pizza v17.45 — order card (owner picked 1, 3, 6 on 12.11.2026).
 * 1: thin bar under the JÄÄNUD box that slowly shrinks to the deadline (no blinking).
 * 3: pre-orders (ETTETELLIMUS, more than an hour ahead) fold into one line at the bottom of "Uued";
 *    they open by themselves an hour before, or by a tap.
 * 6: a long customer name or product name gets a smaller font so it fits whole, instead of "…".
 * Screen only: order data, LIVE, printing and buttons are untouched. Off switch: <html class="pp1745-off">.
 */
(function(){
 'use strict';
 if(window.PP1745)return;
 const root=document.documentElement;
 const OPEN_KEY='pp1745-open';
 let open;try{open=new Set(JSON.parse(sessionStorage.getItem(OPEN_KEY)||'[]'))}catch(_){open=new Set()}
 const saveOpen=()=>{try{sessionStorage.setItem(OPEN_KEY,JSON.stringify([...open].slice(-50)))}catch(_){}};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 function deadline(o){try{if(typeof orderDeadline==='function')return orderDeadline(o)}catch(_){}const d=Number(o.deadline);return d>0?d:(Number(o.created)||0)+(Number(o.minutes)||20)*60000;}

 // 1: time bar
 function bar(card,o,now){
  const due=card.querySelector('.pp1728-due');if(!due)return;
  let b=due.querySelector(':scope>.pp1745-bar');
  if(!b){b=document.createElement('span');b.className='pp1745-bar';b.setAttribute('aria-hidden','true');b.innerHTML='<span></span>';due.append(b);}
  const dl=deadline(o),st=Number(o.created)||0;
  const total=dl-st,left=dl-now;
  const p=total>0?Math.max(0,Math.min(1,left/total)):0;
  const w=(Math.round(p*1000)/10)+'%';
  if(b.firstChild.style.width!==w)b.firstChild.style.width=w;
 }

 // 3: pre-orders folded
 function fold(card,o){
  const id=String(o.id);
  const due=card.querySelector('.pp1728-due');
  const pre=!!(due&&due.dataset.s==='pre'&&card.closest('#newOrders'));
  const want=pre&&!open.has(id);
  let line=card.querySelector(':scope>.pp1745-foldline');
  if(want){
   if(!line){line=document.createElement('button');line.type='button';line.className='pp1745-foldline';line.innerHTML='<b>ETTETELLIMUS</b><span class="pp1745-fn"></span><span class="pp1745-ft"></span><span class="pp1745-fs"></span><span class="pp1745-fc"></span><i aria-hidden="true">▾</i>';card.prepend(line);}
   // v17.51 (owner): when to start = deadline minus the kitchen's prep time
   if(!line.querySelector('.pp1745-fs')){const fs=document.createElement('span');fs.className='pp1745-fs';line.querySelector('.pp1745-ft')?.after(fs);}
   let prep=0;try{if(typeof minutes!=='undefined')prep=Number(minutes);}catch(_){} // Seaded → Valmistamisaeg
   if(!(prep>0))prep=Number(o.minutes);
   if(!(prep>0))prep=20;
   const st=new Date(deadline(o)-prep*60000),hm=String(st.getHours()).padStart(2,'0')+':'+String(st.getMinutes()).padStart(2,'0');
   const name=(card.querySelector('.pp1733-name')||card.querySelector('.pp92-customer'))?.textContent?.trim()||'';
   const [L,B]=[due.children[0]?.textContent||'',due.children[1]?.textContent||''];
   const t=(L+' '+B).trim();
   const c=card.querySelector('.pp1741-count')?.textContent?.trim()||'';
   const set=(sel,v)=>{const e=line.querySelector(sel);if(e&&e.textContent!==v)e.textContent=v;};
   set('.pp1745-fn',name);set('.pp1745-ft',t);set('.pp1745-fs','Alusta '+hm);set('.pp1745-fc',c);
   card.classList.add('pp1745-fold');
  }else{
   card.classList.remove('pp1745-fold');
   if(line)line.remove();
  }
  card.classList.toggle('pp1745-pre',pre);
 }
 window.addEventListener('click',e=>{
  const t=e.target instanceof Element&&e.target.closest('.pp1745-foldline');if(!t)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const card=t.closest('.ordercard');const id=card&&card.dataset.orderId;if(!id)return;
  open.add(String(id));saveOpen();
  card.classList.remove('pp1745-fold');t.remove();
  setTimeout(()=>{try{card.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(_){}},30);
 },true);

 // 6: long names fit whole
 function fit(card){
  const w=card.clientWidth;
  for(const el of card.querySelectorAll('.pp1733-name,.product-name .pp177-name')){
   const key=w+'|'+el.textContent;
   if(el.dataset.pp1745===key)continue;
   el.style.removeProperty('font-size');el.classList.remove('pp1745-wrap');
   if(el.scrollWidth<=el.clientWidth+1){el.dataset.pp1745=key;continue;}
   const base=parseFloat(getComputedStyle(el).fontSize)||28,min=Math.max(14,base*0.62);
   let fs=base;
   while(el.scrollWidth>el.clientWidth+1&&fs>min){fs=Math.max(min,fs-2);el.style.setProperty('font-size',fs+'px','important');}
   // still too long even at the smallest size: two lines at a medium size instead of "…"
   if(el.scrollWidth>el.clientWidth+1){el.classList.add('pp1745-wrap');el.style.setProperty('font-size',Math.round(base*0.72)+'px','important');}
   el.dataset.pp1745=key;
  }
 }

 function tick(){
  if(root.classList.contains('pp1745-off'))return;
  const now=Date.now();
  const byId=new Map(orders().map(o=>[String(o.id),o]));
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const o=byId.get(card.dataset.orderId);if(!o)continue;
   try{bar(card,o,now)}catch(_){}
   try{fold(card,o)}catch(_){}
   try{if(!card.classList.contains('pp1745-fold'))fit(card)}catch(_){}
  }
  root.classList.add('pp1745-on');
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 window.addEventListener('pp145:orders',()=>setTimeout(later,60));
 window.addEventListener('resize',later);
 setInterval(tick,5000);setTimeout(tick,300);setTimeout(tick,1200);
 window.PP1745={tick};
})();
