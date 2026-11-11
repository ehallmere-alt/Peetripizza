/* Peetri Pizza v16.4 — UI + event handlers only; no API endpoint, write or independent poller. */
(()=>{'use strict';
const id=k=>document.getElementById(k),home=document.querySelector('#ordersPage .pp157-home-shell');
if(!home||home.dataset.pp164Ready==='1')return;
home.dataset.pp164Ready='1';document.body.classList.add('pp164-ui');
const preference='peetri-v164-ui';
const read=()=>{try{const v=JSON.parse(localStorage.getItem(preference));return v&&typeof v==='object'?v:{}}catch(_){return {}}};
const options={autoScroll:read().autoScroll===true};
const save=()=>{try{localStorage.setItem(preference,JSON.stringify(options))}catch(_){}};
// Never add a competing timer or flow engine. Native card rendering and order actions remain authoritative.
const view=id('settingsPage')?.querySelector('.pp163-pref-group');
if(view){
 const row=document.createElement('label');row.className='pp164-flow-option';
 row.innerHTML='<div><strong>Keri uue tellimuseni</strong><small>Uue LIVE-tellimuse korral vii vaade tellimuste algusesse. Vaikimisi välja lülitatud, et kokk ei kaotaks tööjärge.</small></div>';
 const checkbox=document.createElement('input');checkbox.id='pp164-autoscroll';checkbox.type='checkbox';checkbox.checked=options.autoScroll;
 checkbox.addEventListener('change',()=>{options.autoScroll=checkbox.checked;save()});row.append(checkbox);view.append(row);
}
// Audio: existing Web Audio engine has distinct new / urgent / offline patterns and native volume selector.
// Surface the existing overdue/offline preferences next to sound settings. Move nodes, never clone IDs/listeners.
const groups=[...document.querySelectorAll('#settingsPage .pp163-pref-group')];
const audio=groups.find(g=>g.querySelector('#soundToggle'));
if(audio){
 const alerts=id('pp154-alert-settings');
 if(alerts){alerts.classList.add('pp164-alert-options');alerts.hidden=false;alerts.removeAttribute('hidden');audio.append(alerts);
  const oldToggle=id('pp154-alert-toggle');if(oldToggle){oldToggle.hidden=true;oldToggle.setAttribute('aria-hidden','true');oldToggle.tabIndex=-1;}}
 const row=document.createElement('div');row.className='pp164-audio-tests';
 // Reuse existing new/urgent test button instances so their registered event handlers remain intact.
 const newTest=id('pp141-test-sound'),urgentTest=id('pp145-test-urgent');
 if(newTest){newTest.textContent='♫ Uus tellimus';row.append(newTest)}
 if(urgentTest){urgentTest.textContent='♫ Hilinenud';row.append(urgentTest)}
 const offlineTest=document.createElement('button');offlineTest.type='button';offlineTest.textContent='♫ Ühenduse viga';
 offlineTest.addEventListener('click',()=>window.PPSound?.preview('offline'));row.append(offlineTest);
 const note=document.createElement('p');note.className='pp164-sound-note';note.textContent='Helitugevus ja uue tellimuse toon kasutavad olemasolevaid seadeid. Signaalid töötavad ainult aktiveeritud heliga ja avatud vaates.';
 audio.append(row,note);
}
// Visual transition: native status actions stay exactly the same. The core owns completion and errors.
const columns=id('pp157-columns-mount');
if(columns){columns.addEventListener('click',e=>{
 const button=e.target.closest('.ordercard button[data-action],.ordercard button[data-kitchen-action]');
 if(!button||button.disabled||button.dataset.action==='details')return;
 const card=button.closest('.ordercard');if(!card)return;
 card.classList.add('pp164-action-tap');setTimeout(()=>{if(card.isConnected)card.classList.remove('pp164-action-tap')},420);
 },true)}
// Opt-in autoscroll reacts only to newly delivered LIVE orders, not every poll or local reorder.
let lastNudge=0;
window.addEventListener('pp150:live-synced',e=>{
 if(!options.autoScroll||!Number(e.detail?.newlyArrived)||document.hidden||!id('ordersPage')?.classList.contains('active'))return;
 if(document.querySelector('dialog[open]')||document.activeElement?.matches('input,textarea,select'))return;
 const now=Date.now();if(now-lastNudge<4000)return;lastNudge=now;
 const card=id('newOrders')?.querySelector('.live-just-arrived');
 if(card)card.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
});
// Precision: status is existing urgency; accessible labels must not announce every second.
const accessible=()=>{
 for(const card of document.querySelectorAll('#ordersPage .ordercard.pp117-ticket')){
  const timer=card.querySelector('.pp117-countdown');if(!timer)continue;
  const urgency=card.classList.contains('urgency-late')?'Tähtaeg ületatud':card.classList.contains('urgency-soon')?'Alla viie minuti':'Valmistamise aeg';
  if(timer.getAttribute('aria-label')!==urgency)timer.setAttribute('aria-label',urgency);
  timer.setAttribute('aria-live','off');
 }
};
const pp171Tick='[data-timer],.prep-label,[data-pp110-priority],.pp117-countdown';
// v17.1: the 1s countdown rewrites timer text only; skip those records, react to real list changes and urgency class changes.
const pp171Meaningful=records=>records.some(r=>{const t=r.target&&r.target.nodeType===1?r.target:r.target?.parentElement;if(r.type==='attributes')return !!t&&t.classList.contains('ordercard');return !(t&&t.closest&&t.closest(pp171Tick));});
for(const list of [id('newOrders'),id('activeOrders')])if(list)new MutationObserver(records=>{if(pp171Meaningful(records))accessible()}).observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
accessible();
// Connection monitor driven exclusively by the app's existing LIVE events and polling schedule.
const topbar=document.querySelector('.topbar'),warn=document.createElement('div');
warn.className='pp164-connection-warning';warn.id='pp164-connection-warning';warn.dataset.active='false';warn.setAttribute('role','alert');
const message=document.createElement('span'),retry=document.createElement('button');
retry.type='button';retry.textContent='↻ Kontrolli';retry.setAttribute('aria-label','Proovi LIVE-tellimusi uuesti laadida');
warn.append(message,retry);if(topbar)topbar.after(warn);
let received=false,last=0,failed=false,attempts=0;
const isLive=()=>document.body.classList.contains('live-active');
const paint=()=>{
 const live=isLive(),offline=navigator.onLine===false,stale=received&&Date.now()-last>30000;
 const danger=live&&(offline||failed||stale);
 warn.dataset.active=String(!!danger);
 if(!danger)return;
 const age=last?Math.max(0,Math.floor((Date.now()-last)/1000)):0;
 message.textContent=offline?'⚠ Võrguühendus puudub. Kontrolli internetti.':failed?'⚠ LIVE-ühendus katkes. Viimased tellimused võivad olla aegunud.':`⚠ LIVE-andmed pole ${age} sekundit uuenenud.`;
 retry.disabled=offline;retry.title=offline?'Internet puudub':'Uuenda LIVE olemasoleva ühenduse kaudu';
};
retry.addEventListener('click',()=>{if(!isLive()||navigator.onLine===false)return;retry.disabled=true;retry.textContent='Kontrollin…';document.dispatchEvent(new Event('pp:refresh-live'));
 // A retry can be blocked by network/auth; never claim reconnection from clicking.
 setTimeout(()=>{retry.disabled=false;retry.textContent='↻ Kontrolli';paint()},6000)});
window.addEventListener('pp150:live-synced',e=>{received=true;failed=false;attempts=0;last=Number(e.detail?.lastSuccess)||Date.now();paint()});
window.addEventListener('pp150:live-failed',e=>{failed=true;attempts=Number(e.detail?.failures)||attempts+1;paint()});
window.addEventListener('pp150:live-stopped',()=>{received=false;failed=false;last=0;attempts=0;paint()});
window.addEventListener('offline',paint);window.addEventListener('online',paint);
const liveChip=id('pp160-live-chip');if(liveChip)liveChip.title='LIVE ühenduse olek. Katkemise korral ilmub uuesti kontrollimise nupp.';
setInterval(()=>{if(!document.hidden)paint()},5000);paint();
})();
