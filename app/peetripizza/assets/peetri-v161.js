/* v16.1 — Remove green operations panel; waiting time in header only. */
(()=>{'use strict';
const home=document.querySelector('#ordersPage .pp157-home-shell');
if(!home||home.dataset.pp161Ready)return;
home.dataset.pp161Ready='1';document.body.classList.add('pp161-clean');
const ops=home.querySelector('.pp157-ops');
const wait=document.getElementById('pp158-wait-select')?.closest('.pp158-wait');
const bar=document.querySelector('.topbar .top-right');
if(wait&&bar){wait.classList.add('pp161-header-wait');bar.prepend(wait);}
// Keep original functional controls and listeners available in the existing tools drawer.
const advanced=document.getElementById('pp157-more-content');
if(ops&&advanced){
 const utility=document.createElement('div');utility.className='pp161-hidden-ops';
 utility.setAttribute('aria-label','Täiendavad köögi juhtnupud');
 for(const selector of ['.pp157-fast-actions','.pp157-connection','.pp157-alerts']){
  const node=ops.querySelector(selector);if(node)utility.append(node);
 }
 advanced.prepend(utility);
 // Keep nonvisual internal counters required by existing timer/queue observers.
 const internals=document.createElement('div');internals.id='pp164-internal-counters';internals.hidden=true;internals.setAttribute('aria-hidden','true');
 for(const selector of ['.pp157-metrics','.pp158-timer-state']){const node=ops.querySelector(selector);if(node)internals.append(node)}
 advanced.append(internals);
 ops.remove();
}
})();
