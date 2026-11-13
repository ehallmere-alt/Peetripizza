/* Peetri Pizza v17.16 — the kitchen tablet looks after itself.
 * 2: picks up a new version by itself (reloads only when no order is in work, LIVE comes back on).
 * 3: one quiet reload at 05:00 (Tallinn) after a long day, same rules.
 * 4: daily copy of the kitchen data (api/backup.php) + "Taasta" in Seaded.
 * 5: loud warning when LIVE has not answered for 3 minutes.
 * 6: the old "Reaalsed tellimused" button is hidden (kept in the page: the DEMO|LIVE switch clicks it).
 * Only our own server is asked. Nothing is sent to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1716)return;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const say=t=>{try{window.toast?.(t)}catch(_){}};
 const csrf=()=>document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
 const pageVersion=()=>document.querySelector('meta[name="peetri-release"]')?.content||'';
 const isLive=()=>document.body.classList.contains('live-active');
 const ss={get(k){try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch(_){return null}},set(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch(_){}},del(k){try{sessionStorage.removeItem(k)}catch(_){}}};
 const ls={get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
 const num=v=>String(v||'').split('.').map(Number);
 const newer=(a,b)=>{const x=num(a),y=num(b);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0;}return false;};
 const tallinn=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const tnow=d=>{const p=Object.fromEntries(tallinn.formatToParts(d||new Date()).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,h:Number(p.hour),m:Number(p.minute)}};
 const bar=(id,cls,html)=>{const b=document.createElement('div');b.id=id;b.className='pp174-bar '+cls;b.hidden=true;b.setAttribute('role','status');b.innerHTML=html;document.body.appendChild(b);return b;};

 /* ---------- reload only when nothing is in work ---------- */
 function busyReason(){
  if(document.querySelector('#newOrders .ordercard,#activeOrders .ordercard'))return 'orders';
  if(document.querySelector('dialog[open]'))return 'dialog';
  if(!document.body.classList.contains('pp-orders-view'))return 'page';
  const a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='checkbox')return 'typing';
  if(document.querySelector('.pp174-confirm:not([hidden]),#pp1711-undo:not([hidden])'))return 'confirm';
  return '';
 }
 function reloadNow(why){
  ss.set('pp1716-resume',{live:isLive(),at:Date.now(),why});
  try{navigator.serviceWorker?.controller?.postMessage('pp-clear-shell')}catch(_){}
  setTimeout(()=>location.reload(),200);
 }
 // After our own reload: switch LIVE back on (sound needs one tap again: Chrome rule, the yellow sound bar asks for it).
 (function resume(){
  const r=ss.get('pp1716-resume');ss.del('pp1716-resume');
  if(!r||!r.live||Date.now()-Number(r.at||0)>120000)return;
  let tries=0;const t=setInterval(()=>{
   if(isLive()){clearInterval(t);return;}
   const b=document.querySelector('#pp172-mode [data-mode="live"]')||document.querySelector('button[aria-label="Laadi päris tellimused ainult lugemiseks"]');
   if(b){b.click();clearInterval(t);say('Leht uuendati · LIVE on jälle sees');}
   if(++tries>40)clearInterval(t);
  },500);
 })();

 /* ---------- 2: new version on the server ---------- */
 const upBar=bar('pp1716-update','pp174-bar-warn','<strong>Uus versioon <b id="pp1716-up-ver"></b> on paigaldatud.</strong><span>Leht uueneb ise, kui pooleli tellimusi pole.</span><button type="button" class="pp174-bar-btn" id="pp1716-up-now">⟳ Uuenda kohe</button>');
 let serverVersion='';
 async function checkVersion(){
  try{const r=await fetch('api/release.php?t='+Date.now(),{cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});
   if(!r.ok)return;const j=await r.json();if(j&&j.ok&&j.version)serverVersion=String(j.version);}catch(_){return;}
  tryUpdate();
 }
 function tryUpdate(){
  const pending=!!serverVersion&&newer(serverVersion,pageVersion());
  upBar.hidden=!pending;if(!pending)return false;
  $('pp1716-up-ver').textContent=serverVersion;
  if(!busyReason()){reloadNow('version');return true;}
  return false;
 }
 $('pp1716-up-now').addEventListener('click',e=>{e.stopPropagation();reloadNow('version-tap');});
 setTimeout(checkVersion,30000);setInterval(checkVersion,5*60000);
 setInterval(()=>{if(serverVersion)tryUpdate();},15000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkVersion();});

 /* ---------- 3: one quiet reload at 05:00 ---------- */
 const OPEN_LONG=6*3600000;
 function nightTick(at,uptime){
  const t=tnow(at);
  if(t.h!==5||t.m>=30)return false;
  if((uptime==null?performance.now():uptime)<OPEN_LONG)return false;
  if(ls.get('pp1716-night')===t.date)return false;
  if(busyReason())return false;
  ls.set('pp1716-night',t.date);reloadNow('night');return true;
 }
 setInterval(()=>nightTick(),60000);

 /* ---------- 4: daily data copy + restore in Seaded ---------- */
 let backups=[];
 const fmtAt=s=>s?new Intl.DateTimeFormat('et-EE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Tallinn'}).format(new Date(s*1000)):'—';
 const label=b=>(b.date.endsWith('-enne')?'Enne taastamist · ':'')+fmtAt(b.at)+' · '+b.files+' faili';
 function mountBackup(){
  if($('pp1716-backup'))return $('pp1716-backup');
  const panel=document.querySelector('#settingsPage .panel');if(!panel)return null;
  const box=document.createElement('div');box.id='pp1716-backup';box.className='pp1710-card pp1716-card';
  box.innerHTML='<div class="pp1710-head"><div><strong>Andmete varukoopia</strong><small>Köögi olekud, väljastus, tainas, ooteaeg, printimine ja statistika. Koopia tehakse iga päev ise, hoitakse 14 päeva.</small></div></div>'
   +'<p class="pp1716-last" id="pp1716-last">Kontrollin…</p>'
   +'<div class="pp1716-restore"><select id="pp1716-pick" aria-label="Vali koopia"></select><button type="button" class="secondary" id="pp1716-restore">↶ Taasta valitud</button></div>'
   +'<p class="pp1716-note">Taastamisel salvestatakse praegune seis enne eraldi koopiana, nii et seda saab tagasi võtta.</p>';
  const version=$('pp1710-version');
  version&&version.parentNode===panel?version.insertAdjacentElement('afterend',box):panel.appendChild(box);
  $('pp1716-restore').addEventListener('click',restore);
  return box;
 }
 function paintBackup(){
  const box=mountBackup();if(!box)return;
  const pick=$('pp1716-pick'),last=$('pp1716-last'),btn=$('pp1716-restore');
  pick.innerHTML=backups.map(b=>'<option value="'+esc(b.date)+'">'+esc(label(b))+'</option>').join('');
  const day=backups.find(b=>!b.date.endsWith('-enne'));
  last.textContent=day?'✓ Viimane koopia: '+fmtAt(day.at)+' · kokku '+backups.length:'Koopiaid veel pole.';
  btn.disabled=!backups.length;
 }
 async function loadBackups(){
  try{const r=await fetch('api/backup.php?t='+Date.now(),{cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});
   const j=await r.json();if(j&&j.ok&&Array.isArray(j.backups))backups=j.backups;else if($('pp1716-last'))$('pp1716-last').textContent='Koopiat ei saanud teha ('+esc(j&&j.error||r.status)+').';}
  catch(_){if($('pp1716-last'))$('pp1716-last').textContent='Server ei vastanud.';return;}
  paintBackup();
 }
 async function restore(){
  const date=$('pp1716-pick').value;const b=backups.find(x=>x.date===date);if(!b)return;
  if(!confirm('Taastada köögi andmed seisuga '+label(b)+'?\nPraegune seis salvestatakse enne eraldi koopiana.'))return;
  const btn=$('pp1716-restore');btn.disabled=true;
  try{const r=await fetch('api/backup.php',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf(),Accept:'application/json'},body:JSON.stringify({action:'restore',date})});
   const j=await r.json();if(!j.ok)throw new Error(j.error||'viga');
   backups=j.backups||backups;paintBackup();say('Taastatud '+j.restored+' faili · leht uueneb');setTimeout(()=>reloadNow('restore'),1200);}
  catch(e){say('Taastamine ei õnnestunud: '+e.message);btn.disabled=false;}
 }
 mountBackup();setTimeout(loadBackups,20000);setInterval(loadBackups,3*3600000);
 window.addEventListener('click',e=>{if(e.target.closest?.('[data-page="settings"],[data-go="settings"]'))setTimeout(()=>{if(!backups.length)loadBackups();else paintBackup();},50);},true);

 /* ---------- 5: LIVE silent for 3 minutes -> red bar + sound every minute ---------- */
 const SILENT_MS=180000;
 const silentBar=bar('pp1716-silent','pp174-bar-danger','<strong>⚠ LIVE ei vasta juba <b id="pp1716-silent-min">3</b> min!</strong><span>Uued tellimused ei pruugi tulla. Kontrolli internetti ja ametlikku paneeli.</span><button type="button" class="pp174-bar-btn" id="pp1716-silent-retry">↻ Proovi uuesti</button><button type="button" class="pp174-bar-btn" id="pp1716-silent-mute">🔇 10 min</button>');
 silentBar.setAttribute('role','alert');
 let lastOk=Date.now(),lastBeep=0,muteUntil=0;
 window.addEventListener('pp150:live-synced',()=>{lastOk=Date.now();silentTick();});
 window.addEventListener('pp150:live-stopped',()=>{lastOk=Date.now();silentTick();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)lastOk=Math.max(lastOk,Date.now()-SILENT_MS+20000);});
 function silentTick(at){
  const now=at||Date.now();
  const silent=isLive()&&!document.hidden&&now-lastOk>=SILENT_MS;
  silentBar.hidden=!silent;document.body.classList.toggle('pp1716-live-silent',silent);
  if(!silent)return false;
  $('pp1716-silent-min').textContent=String(Math.floor((now-lastOk)/60000));
  if(now>=muteUntil&&now-lastBeep>=60000){lastBeep=now;try{window.PPSound?.play('offline')}catch(_){}}
  return true;
 }
 $('pp1716-silent-retry').addEventListener('click',e=>{e.stopPropagation();document.dispatchEvent(new Event('pp:refresh-live'));say('Proovin LIVE-iga uuesti ühenduda…');});
 $('pp1716-silent-mute').addEventListener('click',e=>{e.stopPropagation();muteUntil=Date.now()+600000;say('Heli vaigistatud 10 min · punane riba jääb');});
 setInterval(()=>silentTick(),10000);

 /* ---------- 6: hide the duplicate "Reaalsed tellimused" button (DOM stays) ---------- */
 document.querySelector('button[aria-label="Laadi päris tellimused ainult lugemiseks"]')?.classList.add('pp1716-native-live');

 window.PP1716={busyReason,checkVersion,tryUpdate,nightTick,silentTick,loadBackups,
  _test:{setLastOk:v=>{lastOk=v;lastBeep=0;muteUntil=0},setServer:v=>{serverVersion=v},reloadNow}};
})();
