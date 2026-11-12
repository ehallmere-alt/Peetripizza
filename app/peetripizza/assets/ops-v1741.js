/* Peetri Pizza v17.41/17.42 (17.42: cards only, header/menu/columns untouched) — main screen like the owner's picture (12.11.2026, "Давай сделаем вот так").
 * Screen only, data untouched. Nothing removed: header buttons are hidden and reachable from the menu.
 * - header: "Kolde / Peetri Pizza" text, Ootaeg in the middle, status dot + clock + fullscreen on the right
 * - menu gets "Valmis tellimused" and "DEMO / LIVE" (they left the header)
 * - columns: "Uued" / "Valmistamisel"
 * - card: "N pitsat" in the meta row, "Alusta valmistamist" instead of "Võta vastu"
 */
(function(){
 'use strict';
 if(window.PP1741)return;
 const $q=(s,r)=>(r||document).querySelector(s);
 const qn=t=>{const m=String(t||'').match(/(\d+)/);return m?Number(m[1]):1;};

 function header(){
  const bg=$q('.topbar .brandgroup');
  if(bg&&!$q('.pp1741-brand',bg)){
   const loc=($q('.pp114-location',bg)?.textContent||'').trim();
   const nice=loc?loc.charAt(0).toUpperCase()+loc.slice(1).toLowerCase():'';
   const d=document.createElement('div');d.className='pp1741-brand';
   d.innerHTML='<strong></strong><small>Peetri Pizza</small>';
   d.firstChild.textContent=nice||'Peetri Pizza';
   if(!nice)d.lastChild.remove();
   const mb=$q('#menuBtn',bg);mb?mb.after(d):bg.append(d);
  }
  const clock=$q('#pp1722-clock');
  if(clock&&!$q('#pp1741-dot')){
   const i=document.createElement('i');i.id='pp1741-dot';i.setAttribute('aria-hidden','true');clock.before(i);
  }
  const dot=$q('#pp1741-dot');
  if(dot){
   const chip=$q('#pp160-live-chip'),mode=$q('#pp172-mode');
   const s=(chip&&chip.dataset.state)||(mode&&mode.dataset.state)||'demo';
   if(dot.dataset.state!==s){dot.dataset.state=s;dot.title=s==='live'?'LIVE ühendus':s==='demo'?'DEMO (näidisandmed)':'LIVE ühendus katkes';}
  }
  const w=$q('#pp1722-wait');
  if(w&&!$q('.pp1741-wi',w)){
   w.insertAdjacentHTML('afterbegin','<svg class="pp1741-wi" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>');
   w.insertAdjacentHTML('beforeend','<svg class="pp1741-wc" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>');
  }
 }

 function menu(){
  const nav=$q('.drawer nav');if(!nav)return;
  const anchor=$q('#pp1735-sound-nav',nav);
  if(!$q('#pp1741-ready-nav',nav)){
   const b=document.createElement('button');b.type='button';b.id='pp1741-ready-nav';b.className='navitem';
   b.innerHTML='<span aria-hidden="true">✓</span> <em>Valmis tellimused</em> <b class="pp1741-n"></b>';
   anchor?anchor.before(b):nav.append(b);
  }
  if(!$q('#pp1741-mode-nav',nav)){
   const b=document.createElement('button');b.type='button';b.id='pp1741-mode-nav';b.className='navitem';
   b.innerHTML='<span aria-hidden="true">●</span> <em class="pp1741-mt"></em>';
   anchor?anchor.before(b):nav.append(b);
  }
  const n=$q('#pp171-ready-count')?.textContent.trim()||'';
  const rn=$q('#pp1741-ready-nav .pp1741-n');if(rn&&rn.textContent!==n)rn.textContent=n;
  const live=($q('#pp172-mode')?.dataset.state||'demo')!=='demo';
  const t=live?'LIVE · vaheta DEMO peale':'DEMO · vaheta LIVE peale';
  const mt=$q('#pp1741-mode-nav .pp1741-mt');if(mt&&mt.textContent!==t)mt.textContent=t;
  const mb=$q('#pp1741-mode-nav');if(mb)mb.dataset.state=live?'live':'demo';
 }

 window.addEventListener('click',e=>{
  const t=e.target instanceof Element&&e.target.closest('#pp1741-ready-nav,#pp1741-mode-nav');if(!t)return;
  e.preventDefault();e.stopPropagation();
  try{if(typeof closeMenu==='function')closeMenu();else $q('#closeDrawer')?.click();}catch(_){}
  if(t.id==='pp1741-ready-nav'){$q('#pp171-ready')?.click();}
  else{const live=($q('#pp172-mode')?.dataset.state||'demo')!=='demo';$q('#pp172-mode button[data-mode="'+(live?'demo':'live')+'"]')?.click();}
  setTimeout(tick,300);
 },true);

 function heads(){
  for(const[sel,txt]of[['.pp1723-col-new .section-head h2','Uued'],['.pp1723-col-work .section-head h2','Valmistamisel']]){
   const h=$q('#ordersPage '+sel);if(!h)continue;
   const tn=[...h.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
   if(tn&&tn.textContent.trim()!==txt)tn.textContent=txt+' ';
  }
 }

 function cards(){
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   // N pitsat
   let pz=0,all=0;
   for(const l of card.querySelectorAll('.carditems>.product-line:not(.pp1728-moved)')){
    const q=qn(l.querySelector('.product-qty')?.textContent);all+=q;if(l.querySelector('.pp119-code'))pz+=q;
   }
   for(const l of card.querySelectorAll('.carditems>.product-line.pp1728-moved'))all+=qn(l.querySelector('.product-qty')?.textContent);
   const line=card.querySelector('.pp117-identity-line');
   if(line){
    let c=line.querySelector(':scope>.pp1741-count');
    if(!c){c=document.createElement('span');c.className='pp1741-count';line.append(c);}
    const tx=pz?pz+(pz===1?' pitsa':' pitsat'):all+(all===1?' toode':' toodet');
    if(c.textContent!==tx)c.textContent=tx;
   }
   // Alusta valmistamist
   for(const b of card.querySelectorAll('button[data-action="accept"],button[data-kitchen-action="active"]')){
    if(b.textContent.trim()==='Võta vastu'){b.textContent='Alusta valmistamist';b.classList.add('pp1741-start');}
   }
   // ⓘ moves to the end of the KARBID row so the big button has the room (same button, same handlers)
   const det=card.querySelector('.cardfoot>button.details'),bx=card.querySelector('.pp177-boxes');
   if(det&&bx){det.classList.add('pp1741-det');bx.append(det);}
   for(const b of card.querySelectorAll('.cardfoot button[data-action="done"],.cardfoot button[data-kitchen-action="done"]'))b.classList.add('pp1741-done');
  }
 }

 function tick(){
  // 17.42: header(), menu(), heads() off — owner wanted only the cards changed
  try{cards()}catch(_){}
  document.documentElement.classList.add('pp1741-on');
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 window.addEventListener('pp145:orders',later);
 try{const r=document.getElementById('ordersPage');if(r)new MutationObserver(later).observe(r,{childList:true,subtree:true});}catch(_){}
 setInterval(tick,3000);setTimeout(tick,100);setTimeout(tick,800);
 window.PP1741={tick};
})();
