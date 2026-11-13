/* Peetri Pizza v16.9 (+v17.14 monitor hooks): browser-assisted printing (no silent hardware access or supplier writes). */
(()=>{'use strict';
const $=id=>document.getElementById(id),loc=document.querySelector('meta[name="pp-location-id"]')?.content||'local';
const prefsKey='pp169-print-prefs:'+loc,seenKey='pp169-print-seen:'+loc,queueKey='pp169-print-queue:'+loc,logKey='pp169-print-log:'+loc;
function read(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch(_){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}}
const prefs=Object.assign({auto:false,width:80,label:''},read(prefsKey,{}));prefs.auto=prefs.auto===true;prefs.width=[58,80].includes(Number(prefs.width))?Number(prefs.width):80;
let seen=read(seenKey,{}),queue=read(queueKey,[]),journal=read(logKey,[]),baseline=false,inFlight=false;
if(!seen||typeof seen!=='object'||Array.isArray(seen))seen={};if(!Array.isArray(queue))queue=[];if(!Array.isArray(journal))journal=[];
function clean(){const until=Date.now()-14*86400000;seen=Object.fromEntries(Object.entries(seen).filter(([,at])=>Number(at)>until).slice(-2500));queue=queue.filter(x=>x&&typeof x.id==='string'&&/^live-[a-f0-9]{24}$/.test(x.id)).slice(-50);journal=journal.filter(x=>x&&typeof x.id==='string').slice(-120);write(seenKey,seen);write(queueKey,queue);write(logKey,journal)}clean();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').slice(0,400);
const msg=m=>{if($('pp169-print-status'))$('pp169-print-status').textContent=m;};
function addJournal(details,outcome){journal.push({id:String(details.id||'').slice(0,60),number:text(details.number).slice(0,20),at:new Date().toISOString(),outcome});journal=journal.slice(-120);write(logKey,journal);renderJournal();}
function renderJournal(){const box=$('pp169-print-history');if(!box)return;box.replaceChildren();const status=document.createElement('p');status.textContent=queue.length?`Ootel: ${queue.length} tellimust`:'Ootel tellimusi pole';box.append(status);for(const row of [...journal].reverse().slice(0,25)){const div=document.createElement('div');div.className='pp169-print-log-row';div.textContent=`${new Date(row.at).toLocaleString('et-EE')} · #${row.number} · ${row.outcome==='dialog'?'Dialoog avati (füüsiline print teadmata)':row.outcome==='blocked'?'Brauser blokeeris printimise':'Printimine ebaõnnestus'}`;box.append(div)}}
// v17.8: same picture as the kitchen card: big number + name, phone, boxes, only real changes.
function html(details,kind){
 const tz={timeZone:'Europe/Tallinn'};
 const date=Number(details.created)>0?new Intl.DateTimeFormat('et-EE',{...tz,dateStyle:'short',timeStyle:'short'}).format(new Date(details.created)):'—';
 const due=Number(details.deadline)>0?new Intl.DateTimeFormat('et-EE',{...tz,hour:'2-digit',minute:'2-digit'}).format(new Date(details.deadline)):'';
 const width=prefs.width===58?52:74;
 const info=window.PPOrderInfo;
 const items=(Array.isArray(details.items)?details.items:[]).slice(0,80).map(x=>Array.isArray(x)?x:[x?.name||x?.title||'Toode',x?.quantity||x?.qty||1]);
 const entries=items.map(([raw,n])=>{
  const q=Math.max(0,Math.min(999,Number(n)||0));
  const p=info?info.parse(raw):{name:text(raw),code:null,codeTitle:'',mods:[],extras:[]};
  const mods=p.mods.map(([t,k])=>`<span class="mod ${k==='warn'?'warn':''}">${esc(t)}</span>`).join('');
  const extras=p.extras.length?`<div class="extras">+ ${p.extras.map(esc).join(', ')}</div>`:'';
  return `<div class="line${q>1?' multi':''}"><b class="q">${esc(q)}×</b><div class="what">${p.code?`<span class="code">${esc(p.code)}</span>`:''}<strong>${esc(text(p.name))}</strong>${p.code?`<small>${esc(p.codeTitle)}</small>`:''}${mods?`<div class="mods">${mods}</div>`:''}${extras}</div></div>`;
 }).join('');
 const boxes=info?info.boxes({items,dineIn:!!details.dineIn}):[];
 const boxHtml=boxes===null?'<div class="boxes">KOHAPEAL · karpi pole vaja</div>':boxes.length?`<div class="boxes">KARBID: ${boxes.map(([k,n])=>`<b>${n}× ${esc(k)}</b>`).join(' · ')}</div>`:'';
 const name=text(details.customerName||details.customer||'');
 const phone=text(details.customerPhone||'');
 const type=details.dineIn?'KOHAPEAL':details.serving==='delivery'?'KULLERIGA':'KAASA';
 return `<!doctype html><html lang="et"><head><meta charset="utf-8"><title>Peetri Pizza #${esc(details.number)}</title><style>@page{size:${prefs.width}mm auto;margin:3mm}html,body{margin:0;padding:0;background:white;color:#000;font:13px/1.3 Arial,sans-serif}main{max-width:${width}mm;margin:0 auto;padding:2mm 0}.top{display:flex;justify-content:space-between;font-size:11px;font-weight:bold;letter-spacing:.05em}.num{font-size:26px;font-weight:900;text-align:center;margin:6px 0 2px;border:2px solid #000;border-radius:6px;padding:2px 0}.name{font-size:22px;font-weight:900;text-align:center;margin:4px 0 0;overflow-wrap:anywhere}.phone{font-size:16px;font-weight:bold;text-align:center;margin:2px 0}.meta{display:flex;justify-content:space-between;font-size:12px;margin-top:6px}.type{font-weight:900;border:1.5px solid #000;padding:0 5px}.boxes{margin:8px 0 0;padding:5px 6px;border:1.5px dashed #000;font-size:13px}.line{display:flex;gap:6px;margin:8px 0;overflow-wrap:anywhere}.q{min-width:28px;font-size:18px}.multi .q{background:#000;color:#fff;text-align:center;border-radius:4px;padding:0 3px;height:24px}.what strong{font-size:17px}.code{display:inline-block;font-weight:900;font-size:14px;border:2px solid #000;border-radius:4px;padding:0 4px;margin-right:5px}.what small{display:block;font-size:11px;text-transform:uppercase}.mods{margin-top:3px}.mod{display:inline-block;font-size:12px;border:1px solid #000;border-radius:3px;padding:0 4px;margin:2px 3px 0 0}.mod.warn{font-weight:900;border-width:2px}.extras{font-size:13px;font-weight:bold;margin-top:3px}.copy{text-align:center;font-size:15px;font-weight:900;letter-spacing:.2em;border:2px dashed #000;margin:4px 0}.rule{border-top:1px dashed #000;margin:9px 0}.note{white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px;font-weight:bold}small.foot{display:block;color:#333;font-size:10px}@media screen{body{padding:10px}main{border:1px dashed #aaa;padding:10px}}</style></head><body><main><div class="top"><span>PEETRI PIZZA · KÖÖK</span><span>${esc(date)}</span></div>${kind==='copy'?'<div class="copy">KOOPIA</div>':kind==='retry'?'<div class="copy">KORDUSPRINT</div>':kind==='test'?'<div class="copy">TESTPRINT</div>':''}<div class="num">#${esc(text(details.number))}</div>${name?`<div class="name">${esc(name)}</div>`:''}${phone?`<div class="phone">Tel ${esc(phone)}</div>`:''}<div class="meta"><span class="type">${type}</span><span>${due?'Valmis kell <b>'+esc(due)+'</b>':''}</span></div>${boxHtml}${(()=>{const f=window.PPAlert?window.PPAlert.find(items.map(x=>String(x[0])).join(' \n ')+' \n '+String(details.note||'')):[];return f.length?`<div class="allergy" style="margin:8px 0 0;padding:6px;border:3px solid #000;font-size:16px;font-weight:900;text-transform:uppercase">⚠ ${f.map(x=>esc(text(x))).join(' · ')}</div>`:''})()}<div class="rule"></div>${entries||'<p>Kontrolli tooteid originaaltellimusest.</p>'}<div class="rule"></div>${details.note?`<b>⚑ KLIENDI MÄRKUS</b><p class="note">${esc(text(details.note))}</p><div class="rule"></div>`:''}<small class="foot">Köögi sisemine väljavõte. Ei muuda ametlikke tellimusi.</small></main></body></html>`;
}
function print(details,automatic,kind){kind=kind||(automatic?'auto':'manual');const mon=window.PPPrintMonitor;if(!details||!Array.isArray(details.items)){msg('Tellimuse andmed pole saadaval.');return false;}
 let w=null;try{w=window.open('','_blank','width=460,height=700');}catch(_){/* Popup blocked */}
 if(!w){addJournal(details,'blocked');try{mon?.failed(details,kind,'blocked')}catch(_){}msg('Brauser blokeeris hüpikakna. Ava Seaded ja prindi käsitsi.');return false;}
 try{w.document.open();w.document.write(html(details,kind));try{mon?.opened(details,kind,w)}catch(_){}w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(e){/* Browser may prohibit background print */}},350);
 addJournal(details,'dialog');msg(automatic?'Printimisdialoog käivitatud. Kontrolli printerit.':'Printimisdialoog avatud. Kontrolli printerit.');return true;
 }catch(_){try{w.close()}catch(__){}addJournal(details,'error');try{mon?.failed(details,kind,'failed')}catch(__){}msg('Printimist ei saanud käivitada.');return false;}
}
function fromRaw(id){const raw=(window.pp153RawLiveOrders||[]).find(o=>o?.id===id);if(raw)return {id:raw.id,number:raw.number,status:raw.status,created:raw.created,customerName:raw.customerName||'',customerPhone:raw.customerPhone||'',dineIn:!!raw.dineIn,deadline:raw.deadline||0,serving:raw.serving||'',note:raw.note||raw.notes||'',items:raw.items||[]};const snap=window.pp145LatestSnapshot?.orders?.find(o=>o.id===id);return snap?{...snap,customerName:'',serving:'',note:''}:null;}
function enqueue(o){if(!queue.some(q=>q.id===o.id)){queue.push({id:o.id,number:String(o.number||'')});queue=queue.slice(-50);write(queueKey,queue);}renderJournal();}
// v17.14: Smart Print Monitor (print-monitor-v1714.js) asks before a duplicate and keeps the shared log.
window.PPPrint169={printManual(details){const mon=window.PPPrintMonitor;if(mon&&details&&details.id){mon.manual(details,kind=>print(details,false,kind));return;}print(details,false)},print(details,kind){return print(details,false,kind)},html,fromRaw:id=>fromRaw(id),pendingCount(){return queue.length},queue(){return queue.slice()},printQueued(){$('pp169-print-queue')?.click()}};
$('pp169-auto-print').checked=prefs.auto;$('pp169-paper').value=String(prefs.width);$('pp169-printer-label').value=prefs.label||'';
function savePrefs(){prefs.auto=$('pp169-auto-print').checked;prefs.width=Number($('pp169-paper').value)===58?58:80;prefs.label=String($('pp169-printer-label').value).slice(0,60);write(prefsKey,prefs);msg(prefs.auto?'Automaatne printimine on sisse lülitatud. Brauser võib nõuda käsitsi kinnitust.':'Automaatne printimine on välja lülitatud.');}
for(const id of ['pp169-auto-print','pp169-paper','pp169-printer-label'])$(id)?.addEventListener(id==='pp169-printer-label'?'input':'change',savePrefs);
$('pp169-print-queue')?.addEventListener('click',()=>{if(!queue.length){msg('Ootel printimisi ei ole.');return;}const first=queue[0],details=fromRaw(first.id);if(!details){msg('Ootel tellimuse andmed puuduvad. Ava LIVE ja proovi uuesti.');return;}if(print(details,false,'manual')){queue.shift();write(queueKey,queue);renderJournal();if(queue.length)msg(`Prindid ükshaaval. Järgmisi tellimusi: ${queue.length}`);}});
$('pp169-clear-print-log')?.addEventListener('click',()=>{if(!confirm('Tühjendada selle seadme printimiskatsete logi? Ootel järjekorda ei kustutata.'))return;journal=[];write(logKey,journal);renderJournal();msg('Printimislogi tühjendatud.');});
window.addEventListener('pp150:live-stopped',()=>{baseline=false;});
window.addEventListener('pp150:live-synced',()=>{
 if(!document.body.classList.contains('live-active')||document.body.classList.contains('live-connection-error'))return;
 const all=(window.pp153RawLiveOrders||[]).filter(o=>o&&typeof o.id==='string'&&/^live-[a-f0-9]{24}$/.test(o.id));
 const now=Date.now(),unseen=all.filter(o=>o.status==='new'&&!seen[o.id]);
 for(const o of all)seen[o.id]=now;clean();
 if(!baseline){baseline=true;return;} // First sync only establishes a baseline; never bulk-print old orders.
 if(!prefs.auto||!unseen.length)return;
 if(document.hidden){for(const o of unseen)enqueue(o);msg('Uued tellimused on printimise järjekorras.');return;}
 const mon=window.PPPrintMonitor;
 for(const o of unseen){if(mon){mon.claimAuto(o).then(go=>{if(go&&!print(fromRaw(o.id)||o,true,'auto'))enqueue(o);});continue;}if(inFlight){enqueue(o);continue;}inFlight=true;if(!print(fromRaw(o.id)||o,true))enqueue(o);inFlight=false;}
});
renderJournal();msg('Automaatne printimine: '+(prefs.auto?'sees':'väljas')+'. Printer valitakse brauseris.');
})();
