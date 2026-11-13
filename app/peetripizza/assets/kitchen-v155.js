/* Peetri Pizza 15.5: customer tracking link UI, pickup station, sound readiness, LIVE freshness. */
(()=>{'use strict';
const $=id=>document.getElementById(id);const page=$('ordersPage');if(!page)return;
const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const live=()=>document.body.classList.contains('live-active');
const fresh=()=>live()&&!document.body.classList.contains('live-connection-error')&&Number(window.pp155LiveFreshAt)>0&&Date.now()-Number(window.pp155LiveFreshAt)<30000;
const localOrder=id=>(window.pp153RawLiveOrders||[]).find(o=>o.id===id);
let lastGood=0,latency=0,failures=0,stationOpen=false,handed={},pickupConnected=false,renderQueued=false;
/* 1 LIVE health: one status strip, no additional requests to official vendor. */
const status=document.createElement('div');status.className='pp155-health';status.innerHTML=`<div><strong>● LIVE olek</strong><span id="pp155-health-text">DEMO · LIVE pole käivitatud</span></div><span id="pp155-health-age">—</span><span id="pp155-health-ms">—</span><button type="button" id="pp155-reconnect">↻ Uuenda</button>`;
page.querySelector('.pp154-sync')?.after(status);
function health(){const age=lastGood?Math.max(0,Math.floor((Date.now()-lastGood)/1000)):null;const ok=fresh();status.dataset.state=!live()?'demo':ok?'ok':'stale';
 $('pp155-health-text').textContent=!live()?'DEMO · LIVE pole käivitatud':ok?'LIVE · andmed värsked':failures?'LIVE · ühendus katkes · automaatne uus katse':'LIVE · kontrolli ühendust';
 $('pp155-health-age').textContent=age===null?'Viimati: —':'Viimati: '+age+' s tagasi';
 $('pp155-health-ms').textContent=latency?'API '+latency+' ms':'—';
 $('pp155-reconnect').disabled=!live();
}
$('pp155-reconnect').addEventListener('click',()=>document.dispatchEvent(new Event('pp:refresh-live')));
window.addEventListener('pp150:live-synced',e=>{lastGood=Number(e.detail?.lastSuccess)||Date.now();latency=Number(e.detail?.requestMs)||0;failures=0;health();schedule()});
window.addEventListener('pp150:live-failed',e=>{failures=Number(e.detail?.failures)||1;health();schedule()});
window.addEventListener('pp150:live-stopped',()=>{lastGood=0;latency=0;failures=0;health();schedule()});
/* 4 notifications: clear, observable sound readiness without pretending to detect device silent switch. */
const audio=document.createElement('div');audio.className='pp155-audio';audio.innerHTML='<strong>🔔 Köögi heli</strong><span id="pp155-audio-status">Kontrollimata</span><button id="pp155-audio-enable" type="button">▶ Aktiveeri heli</button><button id="pp155-audio-test" type="button">♫ Testi</button>';
page.querySelector('.pp154-sync')?.appendChild(audio);
function audioStatus(){const d=window.PPSound?.diagnostics?.();const enabled=!!d?.enabled;const playing=enabled&&d?.supported&&d?.state==='running'&&d?.volume>0;
 $('pp155-audio-status').textContent=!d?.supported?'Heli puudub':!enabled?'Heli on välja lülitatud':playing?'● Heli valmis':d.volume===0?'⚠ Helitugevus 0%':'⚠ Aktiveeri heli iPadis';
 $('pp155-audio-status').dataset.state=playing?'ok':'warn';$('pp155-audio-enable').textContent=playing?'✓ Heli aktiivne':'▶ Aktiveeri heli';
}
$('pp155-audio-enable').addEventListener('click',async()=>{const d=window.PPSound?.diagnostics?.();if(!d?.enabled){$('soundBtn')?.click()}const done=window.PPSound?.unlock?.();if(done)await done;audioStatus()});
$('pp155-audio-test').addEventListener('click',()=>{window.PPSound?.preview?.();setTimeout(audioStatus,250)});
/* 3 Customer link: staff must manually share it. No public customer details in link endpoint. */
const shareDialog=document.createElement('dialog');shareDialog.className='pp155-share-dialog';shareDialog.innerHTML='<div class="pp155-dialog-header"><h3>🔗 Kliendi jälgimislink</h3><button type="button" id="pp155-share-close" aria-label="Sulge">✕</button></div><p>See näitab kliendile ainult köögi staatust. Ametlik Peetri Pizza olek ei muutu. Link tuleb kliendile ise saata.</p><label>Link <input type="text" id="pp155-share-url" readonly></label><button type="button" id="pp155-share-copy">Kopeeri link</button><small id="pp155-share-message">Kehtib 24 tundi.</small>';
document.body.appendChild(shareDialog);$('pp155-share-close').addEventListener('click',()=>shareDialog.close());
$('pp155-share-copy').addEventListener('click',async()=>{const value=$('pp155-share-url').value;try{await navigator.clipboard.writeText(value);$('pp155-share-message').textContent='✓ Link kopeeritud';}catch(_){$('pp155-share-url').select();$('pp155-share-message').textContent='Vali ja kopeeri link käsitsi.';}});
async function createLink(id,button){if(!fresh()){alert('LIVE-andmed on aegunud. Uuenda reaalsete tellimuste nimekirja.');return}
 if(!/^live-[a-f0-9]{24}$/.test(id)||!localOrder(id))return;
 const old=button?.textContent;if(button){button.disabled=true;button.textContent='⌛ Loon linki…'}
 try{const r=await fetch('api/customer-links.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,Accept:'application/json'},body:JSON.stringify({order_id:id})});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'HTTP '+r.status);
  const url=new URL(j.url,location.origin);if(url.origin!==location.origin)throw Error('invalid_url');
  $('pp155-share-url').value=url.href;$('pp155-share-message').textContent='Kehtib 24 tundi. Saada see link kliendile ise.';shareDialog.showModal();
 }catch(e){alert('Jälgimislingi loomine ebaõnnestus: '+e.message)}finally{if(button){button.disabled=false;button.textContent=old}}
}
function addShareButtons(){for(const container of ['newOrders','activeOrders','doneOrders']){
 const root=$(container);if(!root)continue;
 for(const card of root.querySelectorAll('[data-order-id]')){
  const id=card.dataset.orderId,footer=card.querySelector('.pp117-ticket-footer,.pp112-card-footer,.cardfooter');
  if(!footer||card.querySelector('[data-pp155-share]')||!/^live-[a-f0-9]{24}$/.test(id))continue;
  const btn=document.createElement('button');btn.type='button';btn.className='pp155-share-btn';btn.dataset.pp155Share=id;btn.textContent='🔗 Link';btn.title='Loo piiratud jälgimislink (tuleb kliendile eraldi saata)';btn.disabled=!fresh();footer.appendChild(btn);
 }
 for(const btn of root.querySelectorAll('[data-pp155-share]'))btn.disabled=!fresh();
 }}
page.addEventListener('click',e=>{const b=e.target.closest('[data-pp155-share]');if(!b)return;e.preventDefault();e.stopPropagation();if(!b.disabled)createLink(b.dataset.pp155Share,b)});
/* 6 Pickup Station: separate touch-friendly dialogue, actions reuse existing server concurrency logic. */
const pickupButton=document.createElement('button');pickupButton.type='button';pickupButton.id='pp155-pickup-open';pickupButton.textContent='📦 Väljastus';pickupButton.className='pp155-pickup-open';
$('toggleHistory')?.insertAdjacentElement('afterend',pickupButton);
const station=document.createElement('dialog');station.className='pp155-station';station.innerHTML='<div class="pp155-dialog-header"><div><small>PEETRI PIZZA · KOLDE</small><h2>📦 Väljastus</h2><p>Valmis tellimused · klient tuleb ise järele</p></div><button type="button" id="pp155-station-close" aria-label="Sulge">✕</button></div><div class="pp155-station-meta"><strong id="pp155-station-waiting">0 ootab</strong><span id="pp155-station-sync">Andmeid kontrollitakse</span></div><div class="pp155-station-list" id="pp155-station-list"></div><p class="pp155-station-tip">Üleandmine salvestatakse meie serverisse, mitte ametlikku Peetri Pizza süsteemi.</p>';
document.body.appendChild(station);
$('pp155-station-close').addEventListener('click',()=>station.close());
pickupButton.addEventListener('click',()=>{station.showModal();stationOpen=true;renderStation()});
station.addEventListener('close',()=>{stationOpen=false});
function renderStation(){if(!stationOpen)return;const done=$('doneOrders');if(!done)return;
 const cards=[...done.querySelectorAll('.pp112-done-card')];let waiting=0;
 const rows=cards.map(card=>{
  const id=card.dataset.orderId,number=card.querySelector('.pp112-number')?.textContent||'—';
  const customer=card.querySelector('.pp112-customer')?.textContent||'';
  const state=handed[(live()?'live:':'demo:')+id],isHanded=!!state?.handed_at;
  if(isHanded)return '';
  waiting++;
  const at=Number(card.dataset.readyAt),age=at>0?Math.max(0,Math.floor((Date.now()-at)/60000)):null;
  const native=card.querySelector('.pp154-handover');const canGive=pickupConnected&&!native?.disabled&&!!native;
  const late=age!==null&&age>=15;
  const phone=card.dataset.phone||'',boxes=card.dataset.boxes||'';
  return '<article class="pp155-station-order'+(late?' late':'')+'"><div class="pp178-who"><strong>'+esc(number)+'</strong><b class="pp178-name">'+esc(customer)+'</b>'+(phone?'<a class="pp178-phone" href="tel:'+esc(phone.replace(/ /g,''))+'">📞 '+esc(phone)+'</a>':'')+(boxes?'<span class="pp178-boxes">'+(boxes==='KOHAPEAL'?'🍽 KOHAPEAL':'📦 '+esc(boxes))+'</span>':'')+'</div><span class="pp155-age">'+(age===null?'Valmis':'Ootab '+age+' min')+'</span><button type="button" data-pp155-pickup="'+esc(id)+'" '+(canGive?'':'disabled')+'>✓ Üle antud</button>'+(live()?'<button type="button" class="pp155-station-link" data-pp155-station-share="'+esc(id)+'">🔗</button>':'')+'</article>';
 }).filter(Boolean);
 $('pp155-station-waiting').textContent=waiting+' ootab klienti';$('pp155-station-sync').textContent=pickupConnected?'● Serveriga ühendatud':'⚠ Serveri sünkroon puudub';
 $('pp155-station-list').innerHTML=rows.join('')||'<p class="pp155-empty">Kõik tellimused on üle antud.</p>';
}
station.addEventListener('click',e=>{const pickup=e.target.closest('[data-pp155-pickup]');if(pickup){const id=pickup.dataset.pp155Pickup;const real=[...$('doneOrders').querySelectorAll('[data-order-id]')].find(c=>c.dataset.orderId===id);const native=real?.querySelector('.pp154-handover');if(native&&!native.disabled){pickup.disabled=true;native.click()}return}
 const share=e.target.closest('[data-pp155-station-share]');if(share)createLink(share.dataset.pp155StationShare,share);
});
window.addEventListener('pp155:pickup-state',e=>{handed=e.detail?.records||{};pickupConnected=!!e.detail?.connected;renderStation()});
window.addEventListener('pp155:status-saved',()=>{addShareButtons();renderStation()});
function schedule(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;addShareButtons();renderStation()})}
for(const name of ['newOrders','activeOrders','doneOrders'])if($(name))new MutationObserver(schedule).observe($(name),{childList:true});
setInterval(()=>{health();audioStatus();if(stationOpen)renderStation()},3000);
health();audioStatus();schedule();
})();
