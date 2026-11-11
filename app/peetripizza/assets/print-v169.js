/* Peetri Pizza v16.9: browser-assisted printing (no silent hardware access or supplier writes). */
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
function html(details){const date=Number(details.created)>0?new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',dateStyle:'short',timeStyle:'short'}).format(new Date(details.created)):'—';const width=prefs.width===58?52:74;
 const entries=(Array.isArray(details.items)?details.items:[]).slice(0,80).map(x=>{const name=Array.isArray(x)?x[0]:(x?.name||x?.title||'Toode'),n=Array.isArray(x)?x[1]:(x?.quantity||x?.qty||1);return `<div class="line"><b>${esc(Math.max(0,Math.min(999,Number(n)||0)))} ×</b><span>${esc(text(name))}</span></div>`}).join('');
 const status={new:'Uus',active:'Valmistamisel',done:'Valmis'}[details.status]||'—';
 return `<!doctype html><html lang="et"><head><meta charset="utf-8"><title>Peetri Pizza #${esc(details.number)}</title><style>@page{size:${prefs.width}mm auto;margin:3mm}html,body{margin:0;padding:0;background:white;color:#111;font:12px/1.35 Arial,sans-serif}main{max-width:${width}mm;margin:0 auto;padding:2mm 0}h1{font-size:16px;text-align:center;margin:0}h2{font-size:23px;text-align:center;margin:8px 0}.line{display:flex;gap:7px;margin:7px 0;overflow-wrap:anywhere}.line b{min-width:25px}.rule{border-top:1px dashed #222;margin:10px 0}.note{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#555}@media screen{body{padding:10px}main{border:1px dashed #aaa;padding:10px}}</style></head><body><main><h1>PEETRI PIZZA · KÖÖK</h1><h2>#${esc(text(details.number))}</h2><p>${esc(date)}</p><p><b>Klient:</b> ${esc(text(details.customerName||details.customer||'—'))}</p><p><b>Staatus:</b> ${esc(status)}</p><p><b>Tellimuse tüüp:</b> ${details.serving==='delivery'?'Kohaletoimetamine':'Kaasa'}</p><div class="rule"></div>${entries||'<p>Kontrolli tooteid originaaltellimusest.</p>'}<div class="rule"></div>${details.note?`<b>MÄRKUS</b><p class="note">${esc(text(details.note))}</p><div class="rule"></div>`:''}<small>Köögi sisemine väljavõte. Ei kinnita printimise õnnestumist ega muuda ametlikke tellimusi.</small></main></body></html>`;
}
function print(details,automatic){if(!details||!Array.isArray(details.items)){msg('Tellimuse andmed pole saadaval.');return false;}
 let w=null;try{w=window.open('','_blank','width=460,height=700');}catch(_){/* Popup blocked */}
 if(!w){addJournal(details,'blocked');msg('Brauser blokeeris hüpikakna. Ava Seaded ja prindi käsitsi.');return false;}
 try{w.document.open();w.document.write(html(details));w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(e){/* Browser may prohibit background print */}},350);
 addJournal(details,'dialog');msg(automatic?'Printimisdialoog käivitatud. Kontrolli printerit.':'Printimisdialoog avatud. Kontrolli printerit.');return true;
 }catch(_){try{w.close()}catch(__){}addJournal(details,'error');msg('Printimist ei saanud käivitada.');return false;}
}
function fromRaw(id){const raw=(window.pp153RawLiveOrders||[]).find(o=>o?.id===id);if(raw)return {id:raw.id,number:raw.number,status:raw.status,created:raw.created,customerName:raw.customerName||'',serving:raw.serving||'',note:raw.note||raw.notes||'',items:raw.items||[]};const snap=window.pp145LatestSnapshot?.orders?.find(o=>o.id===id);return snap?{...snap,customerName:'',serving:'',note:''}:null;}
function enqueue(o){if(!queue.some(q=>q.id===o.id)){queue.push({id:o.id,number:String(o.number||'')});queue=queue.slice(-50);write(queueKey,queue);}renderJournal();}
window.PPPrint169={printManual(details){print(details,false)},pendingCount(){return queue.length}};
$('pp169-auto-print').checked=prefs.auto;$('pp169-paper').value=String(prefs.width);$('pp169-printer-label').value=prefs.label||'';
function savePrefs(){prefs.auto=$('pp169-auto-print').checked;prefs.width=Number($('pp169-paper').value)===58?58:80;prefs.label=String($('pp169-printer-label').value).slice(0,60);write(prefsKey,prefs);msg(prefs.auto?'Automaatne printimine on sisse lülitatud. Brauser võib nõuda käsitsi kinnitust.':'Automaatne printimine on välja lülitatud.');}
for(const id of ['pp169-auto-print','pp169-paper','pp169-printer-label'])$(id)?.addEventListener(id==='pp169-printer-label'?'input':'change',savePrefs);
$('pp169-print-queue')?.addEventListener('click',()=>{if(!queue.length){msg('Ootel printimisi ei ole.');return;}const first=queue[0],details=fromRaw(first.id);if(!details){msg('Ootel tellimuse andmed puuduvad. Ava LIVE ja proovi uuesti.');return;}if(print(details,false)){queue.shift();write(queueKey,queue);renderJournal();if(queue.length)msg(`Prindid ükshaaval. Järgmisi tellimusi: ${queue.length}`);}});
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
 for(const o of unseen){if(inFlight){enqueue(o);continue;}inFlight=true;if(!print(fromRaw(o.id)||o,true))enqueue(o);inFlight=false;}
});
renderJournal();msg('Automaatne printimine: '+(prefs.auto?'sees':'väljas')+'. Printer valitakse brauseris.');
})();
