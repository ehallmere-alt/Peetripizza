/* Peetri Pizza 15.6 — live reconciliation, sound checks, staff audit and pickup search.
   Does not write to peetripizza.ee. Client links remain manually shared. */
(()=>{'use strict';
const $=id=>document.getElementById(id),ordersPage=$('ordersPage');if(!ordersPage)return;
const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isLive=()=>document.body.classList.contains('live-active');
const dataFresh=()=>isLive()&&!document.body.classList.contains('live-connection-error')&&Date.now()-Number(window.pp155LiveFreshAt||0)<30000;
/* 1. Compare the before/after snapshots on connection recovery.
   Disappearances are only candidates for manual review, not proof of missed orders. */
let previous=new Map(),outage=false,hasBaseline=false,checks=0,reconnects=0,changed=0;
const health=document.createElement('section');health.className='pp156-reconcile';
health.innerHTML='<div class="pp156-reconcile-main"><strong>LIVE diagnostika</strong><span id="pp156-reconcile-state">LIVE ei ole aktiivne</span><button type="button" id="pp156-live-check">↻ Kontrolli</button></div><div class="pp156-reconcile-details"><span id="pp156-checks">Kontrolle: 0</span><span id="pp156-recoveries">Taastumisi: 0</span><span id="pp156-gap">Katkestusi pole tuvastatud</span></div><p id="pp156-advice" hidden></p>';
ordersPage.querySelector('.pp155-health')?.after(health);
const healthMsg=txt=>{$('pp156-reconcile-state').textContent=txt};
$('pp156-live-check').addEventListener('click',()=>document.dispatchEvent(new Event('pp:refresh-live')));
window.addEventListener('pp150:live-failed',()=>{outage=true;health.dataset.state='error';healthMsg('⚠ Ühendus katkes · andmed võivad olla vananenud')});
window.addEventListener('pp150:live-stopped',()=>{previous.clear();outage=false;hasBaseline=false;checks=0;reconnects=0;changed=0;health.dataset.state='demo';healthMsg('LIVE ei ole aktiivne');$('pp156-gap').textContent='Katkestusi pole tuvastatud';$('pp156-advice').hidden=true;updateMetrics()});
function updateMetrics(){$('pp156-checks').textContent='Kontrolle: '+checks;$('pp156-recoveries').textContent='Taastumisi: '+reconnects}
window.addEventListener('pp150:live-synced',e=>{
 checks++;const items=(window.pp153RawLiveOrders||[]).filter(o=>o&&/^live-[a-f0-9]{24}$/.test(o.id));
 const now=new Map(items.map(o=>[o.id,o.status]));
 health.dataset.state='ok';healthMsg('● Ühendatud · '+items.length+' tellimust · '+(Number(e.detail?.requestMs)||0)+' ms');
 if(hasBaseline&&outage){
  reconnects++;const added=[...now].filter(([id])=>!previous.has(id));
  const missing=[...previous].filter(([id,status])=>(status==='new'||status==='active')&&!now.has(id));
  changed=added.length+missing.length;
  $('pp156-gap').textContent='Taastumise järel: '+added.length+' lisandunud · '+missing.length+' eelmisest loendist puudu';
  const advice=$('pp156-advice');advice.hidden=changed===0;
  advice.textContent=changed?'⚠ Võrdle pärast katkestust ka ametlikku tellimuste nimekirja. Puuduv rida ei tähenda tingimata kadunud tellimust.':'';
 }
 previous=now;outage=false;hasBaseline=true;updateMetrics();
});
/* 4. Audible alarm previews and clearly stated browser limitations. */
const audio=document.createElement('section');audio.className='pp156-sound-panel';audio.innerHTML='<div><strong>🔔 Signaalide kontroll</strong><span id="pp156-sound-state">Heli olek kontrollimata</span></div><div class="pp156-sound-tests"><button type="button" data-pp156-tone="normal">♫ Uus tellimus</button><button type="button" data-pp156-tone="urgent">♫ Kiire tellimus</button><button type="button" data-pp156-tone="offline">♫ Ühenduse viga</button></div><small>Heli vajab iPadis puudutusega aktiveerimist. Brauseri taustavaates pole märguanne garanteeritud.</small>';
ordersPage.querySelector('.pp155-audio')?.after(audio);
function soundStatus(){const d=window.PPSound?.diagnostics?.();let state=!d?.supported?'Heli pole toetatud':!d.enabled?'Heli väljas':d.state!=='running'?'Vajuta „Aktiveeri heli”':d.volume<=0?'Helitugevus 0%':'● Heli valmis';$('pp156-sound-state').textContent=state;}
audio.addEventListener('click',e=>{const b=e.target.closest('[data-pp156-tone]');if(!b)return;window.PPSound?.preview?.(b.dataset.pp156Tone==='normal'?undefined:b.dataset.pp156Tone);setTimeout(soundStatus,300)});
setInterval(soundStatus,5000);soundStatus();
/* 6. Search and sort in the existing v15.5 touch-friendly pickup station. */
const station=$('pp155-station-list');
if(station){
 const toolbar=document.createElement('div');toolbar.className='pp156-pickup-tools';
 toolbar.innerHTML='<label>Otsi tellimuse numbrit <input type="search" id="pp156-pickup-search" placeholder="Näiteks 154" aria-label="Otsi tellimuse numbrit" autocomplete="off"></label><label>Järjestus <select id="pp156-pickup-sort"><option value="wait">Kõige kauem oodanud</option><option value="number">Tellimuse number</option></select></label><span id="pp156-pickup-results">—</span>';
 station.before(toolbar);
 let nextFrame=false;
 const orderNumber=row=>row.querySelector('strong')?.textContent||'';
 function filterSort(){nextFrame=false;const rows=[...station.querySelectorAll('.pp155-station-order')];if(!rows.length){$('pp156-pickup-results').textContent='0 tellimust';return}
  const q=$('pp156-pickup-search').value.trim().toLowerCase(),sort=$('pp156-pickup-sort').value;
  const getWait=row=>{const t=row.querySelector('.pp155-age')?.textContent||'';return Number(t.match(/(\d+)\s*min/)?.[1]||-1)};
  const expected=[...rows].sort((a,b)=>sort==='number'?orderNumber(a).localeCompare(orderNumber(b),'et',{numeric:true}):getWait(b)-getWait(a));
  if(expected.some((r,i)=>r!==rows[i])){
   const frag=document.createDocumentFragment();for(const el of expected)frag.appendChild(el);station.appendChild(frag);
  }
  let n=0;for(const row of expected){const matches=orderNumber(row).toLowerCase().includes(q);row.hidden=!matches;if(matches)n++;}
  $('pp156-pickup-results').textContent=n+' tellimust nähtaval';
 }
 const queue=()=>{if(nextFrame)return;nextFrame=true;requestAnimationFrame(filterSort)};
 new MutationObserver(queue).observe(station,{childList:true});
 $('pp156-pickup-search').addEventListener('input',queue);$('pp156-pickup-sort').addEventListener('change',queue);
 $('pp155-pickup-open')?.addEventListener('click',queue);queue();
}
})();
