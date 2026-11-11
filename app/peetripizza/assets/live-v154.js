/* Peetri Pizza 15.4: diagnostics + guarded alert preferences + disabled customer bridge.
   No new Peetri Pizza upstream writes. Uses existing LIVE polling events. */
(()=>{'use strict';
const $=id=>document.getElementById(id),base=document.getElementById('ordersPage');if(!base)return;
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let prefs=get('pp154-alert-prefs',{overdue:true,offline:true}),everConnected=false,down=false,lastSuccess=0,latency=null,failures=0,baseline=false;
let state=new Map(),lastUrgentSound=0;
const box=document.createElement('section');box.className='pp154-sync';box.setAttribute('aria-label','LIVE sünkroonimise seis');
box.innerHTML=`<div class="pp154-sync-top"><div><strong>LIVE ühendus <span id="pp154-led" data-state="demo">●</span></strong><small id="pp154-sync-message">LIVE pole käivitatud</small></div><div class="pp154-sync-actions"><button id="pp154-refresh" type="button">↻ Kontrolli</button><button id="pp154-alert-toggle" type="button" aria-expanded="false">♫ Hoiatused</button></div></div>
<div id="pp154-stale" class="pp154-stale" hidden role="alert"><strong>⚠ LIVE-andmed ei ole värsked</strong><p>Viimased tellimused võivad olla vananenud. Kontrolli tellimusi ametlikust süsteemist. Köögisiseste olekute muutmine pole lubatud.</p></div>
<div id="pp154-alert-settings" class="pp154-alert-settings" hidden><label><input id="pp154-overdue-alert" type="checkbox"> Üle aja läinud tellimuse heli (üks kord)</label><label><input id="pp154-offline-alert" type="checkbox"> Ühenduse katkemise heli (üks kord)</label><p>Uue tellimuse heli juhitakse olemasoleva ♫ nupuga. iPad vajab heli aktiveerimiseks puudutust.</p></div>
<details class="pp154-diagnostics"><summary>Ühenduse üksikasjad · klienditeavitused</summary><div class="pp154-sync-stats"><span>Viimati: <b id="pp154-last">—</b></span><span>Vastus: <b id="pp154-latency">—</b></span><span>Tõrked: <b id="pp154-fails">0</b></span><span>Staatus: <b id="pp154-official">Ainult lugemine</b></span></div>
<div class="pp154-bridge"><div><strong>🔒 Klienditeavituste ühendus</strong><small id="pp154-bridge-status">Ametliku API kirjutusõigus kontrollimata · kliendid ei näe köögisiseseid olekuid.</small></div><button id="pp154-bridge-check" type="button">Kontrolli valmidust</button></div></details>`;
const tools=base.querySelector('.worktools');(tools||base).after(box);
const fmt=ms=>new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Tallinn'}).format(new Date(ms));
const isLive=()=>document.body.classList.contains('live-active');
const age=()=>lastSuccess?Date.now()-lastSuccess:Infinity;
function repaint(){const live=isLive(),stale=live&&(down||age()>30000);
 $('pp154-led').dataset.state=!live?'demo':stale?'error':'ok';
 $('pp154-sync-message').textContent=!live?'DEMO · Ühenda reaalsete tellimustega':stale?'LIVE · andmed aegunud':'LIVE · ühendatud';
 $('pp154-last').textContent=lastSuccess?fmt(lastSuccess):'—';
 $('pp154-latency').textContent=latency===null?'—':latency+' ms';
 $('pp154-fails').textContent=String(failures);
 $('pp154-stale').hidden=!stale;
 $('pp154-official').textContent='Ainult lugemine';
}
const sound=k=>{if(document.hidden)return false;return !!window.PPSound?.play(k)};
$('pp154-refresh').addEventListener('click',()=>document.dispatchEvent(new Event('pp:refresh-live')));
$('pp154-alert-toggle').addEventListener('click',()=>{const panel=$('pp154-alert-settings');panel.hidden=!panel.hidden;$('pp154-alert-toggle').setAttribute('aria-expanded',String(!panel.hidden))});
$('pp154-overdue-alert').checked=prefs.overdue!==false;
$('pp154-offline-alert').checked=prefs.offline!==false;
for(const [id,field] of [['pp154-overdue-alert','overdue'],['pp154-offline-alert','offline']]){
 $(id).addEventListener('change',e=>{prefs[field]=e.target.checked;set('pp154-alert-prefs',prefs)});
}
$('pp154-bridge-check').addEventListener('click',async()=>{const p=$('pp154-bridge-status');p.textContent='Kontrollimine…';try{const r=await fetch('api/customer-bridge.php',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();p.textContent=j.can_write?'Kirjutusrežiim vajab veel klienditesti':'Väljalülitatud: ametliku API kirjutusleping ja klienditest puuduvad.';}catch(_){p.textContent='Valmiduse kontroll ebaõnnestus; klienditeavitused jäävad väljalülitatuks.'}});
window.addEventListener('pp150:live-synced',e=>{everConnected=true;down=false;lastSuccess=Number(e.detail?.lastSuccess)||Date.now();latency=Number.isFinite(e.detail?.requestMs)?e.detail.requestMs:null;failures=0;repaint()});
window.addEventListener('pp150:live-failed',e=>{const wasDown=down;down=true;failures=Number(e.detail?.failures)||failures+1;
 if(everConnected&&!wasDown&&prefs.offline) sound('offline');repaint()});
window.addEventListener('pp150:live-stopped',()=>{everConnected=false;down=false;lastSuccess=0;latency=null;failures=0;baseline=false;state.clear();repaint()});
window.addEventListener('pp145:orders',e=>{if(e.detail?.source!=='LIVE'||document.body.classList.contains('live-connection-error'))return;
 const now=Date.now(),next=new Map();let crossed=false;
 for(const o of e.detail.orders||[]){if(!['new','active'].includes(o.status))continue;
  const deadline=Number(o.deadline)>0?Number(o.deadline):(Number(o.created)+Number(o.minutes)*60000);
  if(!Number.isFinite(deadline)||deadline<=0)continue;
  const late=deadline<=now;next.set(String(o.id),late);
  if(baseline&&late&&state.get(String(o.id))===false)crossed=true;
 }
 state=next;
 if(!baseline){baseline=true;return}
 if(crossed&&prefs.overdue&&now-lastUrgentSound>30000){sound('urgent');lastUrgentSound=now}
});
window.addEventListener('offline',()=>{if(isLive()){down=true;repaint()}});
window.addEventListener('online',()=>{if(isLive())document.dispatchEvent(new Event('pp:refresh-live'))});
setInterval(repaint,5000);repaint();
})();
