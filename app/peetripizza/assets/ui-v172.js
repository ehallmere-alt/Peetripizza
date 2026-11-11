/* Peetri Pizza v17.2 — DEMO / LIVE switch in the header + small consistency fixes.
 * The switch only clicks the ORIGINAL read-only LIVE button (same handler as "Reaalsed tellimused"),
 * so LIVE stays read-only and the existing polling/backoff logic is untouched.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const right=document.querySelector('.topbar .top-right');
const native=document.querySelector('button[aria-label="Laadi päris tellimused ainult lugemiseks"]');
if(right&&native&&!$('pp172-mode')){
 const wrap=document.createElement('div');wrap.id='pp172-mode';wrap.className='pp172-mode';wrap.setAttribute('role','group');wrap.setAttribute('aria-label','Andmeallikas');
 wrap.innerHTML='<button type="button" data-mode="demo">DEMO</button><button type="button" data-mode="live"><i aria-hidden="true"></i>LIVE</button>';
 const anchor=$('pp160-live-chip')||$('clock');right.insertBefore(wrap,anchor);
 const isLive=()=>document.body.classList.contains('live-active');
 let busy=false;
 wrap.addEventListener('click',e=>{
  const b=e.target.closest('button[data-mode]');if(!b||busy)return;
  // Phones show one pill: tapping it always toggles.
  const compact=getComputedStyle(wrap).getPropertyValue('--pp172-compact').trim()==='1';
  const want=compact?(isLive()?'demo':'live'):b.dataset.mode;
  if((want==='live')===isLive())return;
  busy=true;native.click();setTimeout(()=>{busy=false;sync()},400);
 });
 function sync(){
  const live=isLive(),err=live&&document.body.classList.contains('live-connection-error');
  const state=!live?'demo':err?'error':(window.pp150LiveConnecting?'pending':'live');
  if(wrap.dataset.state!==state)wrap.dataset.state=state;
  for(const b of wrap.querySelectorAll('button')){const on=String((b.dataset.mode==='live')===live);if(b.getAttribute('aria-pressed')!==on)b.setAttribute('aria-pressed',on)}
  const label=({demo:'Näidisandmed (DEMO). Vajuta LIVE, et laadida päris tellimused ainult lugemiseks.',live:'LIVE: päris tellimused, ainult lugemiseks',pending:'LIVE: ühendan…',error:'LIVE ühendus katkes — näidatakse viimaseid teadaolevaid tellimusi'})[state];
  if(wrap.title!==label)wrap.title=label;
 }
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 for(const ev of ['pp150:live-synced','pp150:live-failed','pp150:live-stopped'])window.addEventListener(ev,sync);
 sync();
}
// v17.3: full-screen button in the header (the old "Ekraanirežiim" row is hidden). Browser fullscreen only, no server calls.
if(right&&!$('pp173-fullscreen')){
 const root=document.documentElement;
 const req=root.requestFullscreen||root.webkitRequestFullscreen;
 const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
 const exit=()=>(document.exitFullscreen||document.webkitExitFullscreen)?.call(document);
 const fb=document.createElement('button');fb.type='button';fb.id='pp173-fullscreen';fb.className='pp171-head-btn pp173-fs';
 fb.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path class="pp173-in" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><path class="pp173-out" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
 const anchor=$('clock')||right.lastChild;right.insertBefore(fb,anchor);
 const toast=msg=>{const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)};
 const syncFs=()=>{const on=!!fsEl();fb.setAttribute('aria-pressed',String(on));const l=on?'Välju täisekraanilt':'Täisekraan';fb.setAttribute('aria-label',l);fb.title=l};
 fb.addEventListener('click',async()=>{
  try{if(fsEl())await exit();else if(req)await req.call(root);else throw Error('unsupported')}
  catch(_){toast('Täisekraan pole selles brauseris saadaval. Kasuta brauseri menüüd „Lisa avaekraanile”.')}
  syncFs();
 });
 document.addEventListener('fullscreenchange',syncFs);document.addEventListener('webkitfullscreenchange',syncFs);syncFs();
}
// Header sub-label still said "v16".
const sub=document.querySelector('.topbar .pp160-brand-sub small');if(sub&&/v16/.test(sub.textContent))sub.textContent='KÖÖGI TÖÖLAUD';
})();
