/* v14.6 — six local, non-destructive kitchen UI improvements */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(_){return d}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot','\'':'&#39;'}[c]));
/* 1: clear kitchen toolbar: live time, accessible shortcut to settings */
const orders=$('ordersPage');
if(orders){
 const strip=document.createElement('div');strip.className='pp146-kitchen-strip';
 strip.innerHTML='<div class="pp146-kitchen-title"><span class="pp146-dot" aria-hidden="true"></span><div><strong>KÖÖGI TÖÖLAUD</strong><small id="pp146-clock">—</small></div></div><button type="button" id="pp146-open-settings" class="pp146-soft-button">⚙ Seaded</button>';
 orders.insertBefore(strip,orders.firstChild);
 const tick=()=>{$('pp146-clock').textContent=new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit',weekday:'short'}).format(new Date())};
 tick();setInterval(tick,30000);
 $('pp146-open-settings').addEventListener('click',()=>document.querySelector('[data-page="settings"]')?.click());
}
/* 2: local notification center, limited to the observed order stream; no server writes */
let events=get('pp146-notification-log',[]);if(!Array.isArray(events))events=[];
events=events.slice(0,30);let baseline=false,seen=new Set(),source='';
const wrap=document.createElement('section');wrap.className='pp146-notifications';wrap.setAttribute('aria-label','Teavituste keskus');
wrap.innerHTML='<div class="pp146-notification-head"><div><span class="pp146-eyebrow">TEAVITUSED</span><h3>Teavituste keskus <b id="pp146-notification-count">0</b></h3></div><div class="pp146-notification-actions"><button id="pp146-notification-toggle" type="button" aria-expanded="false" aria-controls="pp146-notification-body">Näita ▾</button><button id="pp146-notification-clear" type="button">Tühjenda</button></div></div><div id="pp146-notification-body" hidden><div id="pp146-notification-list" class="pp146-notification-list"></div><p class="pp146-footnote">Kohalik teavituste ajalugu selles brauseris. Ei kinnita tellimusi ega muuda LIVE-andmeid.</p></div>';
orders?.appendChild(wrap);
const render=()=>{if(!$('pp146-notification-list'))return;$('pp146-notification-count').textContent=events.length;$('pp146-notification-list').innerHTML=events.length?events.map(e=>`<div class="pp146-event"><span>●</span><div><strong>${esc(e.text)}</strong><small>${esc(e.time)} · ${esc(e.source)}</small></div></div>`).join(''):'<p class="help">Teavitusi veel pole.</p>'};
render();
$('pp146-notification-toggle')?.addEventListener('click',()=>{const body=$('pp146-notification-body'),open=body.hidden;body.hidden=!open;$('pp146-notification-toggle').textContent=open?'Peida ▴':'Näita ▾';$('pp146-notification-toggle').setAttribute('aria-expanded',String(open))});
$('pp146-notification-clear')?.addEventListener('click',()=>{events=[];store('pp146-notification-log',events);render()});
window.addEventListener('pp145:orders',e=>{
 const d=e.detail||{},orders=Array.isArray(d.orders)?d.orders:[],ids=new Set(orders.filter(o=>o.status==='new').map(o=>String(o.id)));
 if(source!==d.source){source=d.source;baseline=false;seen=new Set();}
 if(baseline){
  orders.filter(o=>o.status==='new'&&!seen.has(String(o.id))).forEach(o=>{
   events.unshift({text:'Uus tellimus #'+String(o.id).slice(0,25),time:new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit'}).format(new Date()),source:source||'DEMO'});
  });
  events=events.slice(0,30);store('pp146-notification-log',events);render();
 }
 baseline=true;seen=ids;
});
/* 3: one-tap product filters: uses existing category tabs and search */
const toolbar=document.querySelector('.pp140-toolbar');
if(toolbar){
 const box=document.createElement('div');box.className='pp146-product-quick';
 box.innerHTML='<span>KIIRVALIK</span><button type="button" data-quick-category="Kõik">Kõik tooted</button><button type="button" data-quick-category="Pitsad">🍕 Pitsad</button><button type="button" data-quick-category="Joogid">Joogid</button><button type="button" id="pp146-product-search-focus">⌕ Otsi</button>';
 toolbar.appendChild(box);
 box.querySelectorAll('[data-quick-category]').forEach(b=>b.addEventListener('click',()=>document.querySelector('#pp137-category-tabs [data-category="'+b.dataset.quickCategory+'"]')?.click()));
 $('pp146-product-search-focus')?.addEventListener('click',()=>{$('pp137-product-search')?.focus();$('pp137-product-search')?.scrollIntoView({block:'center',behavior:'smooth'})});
}
/* 4: peak-hour summary computed from the existing hourly bars, never invented */
const insights=document.querySelector('.pp145-insights');
if(insights){
 const peak=document.createElement('p');peak.id='pp146-peak';peak.className='pp146-peak';peak.textContent='Tipptund: andmed puuduvad';insights.querySelector('.pp145-chart-grid')?.before(peak);
 const bars=$('pp145-hourly');
 const update=()=>{const vals=[...bars.querySelectorAll('.pp145-bar')].map(b=>{const m=(b.title||'').match(/(\d+):00\s*·\s*(\d+)/);return m?{h:Number(m[1]),n:Number(m[2])}:null}).filter(Boolean).sort((a,b)=>b.n-a.n);peak.textContent=vals.length?'Kõige aktiivsem tund: '+String(vals[0].h).padStart(2,'0')+':00 · '+vals[0].n+' tellimust':'Tipptund: andmed puuduvad'};
 if(bars){new MutationObserver(update).observe(bars,{childList:true});update();}
}
/* 5: tablet screen settings and fullscreen action (user gesture required) */
const personal=document.querySelector('.pp145-personal');
if(personal){
 const extra=document.createElement('div');extra.className='pp146-screen-tools';
 extra.innerHTML='<div><strong>Ekraanirežiim</strong><small>Tahvelarvuti ja puuteekraani jaoks</small></div><div class="pp146-screen-actions"><button type="button" id="pp146-fullscreen">⛶ Täisekraan</button><button type="button" id="pp146-comfort">Suured nupud: väljas</button></div>';
 personal.appendChild(extra);
 const comfortable=!!get('pp146-comfort',false);document.body.classList.toggle('pp146-comfort',comfortable);
 const label=()=>{$('pp146-comfort').textContent='Suured nupud: '+(document.body.classList.contains('pp146-comfort')?'sees':'väljas')};label();
 $('pp146-comfort').addEventListener('click',()=>{const v=!document.body.classList.contains('pp146-comfort');document.body.classList.toggle('pp146-comfort',v);store('pp146-comfort',v);label()});
 $('pp146-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('pp146-fullscreen').textContent='Täisekraan pole saadaval'}catch(_){$('pp146-fullscreen').textContent='Täisekraan pole saadaval'}});
}
/* 6: tablet-specific layout is implemented in CSS; no changes to column scrolling */
})();
