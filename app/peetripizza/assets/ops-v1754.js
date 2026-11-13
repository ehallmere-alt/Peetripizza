/* Peetri Pizza v17.54 — owner, 12.11.2026:
 * 1) toppings: not wanted = red "−", added = green "+" (ops-v1728 already sorts chips into pp1728-minus / pp1728-plus;
 *    17.41 CSS had hidden the signs). Here: "Ilma: sibul" (from api/live-normalize) → "SIBUL" in a red "−" chip, "ILMA JUUSTUTA" → "JUUST".
 * 2) Ooteaeg in the header: "−" and "+" step through the same select (pp158-wait-select) that ops-v1722 uses. */
(function(){
 'use strict';
 if(window.PP1754)return;
 const $=id=>document.getElementById(id);
 function extras(root){
  // "+ LISA" extras sat in their own grid cell (squeezed under the qty); put them next to the other chips as green "+".
  for(const x of (root||document).querySelectorAll('#ordersPage .pp177-extras:not(.pp1754-moved)')){
   const host=x.parentElement;if(!host)continue;
   let mods=host.querySelector(':scope>.pp177-mods');
   if(!mods){mods=document.createElement('span');mods.className='pp94-specs pp177-mods';x.before(mods);}
   for(const e of x.querySelectorAll('em')){const c=document.createElement('em');c.className='pp177-mod pp1728-plus';c.dataset.pp1754='1';c.textContent=(e.textContent||'').trim();if(c.textContent)mods.append(c);}
   x.classList.add('pp1754-moved');
  }
 }
 function chips(root){
  try{extras(root)}catch(_){}
  for(const m of (root||document).querySelectorAll('.pp177-mod:not([data-pp1754])')){
   const t=(m.textContent||'').trim();
   let x=t.match(/^(ilma|without)\s*:\s*(.+)$/i);
   if(x){m.textContent=x[2].trim();m.classList.add('pp1728-minus');m.classList.remove('pp1728-plus');}
   else if(/^ilma juustuta$/i.test(t)){m.textContent='Juust';m.classList.add('pp1728-minus');m.classList.remove('pp1728-plus');}
   else if((x=t.match(/^(lisa|extra)\s*:\s*(.+)$/i))){m.textContent=x[2].trim();m.classList.add('pp1728-plus');m.classList.remove('pp1728-minus');}
   m.dataset.pp1754='1';
  }
 }
 // Ooteaeg − / +
 const sel=()=>$('pp158-wait-select')||$('pp114-wait-select');
 function mountWait(){
  // − and + sit right next to the Ooteaeg button (ops-v1722 may move that button, so re-place them when needed)
  const w=$('pp1722-wait');if(!w||!w.parentNode)return;
  const mk=(id,t,l)=>{let b=$(id);if(!b){b=document.createElement('button');b.type='button';b.id=id;b.className='pp1754-wstep';b.textContent=t;b.setAttribute('aria-label',l);}return b;};
  const mi=mk('pp1754-wminus','−','Ooteaeg vähem'),pl=mk('pp1754-wplus','+','Ooteaeg rohkem');
  if(w.previousElementSibling!==mi)w.before(mi);
  if(w.nextElementSibling!==pl)w.after(pl);
  w.classList.add('pp1754-wmid');
 }
 function step(d){
  const s=sel();if(!s)return;const i=s.selectedIndex+d;if(i<0||i>=s.options.length)return;
  s.selectedIndex=i;s.dispatchEvent(new Event('change',{bubbles:true}));
  const o=s.options[i];const v=$('pp1722-wait-v');if(v&&o)v.textContent=o.textContent.trim();
  try{window.toast?.('Ooteaeg '+s.value+' min')}catch(_){}
 }
 window.addEventListener('click',e=>{
  const b=e.target instanceof Element&&e.target.closest('#pp1754-wminus,#pp1754-wplus');if(!b)return;
  e.preventDefault();e.stopPropagation();step(b.id==='pp1754-wplus'?1:-1);
 },true);
 // Väljastus block on the main screen: only when something waits
 function pickup(){
  const q=$('pp158-pickup-quick');if(!q)return;
  const n=document.querySelectorAll('#pp1711-pickup article').length;
  q.classList.toggle('pp1754-empty',n===0);
 }
 let queued=false;const later=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{chips()}catch(_){}try{mountWait()}catch(_){}try{pickup()}catch(_){}});};
 const go=()=>{later();try{new MutationObserver(later).observe(document.body,{childList:true,subtree:true});}catch(_){}};
 window.addEventListener('pp145:orders',later);
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
 window.PP1754={chips,step};
})();
