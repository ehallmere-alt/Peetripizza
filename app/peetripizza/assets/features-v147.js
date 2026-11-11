/* v14.7 — five chosen enhancements, local-only, no LIVE writes. */
(()=>{'use strict';const $=id=>document.getElementById(id);
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(_){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let orders=[],source='DEMO',lastChanged=0;
const page=$('ordersPage');
/* 1 and 2: redesigned summary + per-order deadline state; source is read-only */
const head=document.createElement('div');head.className='pp147-status-strip';head.innerHTML='<div class="pp147-status-heading"><strong>Tellimuste ülevaade</strong><small id="pp147-summary-source">Andmed laadimisel</small></div><div class="pp147-status-counters"><span class="pp147-count-new"><b id="pp147-new">0</b> Uued</span><span class="pp147-count-active"><b id="pp147-active">0</b> Valmistamisel</span><span class="pp147-count-urgent"><b id="pp147-urgent">0</b> Kiireloomulised</span></div>';
page?.querySelector('.pp146-kitchen-strip')?.after(head);
const minutesLeft=o=>{const created=Number(o.created),mins=Number(o.minutes);if(!(created>0)||!(mins>0))return null;return Math.ceil(((Number(o.deadline)>0?Number(o.deadline):created+mins*60000)-Date.now())/60000)};
function refreshSummary(){const pending=orders.filter(o=>o.status==='new'||o.status==='active');const urgent=pending.filter(o=>{const m=minutesLeft(o);return m!==null&&m<=5});if($('pp147-new')){$('pp147-new').textContent=orders.filter(o=>o.status==='new').length;$('pp147-active').textContent=orders.filter(o=>o.status==='active').length;$('pp147-urgent').textContent=urgent.length;$('pp147-summary-source').textContent=source+' · '+(lastChanged?new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit'}).format(lastChanged):'—');}
 const n=$('pp147-deadlines');if(!n)return;n.innerHTML=urgent.length?urgent.slice(0,6).map(o=>{const m=minutesLeft(o);return '<span class="'+(m<=0?'pp147-late':'pp147-soon')+'">#'+escape(o.id)+' · '+(m<=0?'Hilinenud '+Math.abs(m)+' min':'Jäänud '+m+' min')+'</span>'}).join(''):'<span class="pp147-on-time">Kiireloomulisi tellimusi pole</span>';
}
const deadline=document.createElement('div');deadline.id='pp147-deadlines';deadline.className='pp147-deadlines';deadline.setAttribute('aria-label','Kiireloomuliste tellimuste tähtajad');head.after(deadline);
window.addEventListener('pp145:orders',e=>{const d=e.detail||{};orders=Array.isArray(d.orders)?d.orders:[];source=d.source||'DEMO';lastChanged=Date.now();refreshSummary()});
setInterval(refreshSummary,30000);
/* 4: local notification filters, read-state and mute repeating audio preference */
const notifications=document.querySelector('.pp146-notifications');
if(notifications){
 const actions=document.createElement('div');actions.className='pp147-notification-tools';
 actions.innerHTML='<label>Vaade <select id="pp147-notification-filter"><option value="all">Kõik</option><option value="unread">Lugemata</option></select></label><button id="pp147-mark-read" type="button">Märgi loetuks</button><button id="pp147-mute-repeat" type="button">Kordusheli: —</button>';
 notifications.querySelector('#pp146-notification-body')?.prepend(actions);
 const list=$('pp146-notification-list'),count=$('pp146-notification-count');
 const readCount=()=>Math.max(0,Number(read('pp147-read-count',0))||0);
 const repaint=()=>{if(!list)return;const all=[...list.querySelectorAll('.pp146-event')];const unread=Math.max(0,all.length-readCount());all.forEach((el,i)=>{el.hidden=$('pp147-notification-filter')?.value==='unread'&&i>=unread});count.title=unread+' lugemata';$('pp147-mark-read').textContent='Märgi loetuks ('+unread+')'};
 const obs=new MutationObserver(repaint);if(list)obs.observe(list,{childList:true});
 $('pp147-notification-filter')?.addEventListener('change',repaint);
 $('pp147-mark-read')?.addEventListener('click',()=>{write('pp147-read-count',list?.querySelectorAll('.pp146-event').length||0);repaint()});
 const prefs=()=>read('pp145-preferences',{});
 const muteLabel=()=>{$('pp147-mute-repeat').textContent='Kordusheli: '+(prefs().repeat?'sees':'väljas')};muteLabel();
 $('pp147-mute-repeat')?.addEventListener('click',()=>{const p=prefs();p.repeat=!p.repeat;write('pp145-preferences',p);const input=$('pp145-repeat-enabled');if(input){input.checked=p.repeat;input.dispatchEvent(new Event('change',{bubbles:true}))}muteLabel()});
}
/* 6: touch protection for irreversible-looking local actions; user can opt out */
const setting=document.querySelector('.pp145-personal');if(setting){
 const box=document.createElement('label');box.className='pp147-safety-option';box.innerHTML='<input type="checkbox" id="pp147-confirm-ready"> Küsi enne „Valmis” vajutamist kinnitust (kohalikud demotoimingud)';
 setting.appendChild(box);$('pp147-confirm-ready').checked=!!read('pp147-confirm-ready',false);
 $('pp147-confirm-ready').addEventListener('change',e=>write('pp147-confirm-ready',e.target.checked));
}
document.addEventListener('click',e=>{if(!read('pp147-confirm-ready',false))return;const btn=e.target.closest('button');if(!btn||btn.dataset.pp147Confirmed)return;if(!/^(valmis|✓\s*valmis)$/i.test((btn.textContent||'').trim()))return;if(!btn.closest('#ordersPage'))return;
 // LIVE action remains preview-only. Never add a write path.
 if(!window.confirm('Kas märkida see tellimus valmis?')){e.preventDefault();e.stopImmediatePropagation();return}
 btn.dataset.pp147Confirmed='1';queueMicrotask(()=>delete btn.dataset.pp147Confirmed);
},true);
if(window.pp145LatestSnapshot){const d=window.pp145LatestSnapshot;orders=Array.isArray(d.orders)?d.orders:[];source=d.source||'DEMO';lastChanged=Date.now();refreshSummary();}
})();
