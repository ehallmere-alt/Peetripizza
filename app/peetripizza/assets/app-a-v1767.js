/* Peetri Pizza: 6 scripts in one file, same run order as the separate <script> tags (tools/js-bundle.js). Do not edit; edit the sources and rebuild. */
/* == assets/header-v127.js == */
try{(function(){
/* Peetri Pizza v12.6 — fullscreen is local display only, no server writes. */
(()=>{const b=document.getElementById('pp126-fullscreen');if(!b)return;
function sync(){const active=!!document.fullscreenElement;b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',active?'Välju täisekraanilt':'Täisekraan');const span=b.querySelector('span');if(span)span.textContent=active?'Välju':'Täisekraan';}
b.addEventListener('click',async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();}else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();}else{throw Error('unsupported');}}catch(_){const toast=document.getElementById('toast');if(toast){toast.textContent='Täisekraan pole selles brauseris saadaval';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2800);}}sync();});
document.addEventListener('fullscreenchange',sync);sync();})();

/* v12.7: indicate when the statistics page is active. */
(()=>{const stats=document.querySelector('.pp126-stats-btn');if(!stats)return;
const update=()=>{const page=document.querySelector('.page.active, .page.is-active, [data-page].active');const active=!!(page&&(page.id==='statisticsPage'||page.id==='statsPage'||page.dataset.page==='statistics'));if(active)stats.setAttribute('aria-current','page');else stats.removeAttribute('aria-current');};
const target=document.querySelector('main')||document.body;
const observer=new MutationObserver(update);observer.observe(target,{subtree:true,attributes:true,attributeFilter:['class','hidden']});update();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/header-v129.js == */
try{(function(){
/* v12.9 — live workload counters derived from rendered tickets, not synthetic totals. */
(()=>{
 const newHost=document.getElementById('newOrders');
 const activeHost=document.getElementById('activeOrders');
 const newOut=document.getElementById('pp129-new-count');
 const activeOut=document.getElementById('pp129-active-count');
 const wrap=document.getElementById('pp129-workload');
 if(!newHost||!activeHost||!newOut||!activeOut||!wrap)return;
 let scheduled=false;
 const count=(host)=>host.querySelectorAll('.ordercard[data-order-id]').length;
 function update(){
   scheduled=false;
   const n=count(newHost),a=count(activeHost);
   if(newOut.textContent!==String(n))newOut.textContent=String(n);
   if(activeOut.textContent!==String(a))activeOut.textContent=String(a);
   wrap.setAttribute('aria-label',`Uued tellimused: ${n}. Valmistamisel: ${a}.`);
   wrap.classList.toggle('pp129-has-new',n>0);
 }
 function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(update);}
 const observer=new MutationObserver(queue);
 observer.observe(newHost,{childList:true});
 observer.observe(activeHost,{childList:true});
 update();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue();});
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/stats-v143.js == */
try{(function(){
/* v14.3: compact day report, preserves original print and stats calculations. */
(()=>{
const toggle=document.getElementById('pp143-toggle');
const body=document.getElementById('pp143-report-body');
const print=document.getElementById('pp105-print');
if(!toggle||!body)return;
const update=open=>{body.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Peida aruanne ▴':'Näita aruannet ▾';};
update(false);
toggle.addEventListener('click',()=>update(body.hidden));
if(print)print.addEventListener('click',()=>{
  const wasHidden=body.hidden;
  if(wasHidden)update(true);
  window.addEventListener('afterprint',()=>{if(wasHidden)update(false);},{once:true});
},true);
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/order-adapter.js == */
try{(function(){
/* Peetri Pizza Service App: browser-only read-only import adapter.
 * Never store or show customer PII, secure_id, session keys, full original payloads.
 */
(function (root) {
 'use strict';
 const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
 const statuses={new:'new',pending:'new',received:'new',sent:'new',waiting:'new',confirmed:'active',accepted:'active',preparing:'active',in_progress:'active',processing:'active',ready:'done',completed:'done',picked_up:'done',cancelled:'done',canceled:'done',declined:'done'};
 function unwrap(payload){
  if(Array.isArray(payload))return payload;
  if(!payload || typeof payload!=='object')throw Error('JSON peab olema tellimuste massiiv või tellimuste objekt.');
  const parts=Object.values(payload);
  if(parts.every(v=>v&&typeof v==='object'&&!Array.isArray(v)))return parts;
  for(const key of ['orders','data','results','items'])if(Array.isArray(payload[key]))return payload[key];
  throw Error('Tellimuste nimekirja ei leitud.');
 }
 function isoDate(value){const d=typeof value==='number'?new Date(value):new Date(value||'');return Number.isFinite(d.getTime())?d.getTime():null;}
 function sanitizeItems(o){
  // A conservative allowlist. Do not infer item text from arbitrary free-form messages.
  const input=Array.isArray(o.products)?o.products:Array.isArray(o.items)?o.items:Array.isArray(o.order_items)?o.order_items:[];
  return input.slice(0,24).map((p)=>{
    if(Array.isArray(p))return [String(p[0]??'Toode').slice(0,90),Math.max(1,Math.min(99,Number(p[1])||1))];
    if(!p||typeof p!=='object')return null;
    const name=typeof p.product_name==='string'?p.product_name:typeof p.name==='string'?p.name:typeof p.title==='string'?p.title:'Toode';
    return [name.slice(0,90),Math.max(1,Math.min(99,Number(p.quantity??p.qty??1)||1))];
  }).filter(Boolean);
 }
 function normalize(payload){
  const arr=unwrap(payload);
  if(arr.length>3000)throw Error('Liiga suur fail: kuni 3000 tellimust.');
  const out=[], seen=new Set();
  for(const [i,o] of arr.entries()){
   if(!o||typeof o!=='object'||Array.isArray(o))continue;
   const rawStatus=String(o.status??'').toLowerCase().trim();
   const status=statuses[rawStatus]||'active';
   const rawNumber=o.order_number??o.number??o.id??(i+1);
   const number=String(rawNumber).slice(0,24).replace(/[^\w.-]/g,'')||String(i+1);
   const id='preview-'+i; if(seen.has(id))continue; seen.add(id);
   const created=isoDate(o.time_confirmed??o.time_sent??o.created_at??o.created??o.date);
   const expected=isoDate(o.time_expected);
   const estimated=Math.max(1,Math.min(240,Number(o.estimated_minutes)||20));
   const safeCreated=created??Date.now();
   const minutes=expected?Math.max(1,Math.min(1440,Math.round((expected-safeCreated)/60000))):estimated;
   const serving=String(o.serving??'').toLowerCase().includes('deliver')?'delivery':'takeAway';
   out.push({id,number,status,items:sanitizeItems(o),amount:Math.max(0,Number(o.total_amount??o.amount)||0),created:safeCreated,minutes,serving,payment:String(o.payment_type??'—').slice(0,24),completed:isoDate(o.time_completed??o.time_ready)||0,preview:true});
  }
  return out;
 }
 const api={normalize};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.PeetriOrderAdapter=api;
})(typeof window!=='undefined'?window:undefined);
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/sound-v141.js == */
try{(function(){
/* Peetri Pizza v14.1 — local Web Audio notifications, never communicates with upstream API.
   v17.64: owner «эти не слышно» — new loud tones (bell, alarm, beep) in 1–3 kHz that cut through kitchen noise,
   master compressor+gain instead of the old .28 amplitude cap; old tones kept as options. */
(function(){
 'use strict';
 const AudioCtor=window.AudioContext||window.webkitAudioContext;
 const allowedTones=new Set(['bell','alarm','beep','double','classic','soft']);
 const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return v===null?fallback:v}catch(_){return fallback}};
 const TONE_KEY='pp-sound-tone-v1764';
 const state={tone:read(TONE_KEY,'bell'),volume:read('pp-sound-volume-v141',80)};
 if(!allowedTones.has(state.tone))state.tone='bell';
 state.volume=Math.max(0,Math.min(100,Number(state.volume)||0));
 let ctx=null,bus=null,needsGesture=true,failed=false,activePromise=null;
 const id=name=>document.getElementById(name);
 const enabled=()=>!!read('pp-sound-v1',false);
 const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}};
 function update(){
   const status=id('pp141-sound-status-text'),dot=id('pp141-sound-status-dot');
   const btn=id('pp141-activate-sound');
   if(!status)return;
   let message,kind;
   if(!AudioCtor){message='See brauser ei toeta Web Audio heli';kind='error';}
   else if(!enabled()){message='Heliteavitused on välja lülitatud';kind='off';}
   else if(ctx?.state==='running'){
     message=state.volume===0?'Heli aktiveeritud · helitugevus 0%':'Heli aktiveeritud · valmis uueks tellimuseks';kind='ok';
   }else if(failed){message='Heli ei käivitu · puuduta „Aktiveeri heli”';kind='warn';}
   else {message='Heli vajab üht puudutust · vali „Aktiveeri heli”';kind='warn';}
   status.textContent=message;dot.dataset.state=kind;
   if(btn){btn.disabled=!AudioCtor;btn.textContent=ctx?.state==='running'?'✓ Heli aktiivne':'▶ Aktiveeri heli';}
   const range=id('pp141-sound-volume');if(range)range.value=String(state.volume);
   const label=id('pp141-volume-value');if(label)label.textContent=state.volume+'%';
   const select=id('pp141-sound-tone');if(select)select.value=state.tone;
 }
 function unlock(){
   if(!AudioCtor){failed=true;update();return Promise.resolve(false)}
   try{
     if(!ctx){ctx=new AudioCtor();ctx.onstatechange=()=>{needsGesture=ctx.state!=='running';update()};
       try{const comp=ctx.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=6;comp.ratio.value=8;comp.attack.value=.002;comp.release.value=.15;
         const g=ctx.createGain();g.gain.value=1.6;comp.connect(g);g.connect(ctx.destination);bus=comp;}catch(_){bus=null;}}
     if(ctx.state==='running'){needsGesture=false;failed=false;update();return Promise.resolve(true)}
     // Always call resume directly from gesture event when possible.
     if(!activePromise){activePromise=ctx.resume().then(()=>{
       needsGesture=ctx.state!=='running';failed=needsGesture;update();return !needsGesture;
     }).catch(()=>{failed=true;needsGesture=true;update();return false}).finally(()=>{activePromise=null});}
     update();return activePromise;
   }catch(_){failed=true;needsGesture=true;update();return Promise.resolve(false)}
 }
 function oscillatorAt(start,hz,duration,wave,level){
   const osc=ctx.createOscillator(),env=ctx.createGain();
   osc.type=wave;osc.frequency.setValueAtTime(hz,start);
   const amplitude=Math.max(.0001,Math.min(1,level*(state.volume/100)));
   env.gain.setValueAtTime(.0001,start);
   env.gain.exponentialRampToValueAtTime(amplitude,start+.015);
   env.gain.exponentialRampToValueAtTime(.0001,start+duration);
   osc.connect(env);env.connect(bus||ctx.destination);
   osc.start(start);osc.stop(start+duration+.015);
   osc.onended=()=>{osc.disconnect();env.disconnect()};
 }
 // v17.64 bell: inharmonic partials like a counter bell, decays naturally
 function bellAt(t,hz,level){
   [[1,1,1.1],[2.76,.55,.7],[5.4,.3,.45],[8.93,.15,.3]].forEach(([m,l,d])=>{
     const osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(hz*m,t);
     const a=Math.max(.0001,Math.min(1,level*l*(state.volume/100)));
     env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(a,t+.004);env.gain.exponentialRampToValueAtTime(.0001,t+d);
     osc.connect(env);env.connect(bus||ctx.destination);osc.start(t);osc.stop(t+d+.02);osc.onended=()=>{osc.disconnect();env.disconnect()};
   });
 }
 function urgentPattern(){
   if(!ctx||ctx.state!=='running'||state.volume<=0||document.hidden)return false;
   try{const t=ctx.currentTime+.025;
     for(let i=0;i<4;i++){oscillatorAt(t+i*.16,2400,.1,'square',.55);}
     for(let i=0;i<4;i++){oscillatorAt(t+.8+i*.16,2400,.1,'square',.55);}return true;
   }catch(_){return false}
 }
 function offlinePattern(){
   if(!ctx||ctx.state!=='running'||state.volume<=0||document.hidden)return false;
   try{const t=ctx.currentTime+.025;oscillatorAt(t,880,.25,'square',.4);oscillatorAt(t+.3,587,.4,'square',.4);return true;}catch(_){return false}
 }
 function soundPattern(){
   if(!ctx||ctx.state!=='running'||state.volume<=0||document.hidden)return false;
   try{
     const t=ctx.currentTime+.025;
     if(state.tone==='bell'){bellAt(t,1320,.9);bellAt(t+.45,1320,.9);bellAt(t+.9,1760,1);}
     else if(state.tone==='alarm'){for(let i=0;i<3;i++){oscillatorAt(t+i*.5,1000,.22,'square',.5);oscillatorAt(t+i*.5+.24,1500,.22,'square',.5);}}
     else if(state.tone==='beep'){for(let i=0;i<3;i++){oscillatorAt(t+i*.3,2000,.18,'square',.55);}}
     else if(state.tone==='classic')oscillatorAt(t,820,.25,'sine',.5);
     else if(state.tone==='soft'){
       oscillatorAt(t,560,.22,'sine',.4);oscillatorAt(t+.25,710,.31,'sine',.38);
     }else{
       oscillatorAt(t,880,.17,'triangle',.6);oscillatorAt(t+.23,1100,.23,'triangle',.55);
     }
     return true;
   }catch(_){failed=true;update();return false}
 }
 // Play works after a user interaction has unlocked the persistent context.
 // Don't silently spawn a new context from polling: browsers routinely block that.
 function play(kind){
   if(!enabled()||!AudioCtor||document.hidden)return false;
   if(!ctx||ctx.state!=='running'){needsGesture=true;update();return false}
   return kind==='offline'?offlinePattern():kind==='urgent'?urgentPattern():soundPattern();
 }
 // Explicit user action: creation/resume occurs synchronously before async callbacks.
 function preview(kind){
   const task=unlock();
   task.then(ok=>{if(ok)(kind==='urgent'?urgentPattern():kind==='offline'?offlinePattern():soundPattern())});
 }
 document.addEventListener('pointerdown',e=>{
   if(!enabled()||!AudioCtor||(!needsGesture&&ctx?.state==='running'))return;
   // Enabling through the settings toggle fires change after pointerdown.
   unlock();
 },{capture:true,passive:true});
 document.addEventListener('keydown',e=>{
   if(!enabled()||!AudioCtor||e.repeat||(!needsGesture&&ctx?.state==='running'))return;
   unlock();
 },{capture:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled())update()});
 id('pp141-sound-tone')?.addEventListener('change',e=>{if(!allowedTones.has(e.target.value))return;state.tone=e.target.value;save(TONE_KEY,state.tone);update();preview()});
 id('pp141-sound-volume')?.addEventListener('input',e=>{state.volume=Math.max(0,Math.min(100,Number(e.target.value)||0));save('pp-sound-volume-v141',state.volume);update()});
 id('pp141-activate-sound')?.addEventListener('click',()=>{unlock()});
 id('pp141-test-sound')?.addEventListener('click',()=>preview());
 window.addEventListener('storage',e=>{if(['pp-sound-v1',TONE_KEY,'pp-sound-volume-v141'].includes(e.key)){
   state.tone=read(TONE_KEY,'bell');if(!allowedTones.has(state.tone))state.tone='bell';state.volume=Math.max(0,Math.min(100,Number(read('pp-sound-volume-v141',80))||0));update();
 }});
 window.PPSound={play,unlock,preview,sync:update,diagnostics:()=>({supported:!!AudioCtor,enabled:enabled(),state:ctx?.state||'not-initialized',tone:state.tone,volume:state.volume})};
 update();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/live-status-v155.js == */
try{(function(){
/* v15.5. A separate internal status layer, never an upstream Peetri Pizza write. */
(()=>{'use strict';
const endpoint='api/kitchen-status.php';
const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
let records={},connected=false, busy=false, outstanding=new Set(),lastError='';
const enabled=()=>document.body.classList.contains('live-active');
const writable=()=>enabled()&&!document.body.classList.contains('live-connection-error')&&Number(window.pp155LiveFreshAt)>0&&(Date.now()-Number(window.pp155LiveFreshAt)<30000);
const stateRank={new:0,active:1,done:2};
const hud=document.createElement('div');hud.className='pp153-hud';hud.innerHTML='<div><strong>🔒 Köögisisene olek</strong><span id="pp153-connection" role="status">Ühenduse kontroll…</span></div><p>Siin märgitud <b>Valmistamisel / Valmis</b> salvestuvad meie serverisse ja sünkroonitakse töötajate vahel. <b>KLIENT EI NÄE NEID MUUDATUSI</b> enne ametliku API kirjutusõiguse ühendamist.</p><button type="button" id="pp153-refresh">↻ Värskenda köögi olekuid</button>';
document.getElementById('ordersPage')?.querySelector('.sourcebar')?.after(hud);
const statusNode=document.getElementById('pp153-connection');
function status(message,error=false){lastError=error?message:'';statusNode.textContent=message;statusNode.dataset.error=error?'yes':'no';}
function overlay(o){
 const orig=o.status,rec=records[o.id],local=rec?.status;
 if(!local||!Object.hasOwn(stateRank,local)||!Object.hasOwn(stateRank,orig))return {...o,officialStatus:orig};
 const effective=stateRank[local]>stateRank[orig]?local:orig;
 const internal=effective!==orig;
 const prep=Number(rec.prep_until)>0&&effective!=='done'?{deadline:Number(rec.prep_until),minutes:Number(rec.prep_minutes)||o.minutes,deadlineSource:'kitchen'}:{}; // v17.37: time chosen at Võta vastu
 return {...o,...prep,officialStatus:orig,status:effective,internalStatus:internal,
  completed:internal&&effective==='done'&&rec.ready_at?Date.parse(rec.ready_at)||o.completed:o.completed};
}
window.PPKitchenStatus={overlay, ready:()=>connected&&writable(), revision:id=>records[id]?.revision||0, get:id=>records[id], pull};
async function pull(updateView=true){if(busy)return false;busy=true;
 try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('HTTP '+response.status);const data=await response.json();
  if(!data.ok||!data.records||typeof data.records!=='object'||Array.isArray(data.records))throw new Error('Vigane vastus');
  const before=JSON.stringify(records);records=data.records;connected=true;
  status('● Serveriga ühendatud · töötajate vahel sünkroonis');
  if(updateView&&before!==JSON.stringify(records)&&enabled())window.pp153UpdateKitchenUI?.();
  return true;
 }catch(e){connected=false;status('⚠ Köögi olekusünkroon ei tööta ('+e.message+')',true);return false}
 finally{busy=false;}}
const refreshBtn=document.getElementById('pp153-refresh');refreshBtn?.addEventListener('click',()=>pull());
document.addEventListener('click',async e=>{
 const button=e.target.closest('button[data-kitchen-action]');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(!writable()){status('⚠ LIVE pole aktiivne või tellimuste andmed on aegunud. Muudatust ei salvestatud.',true);return;}
 const id=button.dataset.id,next=button.dataset.kitchenAction;
 if(!id||!/^live-[a-f0-9]{24}$/.test(id)||!['active','done'].includes(next))return;
 if(!connected){status('⚠ Ühendus puudub: muudatust ei salvestatud',true);return;}
 if(outstanding.has(id))return;
 if(next==='done'&&!confirm('Kas tellimus on valmis? See muudab ainult KÖÖGI olekut, mitte kliendi tellimust.'))return;
 if(next==='active'&&records[id]?.status==='done'&&!confirm('Tühistada valmis märge? Ainult köögi olek muutub.'))return;
 const raw=window.pp153RawLiveOrders?.find(o=>o.id===id);
 if(!raw){status('⚠ Tellimust ei leitud',true);return;}
 outstanding.add(id);button.disabled=true;button.dataset.pp155Saving='yes';button.textContent='⌛ Salvestan…';
 try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({id,status:next,official_status:raw.status,expected_revision:records[id]?.revision||0,...(next==='active'&&Number.isInteger(window.PP1737?.take?.(id))?{prep_minutes:window.PP1737.last}:{})})});
  const data=await response.json();
  if(!response.ok){if(response.status===409&&data.records){records=data.records;window.pp153UpdateKitchenUI?.();throw new Error('Teine töötaja muutis tellimust. Andmed värskendatud.')}throw new Error(data.error||'HTTP '+response.status);}
  records=data.records;status('● Salvestatud köögi serverisse · kliendile EI SAADETA');window.pp153UpdateKitchenUI?.();window.dispatchEvent(new CustomEvent('pp155:status-saved',{detail:{id,status:next}}));
 }catch(error){await pull(false);status('⚠ Muudatuse vastus puudub või ebaõnnestus: '+error.message+'. Serveri olek kontrollitud; vajadusel vaata uuesti.',true);button.disabled=false;}
 finally{outstanding.delete(id);delete button.dataset.pp155Saving;window.pp153UpdateKitchenUI?.();}
},true);
window.addEventListener('pp150:live-stopped',()=>{hud.hidden=true});
window.addEventListener('pp150:live-synced',()=>{hud.hidden=false});
setInterval(()=>{if(enabled()&&!document.hidden)pull(true)},5000);
window.addEventListener('focus',()=>{if(enabled())pull(true)});
hud.hidden=true;
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
