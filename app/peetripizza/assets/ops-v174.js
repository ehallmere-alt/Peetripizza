/* Peetri Pizza v17.4 — kitchen reliability helpers.
 * 1) Session expired banner (any api/*.php answers 401) + LIVE refresh after network/page comes back.
 * 2) Screen Wake Lock (Seaded toggle, stored in this browser only).
 * 3) "Tap to enable sound" banner while LIVE is on and the browser still blocks audio.
 * 4) Clear on-screen notice when a kitchen tap is refused because LIVE data is stale (> 30 s).
 * 5) Client error journal: JS errors only (no orders, no customer data) -> api/client-log.php.
 * Nothing here talks to peetripizza.ee and nothing here changes LIVE data.
 */
(function(){
 'use strict';
 if(window.pp174Ops)return;window.pp174Ops=true;
 const $=id=>document.getElementById(id);
 const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v===null?f:v}catch(_){return f}};
 const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
 const csrf=()=>document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
 const release=()=>document.querySelector('meta[name="peetri-release"]')?.content||'';
 const liveOn=()=>document.body.classList.contains('live-active')&&!window.pp150LiveConnecting;
 function bar(id,cls,html){
  let el=$(id);if(el)return el;
  el=document.createElement('div');el.id=id;el.className='pp174-bar '+cls;el.hidden=true;el.setAttribute('role','alert');el.innerHTML=html;
  document.body.appendChild(el);return el;
 }
 const show=(el,on)=>{if(el.hidden===on)el.hidden=!on;};

 /* ---------- 1. Session expired ---------- */
 const sessionBar=bar('pp174-session','pp174-bar-danger','<strong>Sessioon aegus</strong><span>Logi uuesti sisse, muidu uued tellimused ei tule.</span><a class="pp174-bar-btn" href="./?aegus=1">Logi sisse</a>');
 const apiUrl=u=>{try{const x=new URL(u,location.href);return x.origin===location.origin&&/\/api\/[a-z0-9-]+\.php$/i.test(x.pathname)}catch(_){return false}};
 const nativeFetch=window.fetch;
 if(typeof nativeFetch==='function'){
  window.fetch=function(input,init){
   const url=typeof input==='string'?input:(input&&input.url)||'';
   const p=nativeFetch.apply(this,arguments);
   if(apiUrl(url))p.then(r=>{if(r.status===401){show(sessionBar,true);document.body.classList.add('pp174-session-expired');}else if(r.ok&&!sessionBar.hidden){show(sessionBar,false);document.body.classList.remove('pp174-session-expired');}}).catch(()=>{});
   return p;
  };
 }
 const refreshLive=()=>{if(document.body.classList.contains('live-active'))document.dispatchEvent(new Event('pp:refresh-live'));};
 window.addEventListener('online',()=>setTimeout(refreshLive,800));
 window.addEventListener('pageshow',e=>{if(e.persisted)refreshLive();});

 /* ---------- 2. Screen Wake Lock ---------- */
 const WL_KEY='pp-wakelock-v174';
 let wlWanted=!!read(WL_KEY,true),wl=null,wlInput=null;
 const wlSupported='wakeLock' in navigator;
 async function wlAcquire(){
  if(!wlSupported||!wlWanted||document.hidden||wl)return;
  try{wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null;wlLabel();});}catch(_){wl=null;}
  wlLabel();
 }
 function wlRelease(){try{wl&&wl.release()}catch(_){}wl=null;wlLabel();}
 function wlLabel(){
  const s=$('pp174-wakelock-state');if(!s)return;
  const t=!wlSupported?'See brauser ei toeta (vaja Chrome ja https)':!wlWanted?'Välja lülitatud':wl?'● Ekraan jääb põlema':'Aktiveerub esimesel puudutusel';
  if(s.textContent!==t)s.textContent=t;
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)wlAcquire();});
 // Some browsers need a user gesture for the first request.
 document.addEventListener('pointerdown',()=>{if(wlWanted&&!wl)wlAcquire();},{passive:true});
 function wlSettings(){
  const anchor=$('pp163-display-toggle')?.closest('.pp163-pref-group')||document.querySelector('#settingsPage .pp163-pref-group');
  if(!anchor||$('pp174-wakelock'))return;
  const row=document.createElement('div');row.className='pp163-setting-row pp174-setting-row';
  row.innerHTML='<div><strong>Ekraan ei kustu</strong><small>Planšeti ekraan jääb põlema, kuni rakendus on avatud. <span id="pp174-wakelock-state"></span></small></div>';
  const label=document.createElement('label');wlInput=document.createElement('input');wlInput.type='checkbox';wlInput.id='pp174-wakelock';wlInput.checked=wlWanted;wlInput.disabled=!wlSupported;
  const words=document.createElement('span');words.textContent='Sees';label.append(wlInput,words);row.append(label);
  const display=$('pp163-display-toggle')?.closest('.pp163-setting-row');
  if(display)display.after(row);else anchor.append(row);
  wlInput.addEventListener('change',()=>{wlWanted=wlInput.checked;save(WL_KEY,wlWanted);if(wlWanted)wlAcquire();else wlRelease();});
  wlLabel();
 }

 /* ---------- 3. Sound needs a tap ---------- */
 const soundBar=bar('pp174-sound','pp174-bar-warn','<strong>🔔 Heli on vaigistatud</strong><span>Puuduta siin, et uute tellimuste heli sisse lülitada.</span><button type="button" class="pp174-bar-btn">Lülita heli sisse</button>');
 soundBar.setAttribute('role','status');
 soundBar.addEventListener('click',async()=>{try{const d=window.PPSound?.diagnostics?.();if(d&&!d.enabled)$('soundBtn')?.click();const p=window.PPSound?.unlock?.();if(p)await p;}catch(_){}soundCheck();});
 function soundCheck(){
  const d=window.PPSound?.diagnostics?.();
  const blocked=!!d&&d.supported&&d.enabled&&d.state!=='running';
  show(soundBar,blocked&&liveOn()&&sessionBar.hidden);
 }

 /* ---------- 4. Stale LIVE data: explain clearly why a tap is not saved ---------- */
 // live-status-v155.js already refuses kitchen writes when LIVE is older than 30 s (safety rule, kept).
 // Its message lives in the hidden tools block, so the cook saw nothing. Show it on screen and retry LIVE.
 const STALE_MS=30000;
 const stale=()=>{
  if(!liveOn())return false;
  if(document.body.classList.contains('live-connection-error'))return true;
  const at=Number(window.pp155LiveFreshAt)||0;return !at||Date.now()-at>=STALE_MS;
 };
 const ageText=()=>{const at=Number(window.pp155LiveFreshAt)||0;if(!at)return 'Ühendus LIVE-iga puudub.';const s=Math.round((Date.now()-at)/1000);return s<120?`Viimane uuendus ${s} s tagasi.`:`Viimane uuendus ${Math.round(s/60)} min tagasi.`};
 const dlg=document.createElement('div');dlg.id='pp174-stale';dlg.className='pp174-confirm';dlg.hidden=true;
 dlg.innerHTML='<div class="pp174-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="pp174-stale-title"><h3 id="pp174-stale-title">LIVE andmed on aegunud</h3><p id="pp174-stale-text"></p><p class="pp174-confirm-note">Muudatust ei salvestatud, et köök ei töötaks vanade andmetega. Proovin kohe uuesti ühenduda — kui LIVE on taas roheline, vajuta nuppu uuesti.</p><div class="pp174-confirm-actions"><button type="button" class="secondary" data-pp174="close">Sulge</button><button type="button" data-pp174="retry">Uuenda kohe</button></div></div>';
 document.body.appendChild(dlg);
 const closeDlg=()=>{dlg.hidden=true;};
 dlg.addEventListener('click',e=>{
  const b=e.target.closest('[data-pp174]');if(!b&&e.target!==dlg)return;
  closeDlg();if(b&&b.dataset.pp174==='retry')refreshLive();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dlg.hidden)closeDlg();});
 // window capture runs before live-status-v155's document capture handler (which stops propagation).
 window.addEventListener('click',e=>{
  const btn=e.target.closest&&e.target.closest('#ordersPage button[data-kitchen-action]');
  if(!btn||btn.disabled||!stale())return;
  e.preventDefault();e.stopImmediatePropagation();
  $('pp174-stale-text').textContent=ageText();
  dlg.hidden=false;dlg.querySelector('[data-pp174="retry"]').focus();
  refreshLive();
 },true);
 // Close the notice by itself once fresh LIVE data arrives.
 window.addEventListener('pp150:live-synced',()=>{if(!dlg.hidden){closeDlg();window.toast?.('LIVE on taas ühendatud · vajuta nuppu uuesti');}});

 /* ---------- 5. Client error journal ---------- */
 let sent=0;const seen=new Set();
 const clip=(s,n)=>String(s==null?'':s).replace(/[\u0000-\u001f]+/g,' ').slice(0,n);
 const file=u=>{try{const x=new URL(u,location.href);return x.origin===location.origin?x.pathname.split('/').pop():'external'}catch(_){return ''}};
 function report(kind,message,source,line,col,stack){
  if(sent>=10)return;
  const key=kind+'|'+message+'|'+source+'|'+line;if(seen.has(key))return;seen.add(key);sent++;
  const page=document.querySelector('.page.active,section.page:not([hidden])')?.id||'';
  const body=JSON.stringify({kind,message:clip(message,300),source:clip(file(source),80),line:Number(line)||0,col:Number(col)||0,stack:clip(stack,600),release:clip(release(),20),page:clip(page,40),mode:liveOn()?'live':'demo'});
  try{nativeFetch.call(window,'api/client-log.php',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf()},body}).catch(()=>{});}catch(_){}
 }
 window.addEventListener('error',e=>{
  if(!e||!(e.message||e.error))return; // resource load errors have no message
  if(e.message==='Script error.')return; // cross-origin, no details
  report('error',e.message,e.filename,e.lineno,e.colno,e.error&&e.error.stack);
 });
 window.addEventListener('unhandledrejection',e=>{
  const r=e&&e.reason;if(r&&r.name==='AbortError')return;
  report('promise',r&&r.message||String(r),r&&r.fileName||'',0,0,r&&r.stack);
 });
 window.pp174Report=(m)=>report('manual',m,'',0,0,'');

 /* ---------- v17.5: header Ooteaeg follows the server value ---------- */
 // header-v115.js reloads the wait time every 12 s but sets the hidden original <select> without a change
 // event, so the visible header copy (#pp158-wait-select) kept the old value when another tablet changed it.
 document.addEventListener('peetri:wait-time-change',e=>{
  const v=String(e.detail&&e.detail.minutes||'');const s=$('pp158-wait-select');
  if(s&&v&&s.value!==v&&document.activeElement!==s&&[...s.options].some(o=>o.value===v))s.value=v;
 });

 /* ---------- start ---------- */
 function start(){wlSettings();wlAcquire();soundCheck();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 setInterval(soundCheck,2000);
 window.addEventListener('pp150:live-synced',soundCheck);
 document.addEventListener('pointerdown',()=>setTimeout(soundCheck,300),{passive:true});
})();
