/* Peetri Pizza v17.14 — Smart Print Monitor.
 * Shared print log (api/print-log.php) so two tablets never auto-print the same order,
 * a question before a manual duplicate, a "did the ticket come out?" bar and a clear
 * alert when the browser blocks printing. Stores no customer data, sends nothing to peetripizza.ee.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csrf=()=>document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
const ID_RE=/^(?:live-[a-f0-9]{24}|demo-[a-z0-9-]{1,24})$/;
const hm=t=>{const d=new Date(t);return isNaN(d)?'—':new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit'}).format(d);};
const dayKey=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn'}).format(new Date(t));
function device(){
 let d='';try{d=localStorage.getItem('pp1714-device')||'';}catch(_){}
 if(!/^Tahvel [a-f0-9]{4}$/.test(d)){d='Tahvel '+Math.random().toString(16).slice(2,6).padEnd(4,'0');try{localStorage.setItem('pp1714-device',d);}catch(_){}}
 return d;
}
const DEV=device();
const log=new Map();let lastLoad=0,serverOk=null,loading=null;
const local={blocked:0,failed:0,lastError:'',lastOk:0};
const KINDS={auto:'automaatne',manual:'käsitsi',copy:'koopia',retry:'kordusprint'};
const OUT={dialog:'dialoog avatud',confirmed:'tuli välja ✓',failed:'ebaõnnestus',blocked:'blokeeritud'};

async function api(body){
 const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),8000);
 try{
  const r=await fetch('api/print-log.php',body?{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf(),Accept:'application/json'},body:JSON.stringify(body),signal:ctrl.signal}:{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:ctrl.signal});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.ok)throw Error(j.error||('HTTP '+r.status));
  serverOk=true;return j;
 }catch(e){serverOk=false;throw e;}finally{clearTimeout(t);}
}
function remember(rec){if(rec&&rec.order)log.set(rec.order,rec);render();}
async function load(force){
 if(loading)return loading;
 if(!force&&Date.now()-lastLoad<15000)return;
 loading=api(null).then(j=>{log.clear();for(const r of j.orders||[])log.set(r.order,r);lastLoad=Date.now();render();}).catch(()=>render()).finally(()=>{loading=null;});
 return loading;
}
function post(body){return api(Object.assign({device:DEV},body)).then(j=>{remember(j.record);return j;});}

/* ---------- dialog: duplicate question ---------- */
function dialog(){
 let d=$('pp1714-print-dialog');if(d)return d;
 d=document.createElement('dialog');d.id='pp1714-print-dialog';d.className='pp1714-dialog';
 d.innerHTML='<h3 id="pp1714-pd-title"></h3><p id="pp1714-pd-text"></p><div class="pp1714-pd-actions"><button type="button" class="secondary" id="pp1714-pd-no">Loobu</button><button type="button" id="pp1714-pd-yes">⎙ Prindi koopia</button></div>';
 document.body.append(d);return d;
}
function ask(title,text,yes){
 const d=dialog();$('pp1714-pd-title').textContent=title;$('pp1714-pd-text').textContent=text;$('pp1714-pd-yes').textContent=yes;
 return new Promise(res=>{
  const done=v=>{d.removeEventListener('close',onClose);$('pp1714-pd-yes').onclick=$('pp1714-pd-no').onclick=null;try{d.close()}catch(_){}res(v);};
  const onClose=()=>done(false);
  $('pp1714-pd-yes').onclick=()=>done(true);$('pp1714-pd-no').onclick=()=>done(false);d.addEventListener('close',onClose);
  try{d.showModal()}catch(_){d.setAttribute('open','')}
 });
}

/* ---------- bottom bar: result question and alerts ---------- */
let barTimer=0;
function bar(html,cls,ms){
 let b=$('pp1714-print-bar');
 if(!b){b=document.createElement('div');b.id='pp1714-print-bar';b.setAttribute('role','status');document.body.append(b);}
 b.className='pp1714-bar '+(cls||'');b.innerHTML=html;b.hidden=false;
 clearTimeout(barTimer);if(ms)barTimer=setTimeout(()=>{b.hidden=true;},ms);
 return b;
}
function hideBar(){const b=$('pp1714-print-bar');if(b)b.hidden=true;clearTimeout(barTimer);}
let pending=null; // the print waiting for "did it come out?"
function askResult(details,kind){
 pending={details,kind};
 bar('<span>🖨 #'+esc(details.number)+' — kas tšekk tuli printerist välja?</span><button type="button" data-pp1714="ok">✓ Jah</button><button type="button" data-pp1714="again">⟳ Ei, prindi uuesti</button><button type="button" class="x" data-pp1714="close" aria-label="Sulge">✕</button>','ask',45000);
}
function alertBlocked(details,kind){
 local.blocked++;local.lastError='Brauser blokeeris printimise';
 pending={details,kind};
 bar('<span>⚠ Printimine blokeeriti (#'+esc(details.number)+'). Luba brauseris hüpikaknad sellele saidile.</span><button type="button" data-pp1714="now">⎙ Prindi nüüd</button><button type="button" class="x" data-pp1714="close" aria-label="Sulge">✕</button>','bad',0);
 render();
}
// A tap in the bar is a user gesture, so the browser allows the print window.
window.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-pp1714]');if(!b||!b.closest('#pp1714-print-bar'))return;
 e.preventDefault();e.stopImmediatePropagation();
 const act=b.dataset.pp1714,p=pending;hideBar();pending=null;
 if(!p||act==='close')return;
 if(act==='ok'){if(ID_RE.test(p.details.id||''))post({action:'outcome',order:p.details.id,outcome:'confirmed'}).catch(()=>{});local.lastOk=Date.now();render();return;}
 if(act==='again'){
  if(ID_RE.test(p.details.id||''))post({action:'outcome',order:p.details.id,outcome:'failed'}).catch(()=>{});
  window.PPPrint169?.print(p.details,'retry');return;
 }
 if(act==='now'){window.PPPrint169?.print(p.details,p.kind==='auto'?'manual':p.kind);}
},true);

/* ---------- API used by print-v169.js ---------- */
window.PPPrintMonitor={
 device:DEV,
 record(id){return log.get(id)||null;},
 // Manual print from the order window: ask first when this order was printed already.
 async manual(details,go){
  const rec=log.get(details.id);
  if(rec&&rec.count>0){
   const ok=await ask('Juba prinditud','Tellimus #'+(details.number||'')+' on prinditud '+rec.count+'× (viimati '+hm(rec.last_at)+', '+rec.last_device+'). Kas printida koopia?','⎙ Prindi koopia');
   if(ok)go('copy');return;
  }
  go('manual');
 },
 // Auto print: only the first tablet that claims the order prints it.
 async claimAuto(o){
  if(!o||!ID_RE.test(o.id||''))return false;
  try{const j=await post({action:'claim',order:o.id,number:String(o.number||'').replace(/[^A-Za-z0-9-]/g,'').slice(0,20),kind:'auto'});return j.claimed===true;}
  catch(_){return true;} // server unreachable: a double ticket is better than a missing one
 },
 opened(details,kind,w){
  local.lastOk=Date.now();
  const id=details&&details.id;
  if(ID_RE.test(id||'')&&kind!=='auto'&&kind!=='test')post({action:'claim',order:id,number:String(details.number||'').replace(/[^A-Za-z0-9-]/g,'').slice(0,20),kind}).catch(()=>{});
  if(kind==='test')return;
  let asked=false;const later=()=>{if(asked)return;asked=true;askResult(details,kind);};
  try{w.addEventListener('afterprint',()=>setTimeout(later,300));}catch(_){}
  setTimeout(()=>{try{if(w.closed)later();}catch(_){later();}},20000);
 },
 failed(details,kind,why){
  const id=details&&details.id;
  if(ID_RE.test(id||'')&&kind==='auto')post({action:'outcome',order:id,outcome:why==='blocked'?'blocked':'failed'}).catch(()=>{});
  if(why==='blocked')alertBlocked(details,kind);else{local.failed++;local.lastError='Printimist ei saanud käivitada';render();}
 },
 status(){
  const today=dayKey(Date.now());let printed=0,copies=0,bad=0,last=null;
  for(const r of log.values()){for(const p of r.prints||[]){if(!p.at||dayKey(p.at)!==today)continue;if(p.outcome==='blocked'||p.outcome==='failed')bad++;else{printed++;if(p.kind==='copy'||p.kind==='retry')copies++;}if(!last||p.at>last.at)last={...p,number:r.number};}}
  return {printed,copies,bad,last,queue:window.PPPrint169?.pendingCount?.()||0,serverOk,blocked:local.blocked,failed:local.failed,lastError:local.lastError,auto:!!$('pp169-auto-print')?.checked,device:DEV};
 },
 refresh(){return load(true);}
};

/* ---------- Seaded panel ---------- */
function panel(){
 let p=$('pp1714-print-monitor');if(p)return p;
 const anchor=$('pp169-print-status');if(!anchor)return null;
 p=document.createElement('div');p.id='pp1714-print-monitor';p.className='pp1714-pm';anchor.insertAdjacentElement('afterend',p);
 return p;
}
function render(){
 const p=panel();if(!p)return;
 const s=window.PPPrintMonitor.status();
 const tile=(l,v,h,c)=>'<div class="pp1714-pm-tile'+(c?' '+c:'')+'"><small>'+esc(l)+'</small><strong>'+esc(v)+'</strong>'+(h?'<span>'+esc(h)+'</span>':'')+'</div>';
 const rows=[...log.values()].sort((a,b)=>String(b.last_at).localeCompare(String(a.last_at))).slice(0,8).map(r=>'<li><b>#'+esc(r.number||'—')+'</b> '+esc(hm(r.last_at))+' · '+esc(KINDS[r.last_kind]||r.last_kind)+' · '+esc(OUT[r.last_outcome]||r.last_outcome||'')+' · '+esc(r.last_device)+(r.count>1?' · <em>'+esc(r.count)+'×</em>':'')+'</li>').join('');
 const html='<div class="pp1714-pm-head"><strong>Printimise jälgimine</strong><span>'+esc(s.device)+' · '+(s.serverOk===false?'logi pole kättesaadav':'ühine logi kõigile tahvlitele')+'</span></div>'+
  '<div class="pp1714-pm-tiles">'+tile('Täna prinditud',s.printed,s.copies?s.copies+' koopiat':'')+tile('Ootel',s.queue,s.queue?'vajuta „Prindi ootel tellimused”':'',s.queue?'warn':'')+tile('Probleemid täna',s.bad+s.blocked+s.failed,s.lastError||'',s.bad+s.blocked+s.failed?'bad':'')+tile('Viimane print',s.last?hm(s.last.at):'—',s.last?'#'+s.last.number+' · '+s.last.device:'')+'</div>'+
  '<div class="pp1714-pm-actions"><button type="button" class="secondary" id="pp1714-test-print">🧾 Testi printerit</button><button type="button" class="secondary" id="pp1714-print-refresh">↻ Värskenda logi</button></div>'+
  (rows?'<ul class="pp1714-pm-list">'+rows+'</ul>':'<p class="pp1714-pm-empty">Viimase 36 tunni jooksul pole midagi prinditud.</p>')+
  '<small>Automaatset printimist teeb ainult üks tahvel: kes tellimuse esimesena võtab. Käsitsi uuesti printides küsitakse enne üle ja tšekile kirjutatakse KOOPIA.</small>';
 if(p.innerHTML!==html)p.innerHTML=html;
}
window.addEventListener('click',e=>{
 if(e.target.closest?.('#pp1714-print-refresh')){load(true);return;}
 if(e.target.closest?.('#pp1714-test-print')){
  const now=Date.now();
  window.PPPrint169?.print({id:'',number:'TEST',created:now,deadline:now+20*60000,customerName:'Testprint',items:[['Margherita (large) — Põhi: thin',1],['Vesi',2]],note:'Kui see tšekk tuli välja, printer töötab.'},'test');
 }
});

/* ---------- order window: "printed 2× · 14:05" next to the print button ---------- */
function infoLine(details){
 const btn=$('pp168-print-order');if(!btn)return;
 let el=$('pp1714-print-info');if(!el){el=document.createElement('span');el.id='pp1714-print-info';el.className='pp1714-print-info';btn.insertAdjacentElement('afterend',el);}
 const rec=details&&log.get(details.id);
 el.textContent=rec&&rec.count?'Prinditud '+rec.count+'× · viimati '+hm(rec.last_at)+' ('+rec.last_device+')':'Pole veel prinditud';
}
let shown=null;
window.addEventListener('pp168:details-opened',e=>{shown=e.detail;infoLine(shown);load(false).then(()=>infoLine(shown));});

/* ---------- refresh ---------- */
window.addEventListener('pp150:live-synced',()=>load(false));
document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="settings"]'))setTimeout(()=>load(true),100);});
function start(){render();load(true);setInterval(()=>{if(!document.hidden)load(false);},60000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
