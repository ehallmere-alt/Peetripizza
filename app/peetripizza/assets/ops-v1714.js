/* Peetri Pizza v17.14 — System Health 2.0, Kitchen Analytics, tablet speed mode.
 * Read-only diagnostics (own server only; the LIVE API test stays a manual button).
 * Analytics stores order id, number and times only; no customer data, no staff ratings.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csrf=()=>document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
const liveOn=()=>document.body.classList.contains('live-active');
const hm=t=>new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit'}).format(new Date(t));
const ago=ms=>{const s=Math.max(0,Math.round(ms/1000));return s<60?s+' s tagasi':s<3600?Math.round(s/60)+' min tagasi':Math.round(s/3600)+' h tagasi';};
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch(_){return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
async function getJSON(url,opt){
 const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),12000);
 try{const r=await fetch(url,Object.assign({credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:ctrl.signal},opt||{}));const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false)throw Error(j.error||('HTTP '+r.status));return j;}
 finally{clearTimeout(t);}
}

/* =====================================================================
 * 1. Signals collected while the app runs
 * ===================================================================== */
const sig={liveOk:0,liveFail:0,liveError:'',liveMs:0,liveCount:0,failStreak:0,pickupConnected:null,pickupAt:0,statusSavedAt:0,errors:0,started:Date.now()};
window.addEventListener('pp150:live-synced',e=>{const d=e.detail||{};sig.liveOk=Date.now();sig.liveMs=Number(d.requestMs)||0;sig.liveCount=Number(d.ordersCount)||0;sig.failStreak=0;});
window.addEventListener('pp150:live-failed',e=>{const d=e.detail||{};sig.liveFail=Date.now();sig.failStreak=Number(d.failures)||sig.failStreak+1;sig.liveError=String(d.error||'').slice(0,80);});
window.addEventListener('pp155:pickup-state',e=>{sig.pickupConnected=!!e.detail?.connected;sig.pickupAt=Date.now();});
window.addEventListener('pp155:status-saved',()=>{sig.statusSavedAt=Date.now();});
window.addEventListener('error',()=>{sig.errors++;});

/* =====================================================================
 * 2. System Health 2.0 (Seaded → System Health)
 * ===================================================================== */
let server=null,version=null,lastRun=0,running=false;
const S={ok:'Korras',warn:'Tähelepanu',error:'Viga',info:'Info'};
function localStorageInfo(){
 let ok=false,bytes=0;
 try{const k='pp1714-probe';localStorage.setItem(k,'1');ok=localStorage.getItem(k)==='1';localStorage.removeItem(k);for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||'';bytes+=key.length+(localStorage.getItem(key)||'').length;}}catch(_){ok=false;}
 return {ok,kb:Math.round(bytes*2/1024)};
}
async function battery(){try{if(!navigator.getBattery)return null;const b=await navigator.getBattery();return {level:Math.round(b.level*100),charging:b.charging};}catch(_){return null;}}
function compression(){
 try{const r=performance.getEntriesByType('resource').find(x=>/kitchen-release-v1[0-9]+\.css|app-v17[0-9]+\.css/.test(x.name));
  if(!r||!r.decodedBodySize)return null;
  if(!r.transferSize)return {state:'info',text:'Võetud vahemälust'};
  return r.transferSize<r.decodedBodySize*0.6?{state:'ok',text:'Sees (CSS '+Math.round(r.transferSize/1024)+' KB / '+Math.round(r.decodedBodySize/1024)+' KB)'}:{state:'warn',text:'Väljas: CSS laaditakse '+Math.round(r.transferSize/1024)+' KB. Aeglane laadimine.'};
 }catch(_){return null;}
}
function tiles(b){
 const out=[];const T=(key,title,state,main,detail)=>out.push({key,title,state,main,detail});
 // LIVE
 if(!liveOn())T('live','LIVE','info','DEMO režiim','LIVE pole sisse lülitatud');
 else if(document.body.classList.contains('live-connection-error')||sig.failStreak>=2)T('live','LIVE','error','Ühendus katkenud',(sig.liveError||'viga')+(sig.liveOk?' · viimati korras '+ago(Date.now()-sig.liveOk):''));
 else if(sig.liveOk&&Date.now()-sig.liveOk<90000)T('live','LIVE','ok','Töötab',sig.liveCount+' tellimust · '+ago(Date.now()-sig.liveOk)+(sig.liveMs?' · '+sig.liveMs+' ms':''));
 else T('live','LIVE','warn','Ootab andmeid',sig.liveOk?'viimati '+ago(Date.now()-sig.liveOk):'esimene päring pole veel lõppenud');
 // Sync between tablets (statuses + Väljastus)
 const ks=window.PPKitchenStatus;const ready=typeof ks?.ready==='function'?ks.ready():null;
 if(!liveOn())T('sync','Sünkroonimine','info','DEMO: ainult see tahvel','Staatused jagatakse tahvlite vahel LIVE režiimis');
 else if(ready===false||sig.pickupConnected===false)T('sync','Sünkroonimine','error','Tahvlid ei sünkroniseeru','Staatused või väljastus ei jõua serverisse');
 else T('sync','Sünkroonimine','ok','Staatused jagatakse',sig.statusSavedAt?'viimane salvestus '+ago(Date.now()-sig.statusSavedAt):'serveriga ühendus olemas');
 // Network
 T('net','Internet',navigator.onLine?'ok':'error',navigator.onLine?'Võrk olemas':'Võrguühendus puudub',navigator.connection?.effectiveType?'Kiirus: '+navigator.connection.effectiveType.toUpperCase():'');
 // Printer
 const pm=window.PPPrintMonitor?.status?.();
 if(!pm)T('print','Printer','warn','Pole teada','Printimise jälgimine pole laaditud');
 else{const bad=pm.bad+pm.blocked+pm.failed;
  T('print','Printer',bad||pm.queue?'warn':'ok',pm.queue?pm.queue+' tellimust ootel':bad?bad+' probleemi täna':pm.printed?'Täna '+pm.printed+' tšekki':'Täna pole prinditud',(pm.auto?'Automaatne printimine sees':'Automaatne printimine väljas')+(pm.lastError?' · '+pm.lastError:'')+(pm.serverOk===false?' · ühine logi pole kättesaadav':''));}
 // Storage
 const ls=localStorageInfo();
 if(server){const st=server.checks?.find(c=>c.key==='storage'),sz=server.checks?.find(c=>c.key==='storage_size'),dk=server.checks?.find(c=>c.key==='disk');
  const worst=[st,sz,dk,ls.ok?null:{state:'error'}].reduce((w,c)=>c&&(c.state==='error'||(c.state==='warn'&&w!=='error'))?c.state:w,'ok');
  T('storage','Salvestus',worst,st?.state==='error'?'Server ei saa salvestada':ls.ok?'Server ja tahvel korras':'Tahvli mälu ei tööta',[sz?.message,dk?.message,'Tahvlis '+ls.kb+' KB'].filter(Boolean).join(' · '));}
 else T('storage','Salvestus',ls.ok?'info':'error',ls.ok?'Tahvli mälu korras':'Tahvli mälu ei tööta','Vajuta „Kontrolli kõike”, et kontrollida serverit');
 // Version
 const meta=document.querySelector('meta[name="peetri-release"]')?.content||'?';
 if(version){const f=version.files||{};const bad=(f.missingCount||0)+(f.changedCount||0);
  T('version','Versioon',!f.checked?'warn':bad?'error':'ok','v'+meta,!f.checked?'Kontrollfail puudub':bad?(f.missingCount||0)+' faili puudu, '+(f.changedCount||0)+' muudetud':'Kõik '+(f.total||0)+' faili korras');}
 else T('version','Versioon','info','v'+meta,'Failide kontroll pärast „Kontrolli kõike”');
 // Device
 const wl=$('pp174-wakelock-state')?.textContent||'';
 const skew=server?.server_time?Math.round((Date.now()-server.server_time)/1000):null;
 const devState=(skew!==null&&Math.abs(skew)>90)||(b&&!b.charging&&b.level<20)?'warn':'ok';
 T('device','Tahvel',devState,b?(b.charging?'🔌 Laeb · ':'🔋 ')+b.level+'%':'Aku andmed puuduvad',[skew!==null?(Math.abs(skew)>90?'Kell erineb serverist '+skew+' s — taimerid võivad valetada':'Kell õige'):'',wl?'Ekraan: '+wl.replace(/^●\s*/,''):'',navigator.deviceMemory?'Mälu '+navigator.deviceMemory+' GB':''].filter(Boolean).join(' · '));
 // Page speed
 const cz=compression();
 const nav=performance.getEntriesByType('navigation')[0];
 if(cz)T('speed','Laadimiskiirus',cz.state,cz.text.split(':')[0],(cz.text.includes(':')?cz.text.split(':').slice(1).join(':').trim()+' ':'')+(nav?'Leht laaditi '+(Math.round(nav.duration/100)/10)+' s':''));
 // Server
 if(server){const e=server.checks.filter(c=>c.state==='error').length,w=server.checks.filter(c=>c.state==='warn').length;T('server','Server',e?'error':'ok',e?e+' viga':'Korras',server.checks.length+' kontrolli · '+w+' märkust (vt allpool)');}
 if(sig.errors)T('errors','Vead lehel','warn',sig.errors+' JS viga','Pärast lehe avamist. Detailid serveri vealogis.');
 return out;
}
async function renderHealth(){
 const host=document.querySelector('.pp169-health-settings');if(!host)return;
 let box=$('pp1714-health');
 if(!box){box=document.createElement('div');box.id='pp1714-health';box.className='pp1714-sh';const p=host.querySelector('p');(p||host.firstElementChild||host).insertAdjacentElement('afterend',box);}
 const list=tiles(await battery());
 const worst=list.some(t=>t.state==='error')?'error':list.some(t=>t.state==='warn')?'warn':'ok';
 const sum={ok:'✓ Kõik töötab',warn:'⚠ Mõni asi vajab tähelepanu',error:'✕ Leitud vigu — vaata punaseid kaarte'}[worst];
 const html='<div class="pp1714-sh-head"><strong>Süsteemi tervis</strong><span>'+(lastRun?'Kontrollitud '+esc(hm(lastRun)):'Kohalik ülevaade')+'</span></div><p class="pp1714-sh-summary" data-state="'+worst+'">'+esc(sum)+'</p><div class="pp1714-sh-tiles">'+
  list.map(t=>'<div class="pp1714-sh-tile" data-key="'+esc(t.key)+'" data-state="'+esc(t.state)+'"><small><span>'+esc(t.title)+'</span><span>'+esc(S[t.state]||'')+'</span></small><strong>'+esc(t.main)+'</strong>'+(t.detail?'<span>'+esc(t.detail)+'</span>':'')+'</div>').join('')+
  '</div><div class="pp1714-sh-actions"><button type="button" id="pp1714-health-run">🩺 Kontrolli kõike</button></div>';
 if(box.innerHTML!==html)box.innerHTML=html;
}
async function runHealth(){
 if(running)return;running=true;
 const b=$('pp1714-health-run');if(b){b.disabled=true;b.textContent='Kontrollin…';}
 try{const [h,v]=await Promise.allSettled([getJSON('api/system-health.php'),getJSON('api/version.php')]);
  server=h.status==='fulfilled'?h.value:null;version=v.status==='fulfilled'?v.value:null;lastRun=Date.now();
  if(!server)sig.errors+=0;
 }finally{running=false;await renderHealth();}
}
window.addEventListener('click',e=>{if(e.target.closest?.('#pp1714-health-run'))runHealth();});
const settingsOpen=()=>$('settingsPage')?.classList.contains('active');
document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="settings"]'))setTimeout(()=>{if(Date.now()-lastRun>120000)runHealth();else renderHealth();},150);});
window.PPHealth={signals:()=>({...sig}),run:runHealth,tiles:()=>tiles(null)};

/* =====================================================================
 * 3. Kitchen Analytics (Statistika)
 * ===================================================================== */
let period=read('pp1714-an-period','today');if(!['today','yesterday','7d'].includes(period))period='today';
let anData=null,anBusy=false,anAt=0;
function demoAnalytics(){
 const orders=window.pp145LatestSnapshot?.orders||[];const hours=Array(24).fill(0),prep=[],late=[];
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn'});const today=day.format(new Date());
 const hourOf=t=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Tallinn',hour:'2-digit',hourCycle:'h23'}).format(new Date(t)));
 let count=0,withDeadline=0;
 for(const o of orders){if(!o.created||day.format(new Date(o.created))!==today)continue;count++;hours[hourOf(o.created)]++;
  if(o.completed&&o.completed>o.created)prep.push((o.completed-o.created)/60000);
  if(o.deadline&&o.completed){withDeadline++;if(o.completed>o.deadline+60000)late.push({number:o.number,late_min:Math.round((o.completed-o.deadline)/60000),ready:o.completed});}}
 const avg=prep.length?Math.round(prep.reduce((a,b)=>a+b,0)/prep.length*10)/10:null;const peak=Math.max(...hours);
 return {demo:true,orders:count,prep_avg:avg,prep_median:null,prep_count:prep.length,total_avg:null,total_count:0,late:late.length,with_deadline:withDeadline,late_list:late.slice(0,10),hours,peak_hour:peak>0?hours.indexOf(peak):null};
}
async function syncLive(){
 if(!liveOn())return;
 const list=(window.pp153RawLiveOrders||[]).filter(o=>o&&/^live-[a-f0-9]{24}$/.test(o.id||'')).slice(0,200).map(o=>({id:o.id,number:String(o.number||'').replace(/[^A-Za-z0-9-]/g,'').slice(0,20),created:Number(o.created)||undefined,deadline:Number(o.deadline)||undefined}));
 if(!list.length)return;
 try{await getJSON('api/kitchen-analytics.php',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf(),Accept:'application/json'},body:JSON.stringify({action:'sync',orders:list})});}catch(_){}
}
async function loadAnalytics(force){
 if(anBusy)return;
 if(!liveOn()){anData=demoAnalytics();renderAnalytics();return;}
 if(!force&&anData&&!anData.demo&&anData.period===period&&Date.now()-anAt<60000){renderAnalytics();return;}
 anBusy=true;
 try{await syncLive();anData=await getJSON('api/kitchen-analytics.php?period='+encodeURIComponent(period));anAt=Date.now();}
 catch(e){anData={error:e.message};}
 finally{anBusy=false;renderAnalytics();}
}
function renderAnalytics(){
 const page=$('statisticsPage');if(!page)return;
 let box=$('pp1714-analytics');
 if(!box){box=document.createElement('section');box.id='pp1714-analytics';box.className='pp1714-an';box.setAttribute('aria-label','Köögi analüütika');
  const anchor=page.querySelector('.pp145-insights');if(anchor)anchor.insertAdjacentElement('beforebegin',box);else (page.querySelector('.panel')||page).append(box);}
 const d=anData;
 const tabs='<div class="pp1714-an-tabs" role="group" aria-label="Periood">'+[['today','Täna'],['yesterday','Eile'],['7d','7 päeva']].map(([k,l])=>'<button type="button" data-pp1714-period="'+k+'" aria-pressed="'+(period===k)+'"'+(!liveOn()&&k!=='today'?' disabled':'')+'>'+l+'</button>').join('')+'</div>';
 let body='';
 if(!d)body='<p class="pp1714-an-note">Laadin…</p>';
 else if(d.error)body='<p class="pp1714-an-note">Analüütikat ei õnnestunud laadida: '+esc(d.error)+'</p>';
 else{
  const tile=(l,v,h,c)=>'<div class="pp1714-an-tile'+(c?' '+c:'')+'"><small>'+esc(l)+'</small><strong>'+esc(v)+'</strong>'+(h?'<span>'+esc(h)+'</span>':'')+'</div>';
  const min=v=>v==null?'—':String(v).replace('.',',')+' min';
  const latePct=d.with_deadline?Math.round(d.late/d.with_deadline*100):null;
  body='<div class="pp1714-an-tiles">'+tile('Tellimusi',d.orders,'')+
   tile('Keskmine valmimisaeg',min(d.prep_avg),d.demo?'tellimusest valmis (DEMO)':'Võta vastu → Valmis'+(d.prep_median!=null?' · mediaan '+min(d.prep_median):''))+
   (d.demo?'':tile('Tellimusest valmis',min(d.total_avg),d.total_count?d.total_count+' tellimuse põhjal':'andmed kogunevad'))+
   tile('Hilinenud',d.late,latePct==null?'tähtaeg teadmata':latePct+'% tähtajaga tellimustest',d.late?'bad':'')+
   tile('Tipptund',d.peak_hour==null?'—':String(d.peak_hour).padStart(2,'0')+':00',d.peak_hour==null?'':d.hours[d.peak_hour]+' tellimust','')+'</div>';
  const used=d.hours.map((n,h)=>n?h:null).filter(h=>h!==null);
  const lo=Math.min(10,...used),hi=Math.max(22,...used);const max=Math.max(1,...d.hours);
  let bars='',axis='';
  for(let h=lo;h<=hi;h++){const n=d.hours[h];bars+='<div class="pp1714-an-hour'+(n&&n===max?' peak':'')+'" title="'+h+':00 · '+n+' tellimust">'+(n?'<b>'+n+'</b>':'')+'<div class="pp1714-an-bar" style="height:'+Math.round(n/max*92)+'%"></div></div>';axis+='<span>'+h+'</span>';}
  body+='<div class="pp1714-an-hours" role="img" aria-label="Koormus tundide kaupa">'+bars+'</div><div class="pp1714-an-axis">'+axis+'</div>';
  if(d.late_list?.length)body+='<ul class="pp1714-an-late">'+d.late_list.map(x=>'<li>#'+esc(x.number||'—')+' · valmis '+esc(hm(x.ready))+' · <b>+'+esc(x.late_min)+' min</b></li>').join('')+'</ul>';
  body+='<p class="pp1714-an-note">'+(d.demo?'DEMO: arvutatud ekraanil olevatest tellimustest.':'LIVE: köögi märgetest (Võta vastu, Valmis) selles rakenduses. Andmed hakkavad kogunema alates 17.14 paigaldamisest.')+' Töötajate kaupa ei mõõdeta.</p>';
 }
 const html='<div class="pp1714-an-head"><strong>Köögi analüütika</strong>'+tabs+'</div>'+body;
 if(box.innerHTML!==html)box.innerHTML=html;
}
window.addEventListener('click',e=>{const b=e.target.closest?.('[data-pp1714-period]');if(!b)return;period=b.dataset.pp1714Period;write('pp1714-an-period',period);anData=null;renderAnalytics();loadAnalytics(true);});
const statsOpen=()=>$('statisticsPage')?.classList.contains('active');
document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="statistics"],#pp171-stats'))setTimeout(()=>loadAnalytics(false),120);});
window.addEventListener('pp145:orders',()=>{if(statsOpen()&&!liveOn()){anData=demoAnalytics();renderAnalytics();}});
window.addEventListener('pp155:status-saved',()=>{if(statsOpen())setTimeout(()=>loadAnalytics(true),800);});
// Keep the server copy of LIVE times fresh even when nobody opens Statistika (status events are kept only ~400 deep).
let lastSync=0;
window.addEventListener('pp150:live-synced',()=>{if(Date.now()-lastSync>10*60000){lastSync=Date.now();syncLive().then(()=>getJSON('api/kitchen-analytics.php?period=today').catch(()=>{}));}});
window.PPAnalytics={load:loadAnalytics,demo:demoAnalytics};

/* =====================================================================
 * 4. Tablet speed mode (Seaded switch, off by default; same layout)
 * ===================================================================== */
const LITE='pp1714-lite';
function applyLite(on){document.documentElement.classList.toggle('pp1714-lite',!!on);}
applyLite(read(LITE,false)===true);
function liteRow(){
 if($('pp1714-lite-row'))return;
 const anchor=$('compactSetting')?.closest('.settingsrow');if(!anchor)return;
 const row=document.createElement('div');row.className='settingsrow';row.id='pp1714-lite-row';
 row.innerHTML='<div><strong>Tahvli kiirrežiim</strong><small>Lülitab välja hägususe, varjud ja korduvad animatsioonid. Paigutus jääb samaks. Aitab aeglasel tahvlil.</small></div><label class="switch"><input id="pp1714-lite" type="checkbox"><span></span></label>';
 anchor.insertAdjacentElement('afterend',row);
 const input=$('pp1714-lite');input.checked=read(LITE,false)===true;
 input.addEventListener('change',()=>{write(LITE,input.checked);applyLite(input.checked);if(typeof toast==='function')toast(input.checked?'Kiirrežiim sees':'Kiirrežiim väljas');});
}

function start(){liteRow();renderHealth();if(statsOpen())loadAnalytics(false);setInterval(()=>{if(!document.hidden&&settingsOpen())renderHealth();},15000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
