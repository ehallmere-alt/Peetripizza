/* Peetri Pizza v17.63 — owner: ready orders (Valmis / Väljastus) in two ways, chosen in Seaded → Köök:
   "All" (as before, block under the columns) or "Veerg" (third column next to Uued / Valmistamisel;
   on a phone a third tab "Valmis" next to the Uued / Valmistamisel switch).
   Moves the existing #pp157-ready-section node only; its own scripts keep working on it. Per tablet (localStorage). */
(()=>{
 'use strict';
 if(window.pp1763)return;window.pp1763=true;
 const KEY='pp1763-valmis';
 const read=()=>{try{return localStorage.getItem(KEY)==='col'?'col':'bottom'}catch(_){return 'bottom'}};
 const save=v=>{try{localStorage.setItem(KEY,v)}catch(_){}};
 let mode=read(),col=null,home=null;
 const page=document.getElementById('ordersPage');

 function place(){
  const ready=document.getElementById('pp157-ready-section');
  const cols=page&&page.querySelector('.columns');
  if(!ready||!cols)return false;
  if(!home){home=document.createComment('pp1763-home');ready.before(home);}
  if(mode==='col'){
   if(!col){col=document.createElement('div');col.className='ordercol pp1763-col-ready';}
   if(col.parentElement!==cols)cols.append(col);
   if(ready.parentElement!==col)col.append(ready);
  }else{
   if(home.parentNode&&ready.previousSibling!==home)home.after(ready);
   col?.remove();
   if(page.dataset.pp109Tab==='ready')page.querySelector('[data-pp109-tab="new"]')?.click();
  }
  document.documentElement.classList.toggle('pp1763-col',mode==='col');
  tabs();
  return true;
 }

 /* phone: third tab next to Uued / Valmistamisel */
 function tabs(){
  const bar=page&&page.querySelector('.pp109-mobile-tabs');if(!bar)return;
  let b=bar.querySelector('.pp1763-tab');
  if(mode!=='col'){b?.remove();bar.classList.remove('pp1763-3');return;}
  if(!b){b=document.createElement('button');b.type='button';b.className='pp1763-tab';b.setAttribute('aria-pressed','false');b.innerHTML='Valmis <b id="pp1763-tab-n">0</b>';bar.append(b);}
  bar.classList.add('pp1763-3');
  const n=document.getElementById('pp158-pickup-count');const t=document.getElementById('pp1763-tab-n');
  if(t){const v=document.querySelectorAll('#pp158-pickup-rows .pp158-pickup-row').length||Number(n?.textContent)||0;if(t.textContent!==String(v))t.textContent=String(v);}
 }
 window.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('.pp1763-tab');
  if(b){e.preventDefault();e.stopPropagation();page.dataset.pp109Tab='ready';
   page.querySelectorAll('.pp109-mobile-tabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));return;}
  if(e.target.closest&&e.target.closest('[data-pp109-tab]'))page.querySelector('.pp1763-tab')?.setAttribute('aria-pressed','false');
 },true);

 /* Seaded → Köök: the switch */
 function settingsRow(){
  if(document.getElementById('pp1763-row'))return;
  const anchor=document.getElementById('pp1738-row');if(!anchor)return;
  const d=document.createElement('div');d.className='settingsrow';d.id='pp1763-row';
  d.innerHTML='<div><strong>Valmis tellimused</strong></div><div class="pp1763-seg" role="group" aria-label="Valmis tellimused"><button type="button" data-v="bottom">All</button><button type="button" data-v="col">Kolmas veerg</button></div>';
  anchor.after(d);paint();
  d.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b)return;mode=b.dataset.v;save(mode);paint();place();});
 }
 function paint(){document.querySelectorAll('#pp1763-row [data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===mode)));}

 let n=0;const t=setInterval(()=>{settingsRow();if(place()&&document.getElementById('pp1763-row')||++n>40)clearInterval(t);},500);
 setInterval(()=>{if(mode==='col')place();},2000); // ready block may be re-created; keep it in the column and the tab count fresh
})();
