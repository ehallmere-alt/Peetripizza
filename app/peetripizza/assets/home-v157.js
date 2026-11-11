/* v15.7 — One organized kitchen homepage. DOM nodes move, actions remain original. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const page=$('ordersPage');if(!page||page.dataset.pp157Home==='1')return;
page.dataset.pp157Home='1';document.body.classList.add('pp157-home');
// Purposefully reparent existing controls; do not duplicate live buttons or mutate API methods.
const home=document.createElement('div');home.className='pp157-home-shell';home.innerHTML=`
 <section class="pp157-ops" aria-label="Köögi juhtimine">
  <div class="pp157-heading"><div class="pp157-heading-left"><span class="pp157-kicker">KOLDE · PEETRI PIZZA</span><h1>Tellimused <span class="pp157-head-dot" aria-hidden="true">●</span></h1><p>Üks töölaud · uued, valmistamisel ja väljastus</p></div><div id="pp157-connection" class="pp157-connection" aria-live="polite"></div></div>
  <div class="pp157-metrics" aria-label="Tellimuste kokkuvõte">
   <div class="pp157-metric new"><span>Uued</span><strong id="pp157-total-new">0</strong></div>
   <div class="pp157-metric active"><span>Valmistamisel</span><strong id="pp157-total-active">0</strong></div>
   <div class="pp157-metric ready"><span>Valmis</span><strong id="pp157-total-ready">0</strong></div>
   <div class="pp157-metric urgent"><span>Kiire</span><strong id="pp157-total-urgent">0</strong></div>
  </div>
  <div class="pp157-fast-actions" aria-label="Kiirtoimingud"><div class="pp157-live-action" id="pp157-live-action"></div><div class="pp157-pickup-action" id="pp157-pickup-action"></div><div class="pp157-audio-action" id="pp157-audio-action"></div></div>
  <div id="pp157-alerts" class="pp157-alerts" aria-live="polite"></div>
 </section>
 <div class="pp157-list-header"><div><span class="pp157-kicker">KÖÖK · TÖÖJÄRJEKORD</span><h2>Aktiivsed tellimused</h2></div><div class="pp157-find" id="pp157-find"></div></div>
 <div id="pp157-mobile-mount"></div><div id="pp157-columns-mount"></div>
 <div id="pp157-ready-section" class="pp157-ready-section"></div>
 <details class="pp157-more" id="pp157-more"><summary><span><strong>⚙ Tööriistad ja ülevaated</strong><small>Filtrid, teavitused, LIVE diagnostika</small></span><span class="pp157-chevron" aria-hidden="true">⌄</span></summary><div class="pp157-more-content" id="pp157-more-content"></div></details>
`;
page.prepend(home);
const move=(el,dst)=>{const target=typeof dst==='string'?$(dst):dst;if(el&&target)target.appendChild(el)};
const advanced=$('pp157-more-content');
// Existing LIVE controls and hidden diagnostics retain their event handlers. The kitchen home shows orders, not engine banners.
move($('pp111-live-slot'),'pp157-live-action');
move($('toggleHistory'),'pp157-pickup-action');
move($('pp155-pickup-open'),'pp157-pickup-action');
move(page.querySelector('.pp155-audio'),'pp157-audio-action');
move(page.querySelector('.pp155-health'),advanced);
move(page.querySelector('.pp156-reconcile'),advanced);
move($('pp154-stale'),'pp157-alerts');
// Only one queue, and original history remains in normal document flow.
move(page.querySelector('.pp109-mobile-tabs'),'pp157-mobile-mount');
move(page.querySelector('.columns'),'pp157-columns-mount');
move(page.querySelector('.history-panel'),'pp157-ready-section');
// Keep the real search input immediately above the queues; the rest of its toolbar remains available below.
const search=$('orderSearch')?.closest('.order-search');move(search,'pp157-find');
// Reuse existing products/statistics navigation (the original listeners were attached during initialization).
const quick=document.createElement('div');quick.className='pp157-shortcuts';quick.innerHTML='<strong>Muud lehed</strong><button type="button" data-pp157-page="products">◫ Tooted</button><button type="button" data-pp157-page="statistics">▥ Statistika</button><a href="dough.php">▤ Taigna tellimine</a><button type="button" data-pp157-page="settings">⚙ Seaded</button>';
quick.addEventListener('click',e=>{const b=e.target.closest('[data-pp157-page]');if(b){const original=document.querySelector('#drawer [data-page="'+b.dataset.pp157Page+'"]');original?.click();}});
advanced.appendChild(quick);
// Preserve the existing fullscreen action in the advanced tools rather than the header.
move($('pp126-fullscreen'),quick);
// Move remaining status/diagnostics under expandable tools.
const leftovers=[...page.children].filter(el=>el!==home);
for(const el of leftovers)move(el,advanced);
// Move order-page ancillary controls living above the page into its expandable tools area.
move(document.querySelector('.dashboard-display-controls'),advanced);
move($('overview'),advanced);
move($('demoAdd'),advanced);
// Keep status badges tied to real state instead of maintaining a second order data model.
let scheduled=false;
function paint(){scheduled=false;
 const count=id=>{const n=Number(($(id)?.textContent||'0').trim().match(/\d+/)?.[0]||0);return Number.isFinite(n)?n:0};
 // v17.1: write only on change (prevents a once-per-second observer cascade).
 const set=(id,v)=>{const el=$(id);v=String(v);if(el&&el.textContent!==v)el.textContent=v};
 set('pp157-total-new',count('newCount'));
 set('pp157-total-active',count('activeCount'));
 set('pp157-total-ready',count('doneCount'));
 set('pp157-total-urgent',count('pp131-urgent-count'));
 const live=document.body.classList.contains('live-active')?'yes':'no',error=document.body.classList.contains('live-connection-error')?'yes':'no';
 if(home.dataset.live!==live)home.dataset.live=live;
 if(home.dataset.error!==error)home.dataset.error=error;
 const alert=$('pp154-stale');if(alert)home.classList.toggle('pp157-stale',!alert.hidden);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint)}
for(const id of ['newCount','activeCount','doneCount','pp131-urgent-count']){const el=$(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,subtree:true,characterData:true});}
new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
const stale=$('pp154-stale');if(stale)new MutationObserver(schedule).observe(stale,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('pp150:live-synced',schedule);window.addEventListener('pp150:live-failed',schedule);window.addEventListener('pp150:live-stopped',schedule);
paint();
})();
