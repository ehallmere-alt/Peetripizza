/* Peetri Pizza Service v15.0 LIVE Kitchen. Presentation only, no network/write operations. */
(()=>{'use strict';const $=id=>document.getElementById(id),container=document.querySelector('#ordersPage .sourcebar');if(!container)return;
 const info=document.createElement('div');info.className='pp150-live-hud';info.setAttribute('role','status');
 info.innerHTML='<span id="pp150-link" class="pp150-link" data-state="demo">● DEMO</span><span id="pp150-orders">LIVE käivitamata</span><span id="pp150-updated"></span><button type="button" id="pp150-enable-sound" title="Luba heliteavitused kasutaja puudutusega">♫ Aktiveeri heli</button><span class="pp150-readonly" title="Olekute muutmine pole veel lubatud">🔒 Ainult lugemine</span>';
 container.appendChild(info);
 const last=$('pp150-updated'),label=$('pp150-link'),orders=$('pp150-orders'),sound=$('pp150-enable-sound');
 function soundLabel(){const state=window.PPSound?.diagnostics?.();sound.textContent=!state?.enabled?'♫ Lülita heli sisse':state.state==='running'?'✓ Heli aktiivne':'▶ Aktiveeri heli';}
 function time(v){return new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(v));}
 function stamp(ms){last.textContent=ms?'Viimati '+time(ms):'';}
 window.addEventListener('pp150:live-synced',e=>{const d=e.detail||{};label.dataset.state='ok';label.textContent='● LIVE';orders.textContent=Number(d.newOrders||0)+' uut · '+Number(d.activeOrders||0)+' töös · '+Number(d.ordersCount||0)+' laaditud';stamp(d.lastSuccess);soundLabel();});
 window.addEventListener('pp150:live-failed',e=>{label.dataset.state='stale';label.textContent='● LIVE · VIGA';orders.textContent='Viimased tellimused võivad olla aegunud';stamp(e.detail?.lastSuccess||0);});
 window.addEventListener('pp150:live-stopped',()=>{label.dataset.state='demo';label.textContent='● DEMO';orders.textContent='LIVE käivitamata';stamp(0)});
 sound.addEventListener('click',()=>{if(!window.PPSound)return;const data=window.PPSound.diagnostics?.();if(!data?.enabled){$('soundBtn')?.click()}else window.PPSound.preview();setTimeout(soundLabel,200);});
 document.addEventListener('visibilitychange',soundLabel);soundLabel();
})();
