/* Peetri Pizza v17.1 — Statistika and Valmis (N) shortcuts in the approved header.
 * Reuses existing handlers only: the drawer's Statistika item (showPage) and the native
 * #toggleHistory button. No server requests, no LIVE writes, no new state.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const right=document.querySelector('.topbar .top-right');
if(!right||$('pp171-stats'))return;
const navStats=document.querySelector('#drawer [data-page="statistics"]');
const navOrders=document.querySelector('#drawer [data-page="orders"]');
const history=$('toggleHistory'),doneCount=$('doneCount');
const icon={
 stats:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
 check:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>'
};
const mk=(id,html,label)=>{const b=document.createElement('button');b.type='button';b.id=id;b.className='pp171-head-btn';b.innerHTML=html;b.setAttribute('aria-label',label);return b};
const stats=navStats?mk('pp171-stats',icon.stats+'<span class="pp171-label">Statistika</span>','Ava statistika'):null;
const ready=history?mk('pp171-ready',icon.check+'<span class="pp171-label">Valmis</span> <b id="pp171-ready-count">0</b>','Valmis tellimused'):null;
const anchor=$('pp160-live-chip')||$('clock')||right.firstChild;
for(const b of [stats,ready])if(b)right.insertBefore(b,anchor);
const ordersActive=()=>!!$('ordersPage')?.classList.contains('active');
if(stats)stats.addEventListener('click',()=>{navStats.click();sync()});
if(ready)ready.addEventListener('click',()=>{
 const open=history.getAttribute('aria-expanded')==='true';
 if(!ordersActive()){navOrders?.click();if(!open)history.click();}
 else history.click();
 if(history.getAttribute('aria-expanded')==='true'){
  const target=$('pp157-ready-section')||$('doneOrders');
  requestAnimationFrame(()=>target?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));
 }
 sync();
});
function sync(){
 if(stats){const on=!!$('statisticsPage')?.classList.contains('active');const v=String(on);if(stats.getAttribute('aria-pressed')!==v)stats.setAttribute('aria-pressed',v);}
 if(ready){
  const n=String(Number((doneCount?.textContent||'0').match(/\d+/)?.[0]||0));
  const out=$('pp171-ready-count');if(out&&out.textContent!==n)out.textContent=n;
  const on=String(ordersActive()&&history.getAttribute('aria-expanded')==='true');
  if(ready.getAttribute('aria-pressed')!==on)ready.setAttribute('aria-pressed',on);
  const label=`Valmis tellimused: ${n}`;if(ready.getAttribute('aria-label')!==label)ready.setAttribute('aria-label',label);
 }
}
if(doneCount)new MutationObserver(sync).observe(doneCount,{childList:true,characterData:true,subtree:true});
if(history)new MutationObserver(sync).observe(history,{attributes:true,attributeFilter:['aria-expanded']});
for(const page of document.querySelectorAll('.page'))new MutationObserver(sync).observe(page,{attributes:true,attributeFilter:['class']});
sync();
})();
