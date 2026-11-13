/* Peetri Pizza: 64 scripts in one file, same run order as the separate <script> tags (tools/js-bundle.js). Do not edit; edit the sources and rebuild. */
/* == assets/kitchen-v113.js == */
try{(function(){
 'use strict';
/* 11.1: Only one LIVE action and one Valmis toggle, both in topbar. */
(()=>{
 const body=document.body,page=document.getElementById('ordersPage');
 const liveSlot=document.getElementById('pp111-live-slot');
 const tools=document.getElementById('pp111-tools-panel');
 const toolsToggle=document.getElementById('pp111-tools-toggle');
 const toolsActions=document.getElementById('pp111-tools-actions');
 const filtersMount=document.getElementById('pp111-tools-filters');
 const ready=document.getElementById('toggleHistory');
 const readyPanel=page?.querySelector('.history-panel');
 const doneCount=document.getElementById('doneCount');
 if(!page||!liveSlot||!tools||!toolsToggle||!toolsActions||!ready||!readyPanel)return;
 const live=document.querySelector('.dashboard-display-controls button.secondary:not(#toggleOverview)');
 const liveInfo=document.querySelector('.dashboard-display-controls .live-monitor');
 if(live){live.classList.add('pp111-live-button');liveSlot.append(live);}
 if(liveInfo){liveInfo.classList.add('pp111-live-info');liveInfo.setAttribute('aria-live','polite');liveSlot.append(liveInfo);}
 ready.classList.add('pp111-ready-button');
 function readyState(){
  const opened=ready.getAttribute('aria-expanded')==='true';
  readyPanel.classList.toggle('pp-ready-open',opened);
  ready.setAttribute('aria-label',opened?'Peida valmis tellimused':'Näita valmis tellimused');
  ready.classList.toggle('pp111-ready-open',opened);
 }
 new MutationObserver(readyState).observe(ready,{attributes:true,attributeFilter:['aria-expanded']});
 ready.addEventListener('click',()=>requestAnimationFrame(readyState));
 if(doneCount)new MutationObserver(readyState).observe(doneCount,{childList:true,characterData:true,subtree:true});
 readyState();
 // Secondary tools are available on demand, not as duplicate kitchen banners.
 for(const id of ['demoAdd','returnDemo']){const item=document.getElementById(id);if(item){item.classList.add('pp111-secondary-action');toolsActions.append(item);}}
 const filterGroup=page.querySelector('.filtergroup');if(filterGroup)filtersMount.append(filterGroup);
 const compact=document.createElement('button');compact.type='button';compact.className='pp111-secondary-action';compact.id='pp111-compact';
 toolsActions.append(compact);
 function updateCompact(){const v=!!document.getElementById('compactMode')?.checked;compact.textContent=v?'▣ Tavaline vaade':'▦ Tihe vaade';compact.setAttribute('aria-pressed',String(v));}
 compact.addEventListener('click',()=>{const input=document.getElementById('compactMode');if(!input)return;input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));updateCompact();});
 new MutationObserver(updateCompact).observe(body,{attributes:true,attributeFilter:['class']});updateCompact();
 const full=document.createElement('button');full.type='button';full.className='pp111-secondary-action';full.textContent='⛶ Täisekraan';
 full.addEventListener('click',()=>document.getElementById('fullscreenKitchen')?.click());toolsActions.append(full);
 const source=document.getElementById('dataSourceLabel');
 const sourceMount=document.getElementById('pp111-source');if(source&&sourceMount)sourceMount.append(source);
 function setTools(open){tools.hidden=!open;toolsToggle.setAttribute('aria-expanded',String(open));toolsToggle.classList.toggle('is-open',open);}
 setTools(false);
 toolsToggle.addEventListener('click',()=>setTools(tools.hidden));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!tools.hidden){setTools(false);toolsToggle.focus();return;}if(ready.getAttribute('aria-expanded')==='true'&&!document.querySelector('dialog[open]')){ready.click();ready.focus();}}});
 document.addEventListener('click',e=>{if(!tools.hidden&&!tools.contains(e.target)&&!toolsToggle.contains(e.target))setTools(false);});
 // Preserve the existing mobile queue-switch workflow; don't change queue scrolling.
 const tabs=[...page.querySelectorAll('[data-pp109-tab]')];let tab='new';
 function setTab(next){if(!['new','active'].includes(next))return;tab=next;page.dataset.pp109Tab=next;tabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pp109Tab===next)));}
 tabs.forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.pp109Tab)));setTab('new');
 const queueCounts=[['newOrders','newCount','pp109-tab-new'],['activeOrders','activeCount','pp109-tab-active']];
 let scheduled=false;function counts(){scheduled=false;for(const [,source,target] of queueCounts){const el=document.getElementById(target);if(el)el.textContent=document.getElementById(source)?.textContent||'0';}}
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(counts);}
 for(const [list] of queueCounts){const el=document.getElementById(list);if(el)new MutationObserver(schedule).observe(el,{childList:true});}
 counts();
 body.dataset.peetriBuild='11.1.0';
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/valmis-v134.js == */
try{(function(){
/* v11.3: optional per-order ingredients; no LIVE mutations. */
(()=>{'use strict';
 const list=document.getElementById('doneOrders'),tools=document.getElementById('historyTools');
 if(!list||!tools)return;
 const collapsed=new Set();let allCollapsed=false;let pending=false;
 const all=document.createElement('button');all.type='button';all.className='pp113-all-toggle';all.textContent='Peida lisandid';
 tools.appendChild(all);
 const cards=()=>Array.from(list.querySelectorAll('.pp112-done-card'));
 function decorate(){pending=false;for(const card of cards()){
   const key=card.getAttribute('aria-label')||'';
   const hasAdded=!!card.querySelector('.pp94-extras');
   const compact=collapsed.has(key)||allCollapsed;
   if(!hasAdded){card.classList.remove('pp113-compact');card.querySelector('.pp113-detail-toggle')?.remove();continue;}
   card.classList.toggle('pp113-compact',compact);
   let button=card.querySelector('.pp113-detail-toggle');
   if(!button){button=document.createElement('button');button.type='button';button.className='pp113-detail-toggle';
     button.dataset.key=key;card.querySelector('.pp112-card-footer')?.prepend(button);}
   button.textContent=compact?'+ Lisandid':'− Lisandid';button.setAttribute('aria-expanded',String(!compact));
 }
 const total=cards().filter(card=>card.querySelector('.pp94-extras')).length;
 all.hidden=total===0;
 all.textContent=allCollapsed?'Näita kõiki lisandeid':'Peida kõik lisandid';
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(decorate);}
 list.addEventListener('click',e=>{const b=e.target.closest('.pp113-detail-toggle');if(!b)return;
 const key=b.dataset.key;if(allCollapsed){allCollapsed=false;for(const card of cards())collapsed.add(card.getAttribute('aria-label')||'');}
 if(collapsed.has(key))collapsed.delete(key);else collapsed.add(key);decorate();});
 all.addEventListener('click',()=>{allCollapsed=!allCollapsed;collapsed.clear();decorate();});
 new MutationObserver(schedule).observe(list,{childList:true});decorate();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/header-v115.js == */
try{(function(){
/* Shared kitchen waiting time for the signed-in pizzeria. Never writes upstream. */
(()=>{'use strict';
 const select=document.getElementById('pp114-wait-select');if(!select)return;
 const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
 const values=['15','20','30','45','60'];let latest=null, saving=false;
 const label=document.createElement('span');label.id='pp115-wait-status';label.setAttribute('role','status');label.style.cssText='font-size:11px;color:#54715c;margin-left:4px';select.parentElement.appendChild(label);
 function update(value){if(!values.includes(String(value)))return;latest=String(value);if(!saving)select.value=latest;document.dispatchEvent(new CustomEvent('peetri:wait-time-change',{detail:{minutes:Number(latest),scope:'pizzeria'}}));}
 async function load(){if(saving)return;try{const r=await fetch('api/wait-time.php',{credentials:'same-origin',cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error('server');update(d.minutes);label.textContent='';}catch(_){label.textContent='Ühendus puudub';}}
 select.addEventListener('change',async()=>{if(!values.includes(select.value))return;const chosen=select.value;saving=true;select.disabled=true;label.textContent='Salvestan…';try{const r=await fetch('api/wait-time.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({minutes:Number(chosen)})});const d=await r.json();if(!r.ok||!d.ok)throw Error('save');update(d.minutes);label.textContent='✓';}catch(_){label.textContent='Ei salvestatud';if(latest)select.value=latest;}finally{saving=false;select.disabled=false;setTimeout(()=>{if(label.textContent==='✓')label.textContent='';},2500);}});
 load();setInterval(()=>{if(!document.hidden)load();},12000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/header-v130.js == */
try{(function(){
/* v13.0: kitchen-mode quick toggle; dispatches the existing native control. */
(()=>{
 const btn=document.getElementById('pp130-focus');
 const checkbox=document.getElementById('focusMode');
 if(!btn||!checkbox)return;
 function sync(){
  const active=checkbox.checked;
  btn.setAttribute('aria-pressed',String(active));
  btn.classList.toggle('pp130-enabled',active);
  btn.setAttribute('title',active?'Lülita köögirežiim välja':'Lülita köögirežiim sisse');
 }
 btn.addEventListener('click',()=>{
  checkbox.checked=!checkbox.checked;
  checkbox.dispatchEvent(new Event('change',{bubbles:true}));
  sync();
 });
 checkbox.addEventListener('change',sync);
 const observer=new MutationObserver(sync);
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 sync();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/header-v132.js == */
try{(function(){
/* v13.1: read-only urgency overview from currently rendered kitchen tickets. */
(()=>{
 const urgent=document.getElementById('pp131-urgent-count');
 const late=document.getElementById('pp131-late-count');
 const lateBadge=document.getElementById('pp131-overdue');
 const widget=document.getElementById('pp131-urgency');
 const label=widget?.querySelector('.pp131-urgency-label');
 const hosts=[document.getElementById('newOrders'),document.getElementById('activeOrders')];
 if(!urgent||!late||!lateBadge||!widget||hosts.some(h=>!h))return;
 let scheduled=false;
 const update=()=>{
   scheduled=false;
   let urgentCount=0,lateCount=0;
   for(const host of hosts){
     for(const card of host.querySelectorAll('.ordercard[data-order-id]')){
       if(card.classList.contains('urgency-late')){urgentCount++;lateCount++;}
       else if(card.classList.contains('urgency-soon')){urgentCount++;}
     }
   }
   // v17.1: write only on change, so the 1s timer tick does not cascade into other observers.
   const set=(el,v)=>{if(el.textContent!==v)el.textContent=v};
   set(urgent,String(urgentCount));
   set(late,String(lateCount));
   if(lateBadge.hidden!==(lateCount===0))lateBadge.hidden=lateCount===0;
   if(label)set(label,urgentCount>0?'Kiire':'Rahulik');
   widget.classList.toggle('pp131-alert',urgentCount>0);
   widget.classList.toggle('pp132-calm',urgentCount===0);
   widget.classList.toggle('pp131-critical',lateCount>0);
   const aria=`Kiired tellimused: ${urgentCount}; hilinenud tellimused: ${lateCount}`;if(widget.getAttribute('aria-label')!==aria)widget.setAttribute('aria-label',aria);
 };
 const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(update);};
 const observer=new MutationObserver(schedule);
 hosts.forEach(h=>observer.observe(h,{childList:true,subtree:true,attributes:true,attributeFilter:['class']}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 schedule();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/header-v133.js == */
try{(function(){
/* Peetri Pizza 13.3 — read-only kitchen load status. */
(()=>{
 'use strict';
 const n=document.getElementById('newOrders');
 const a=document.getElementById('activeOrders');
 const box=document.getElementById('pp133-load');
 const label=document.getElementById('pp133-load-label');
 if(!n||!a||!box||!label)return;
 let queued=false;
 function update(){
   queued=false;
   const total=n.querySelectorAll('.ordercard[data-order-id]').length+a.querySelectorAll('.ordercard[data-order-id]').length;
   const level=total>=6?3:total>=3?2:1;
   const names=['','Rahulik','Mõõdukas','Kiire'];
   box.dataset.level=String(level);
   label.textContent=names[level];
   box.setAttribute('aria-label',`Köögi koormus: ${names[level]}. Nähtavaid tellimusi: ${total}.`);
   box.title=`Köögi koormus: ${names[level]} · ${total} nähtavat tellimust`;
 }
 function queue(){if(queued)return;queued=true;window.requestAnimationFrame(update);}
 const observer=new MutationObserver(queue);
 observer.observe(n,{childList:true});
 observer.observe(a,{childList:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue();});
 update();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/online-v142.js == */
try{(function(){
/* v14.2 — A small, honest LIVE connection indicator.
 * It turns green ONLY after a successful, recent response from the read-only LIVE orders API.
 * Amber = connection in progress; red = failed/stale; grey = demo/preview/off.
 */
(()=>{'use strict';
 const indicator=document.getElementById('pp142-online');
 const liveStatus=document.querySelector('.live-monitor');
 if(!indicator)return;
 // Retire both earlier focus variants so a persisted hidden mode cannot trap the kitchen UI.
 try{if(typeof setFocusMode==='function')setFocusMode(false);if(typeof setKitchenFocus==='function')setKitchenFocus(false);}catch(_){document.body.classList.remove('focus-kitchen','kitchen-focus');}
 // Remove the redundant Tools menu without removing its useful filters or Demo return path.
 const filterGroup=document.querySelector('#pp111-tools-panel .filtergroup');
 const searchPanel=document.getElementById('kitchenTools');
 if(filterGroup&&searchPanel)searchPanel.prepend(filterGroup);
 const demoButton=document.getElementById('demoAdd');
 const heroActions=document.querySelector('.hero-actions');
 if(demoButton&&heroActions)heroActions.append(demoButton);
 const returnDemo=document.getElementById('returnDemo');
 const displayControls=document.querySelector('.dashboard-display-controls');
 if(returnDemo&&displayControls)displayControls.append(returnDemo);
 const text={online:'LIVE ühendatud',connecting:'LIVE ühendamine…',offline:'LIVE ühendus katkes või andmed aegusid',demo:'Demo / ei ole LIVE-ühendust'};
 let last='';
 function paint(){
   const info=document.querySelector('.live-monitor');
   const live=document.body.classList.contains('live-active');
   const failure=document.body.classList.contains('live-connection-error');
   const state=info?.dataset.state||'';
   const success=Number(info?.dataset.lastSuccess||0);
   const recent=success>0&&Date.now()-success<35000;
   const kind=!live?'demo':failure||state==='error'||(success>0&&!recent)?'offline':state==='ok'&&recent?'online':'connecting';
   if(kind===last)return;
   last=kind;
   indicator.dataset.state=kind;
   indicator.title=text[kind];
   indicator.setAttribute('aria-label',text[kind]);
   indicator.setAttribute('aria-live',kind==='offline'?'polite':'off');
 }
 const observer=new MutationObserver(paint);
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 if(liveStatus)observer.observe(liveStatus,{attributes:true,childList:true,characterData:true,subtree:true,attributeFilter:['data-state','data-last-success']});
 // Live-monitor may have been moved into the topbar by the existing kitchen script.
 setInterval(paint,5000);
 document.addEventListener('visibilitychange',paint);
 paint();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/features-v145.js == */
try{(function(){
/* Peetri Pizza 14.5 — strictly local view enhancements; no remote writes. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch(_){return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const prefKey='pp145-preferences';
const validText=new Set(['normal','large','xl']),validDensity=new Set(['normal','tight']);
let prefs=load(prefKey,{text:'normal',density:'normal',contrast:false,urgent:false,repeat:false});
if(!prefs||typeof prefs!=='object')prefs={};
prefs={text:validText.has(prefs.text)?prefs.text:'normal',density:validDensity.has(prefs.density)?prefs.density:'normal',contrast:!!prefs.contrast,urgent:!!prefs.urgent,repeat:!!prefs.repeat};
function applyPrefs(){
 document.documentElement.style.setProperty('--pp145-text-scale',({normal:1,large:1.12,xl:1.22})[prefs.text]);
 document.documentElement.style.setProperty('--pp145-gap',prefs.density==='tight'?'8px':'16px');
 document.body.classList.toggle('pp145-contrast',prefs.contrast);
 const controls={'pp145-text-scale':prefs.text,'pp145-density':prefs.density,'pp145-contrast':prefs.contrast,'pp145-urgent-enabled':prefs.urgent,'pp145-repeat-enabled':prefs.repeat};
 Object.keys(controls).forEach(id=>{const el=$(id);if(el){if(el.type==='checkbox')el.checked=controls[id];else el.value=controls[id]}});
}
applyPrefs();
['pp145-text-scale','pp145-density','pp145-contrast','pp145-urgent-enabled','pp145-repeat-enabled'].forEach(id=>{
 $(id)?.addEventListener('change',e=>{
  const key={'pp145-text-scale':'text','pp145-density':'density','pp145-contrast':'contrast','pp145-urgent-enabled':'urgent','pp145-repeat-enabled':'repeat'}[id];
  prefs[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;save(prefKey,prefs);applyPrefs();
 });
});
$('pp145-settings-reset')?.addEventListener('click',()=>{prefs={text:'normal',density:'normal',contrast:false,urgent:prefs.urgent,repeat:prefs.repeat};save(prefKey,prefs);applyPrefs()});
$('pp145-test-urgent')?.addEventListener('click',()=>window.PPSound?.preview('urgent'));
let currentOrders=[],currentSource='DEMO';
const identified=new Set(),urgentSignaled=new Set();
let baselineReady=false,lastReminder=0;
function pizzaName(raw){
 // Count only product names known to be pizzas; unknown products must not be mislabeled.
 const name=String(raw||'').replace(/\s*\((?:large|small)\).*/i,'').replace(/\s*[—–].*/,'').trim();
 if(/\b(pizza|pitsa)\b/i.test(name))return name;
 if(/^(pepperoni|margherita|margarita|hawaii|bolognese|topolino|bbq kana)(?:\s|$)/i.test(name))return name;
 return '';
}
function updateStats(){
 const done=currentOrders.filter(x=>x.status==='done');
 const counts=new Map();let pizzaTotal=0;
 done.forEach(o=>(o.items||[]).forEach(([raw,qty])=>{const name=pizzaName(raw);if(!name)return;const amount=Math.max(0,Math.min(1000,Number(qty)||0));pizzaTotal+=amount;counts.set(name,(counts.get(name)||0)+amount)}));
 const averageValues=done.filter(o=>Number.isFinite(o.created)&&o.created>0&&o.completed>=o.created).map(o=>(o.completed-o.created)/60000).filter(x=>x>=0&&x<1440);
 $('pp145-pizza-total').textContent=String(pizzaTotal);
 $('pp145-done-total').textContent=String(done.length);
 $('pp145-average-time').textContent=averageValues.length?`${Math.round(averageValues.reduce((a,b)=>a+b,0)/averageValues.length)} min`:'—';
 $('pp145-stats-source').textContent=currentSource==='LIVE'?'LIVE · LAADITUD':currentSource==='JSON'?'JSON · EELVAADE':'DEMO';
 const bins=new Array(24).fill(0);currentOrders.forEach(o=>{if(o.created>0&&Number.isFinite(o.created)){const d=new Date(o.created);if(!isNaN(d))bins[d.getHours()]++}});
 const values=bins.map((count,hour)=>({hour,count})).filter(({count})=>count>0);
 const hours=values.length?Array.from({length:Math.min(8,Math.max(3,values[values.length-1].hour-values[0].hour+1))},(_,i)=>values.length>8?values[Math.round(i*(values.length-1)/7)].hour:Math.max(0,values[0].hour+i)).filter((h,i,a)=>a.indexOf(h)===i):[];
 const max=Math.max(1,...bins);
 $('pp145-hourly').innerHTML=hours.length?hours.map(h=>`<div class="pp145-bar" title="${h}:00 · ${bins[h]} tellimust"><i style="height:${Math.max(3,Math.round(bins[h]/max*104))}px"></i><b>${h}:00</b></div>`).join(''):'<p class="help">Tellimuste ajad puuduvad.</p>';
 $('pp145-hourly').setAttribute('aria-label',`Tellimusi kokku ${currentOrders.length}; jaotus tundide järgi`);
 const ranked=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,5),maximum=ranked[0]?.[1]||1;
 $('pp145-top-pizzas').innerHTML=ranked.length?ranked.map(([name,num])=>{
  const text=name.replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[x]));
  return `<div class="pp145-rank-row"><span>${text}</span><strong>${num}×</strong><div class="pp145-rank-track"><i style="width:${Math.round(100*num/maximum)}%"></i></div></div>`;
 }).join(''):'<p class="help">Valmis pitsasid ei ole laaditud.</p>';
}
// Sound only for known outstanding new orders; never on initial data loading, and never on each poll.
function checkAlerts(){
 if(!baselineReady||!prefs.urgent||document.hidden)return;
 const now=Date.now();
 for(const o of currentOrders){
  if(o.status!=='new'||!identified.has(o.id))continue;
  const deadline=Number(o.deadline)>0?Number(o.deadline):(Number(o.created)||0)+(Number(o.minutes)||20)*60000;
  if(o.created>0&&now>=deadline-5*60000&&!urgentSignaled.has(o.id)){
   urgentSignaled.add(o.id);window.PPSound?.play('urgent');
  }
 }
}
window.addEventListener('pp145:orders',e=>{
 const d=e.detail||{};const next=Array.isArray(d.orders)?d.orders:[];
 if(d.source!==currentSource){currentSource=d.source;identified.clear();urgentSignaled.clear();baselineReady=false;lastReminder=0;}
 currentOrders=next;
 const liveIDs=new Set(next.filter(o=>o.status==='new').map(o=>o.id));
 for(const id of [...identified])if(!liveIDs.has(id))identified.delete(id);
 for(const id of [...urgentSignaled])if(!liveIDs.has(id))urgentSignaled.delete(id);
 if(!baselineReady){next.forEach(o=>{if(o.status==='new'){identified.add(o.id);urgentSignaled.add(o.id)}});baselineReady=true;lastReminder=Date.now();}
 else next.forEach(o=>{if(o.status==='new'&&!identified.has(o.id)){identified.add(o.id);/* new-order alert handled by existing LIVE system */}});
 updateStats();checkAlerts();
});
if(window.pp145LatestSnapshot){window.dispatchEvent(new CustomEvent('pp145:orders',{detail:window.pp145LatestSnapshot}));}
setInterval(()=>{
 if(!baselineReady||document.hidden)return;
 checkAlerts();
 // v17.50 (owner): repeat every 30 s (was 2 min), in DEMO too; a pre-order more than an hour ahead does not ring; quiet on the night screen.
 if(!prefs.repeat||currentSource==='JSON')return;
 const nowMs=Date.now();
 const pending=currentOrders.some(o=>o.status==='new'&&!(o.deadlineSource==='official'&&Number(o.deadline)-nowMs>=3600000));
 const night=!!document.getElementById('pp1718-night')&&!document.getElementById('pp1718-night').hidden;
 if(pending&&!night&&nowMs-lastReminder>=30000){lastReminder=nowMs;window.PPSound?.play('new')}
 else if(!pending)lastReminder=0;
},15000);
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/features-v146.js == */
try{(function(){
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
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/features-v147.js == */
try{(function(){
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
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/features-v148.js == */
try{(function(){
/* v14.8: five selected improvements. Read-only LIVE. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const clean=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const ordersPage=$('ordersPage');let snapshot=[],origin='DEMO';
/* 1+2: operational urgency panel, derived from order-specific time limits */
const panel=document.createElement('section');panel.className='pp148-urgency-panel';
panel.innerHTML='<div class="pp148-urgency-head"><strong>Tellimuste tähtajad</strong><span id="pp148-overdue-count">0 hilinenud</span></div><div id="pp148-urgency-list" class="pp148-urgency-list"><span class="pp148-ok">Kõik graafikus</span></div>';
ordersPage?.querySelector('.pp147-deadlines')?.after(panel);
const remaining=o=>{const c=Number(o.created),m=Number(o.minutes);return c>0&&m>0?Math.ceil(((Number(o.deadline)>0?Number(o.deadline):c+m*60000)-Date.now())/60000):null};
function refresh(){const active=snapshot.filter(o=>['new','active'].includes(o.status));const urgent=active.map(o=>({...o,left:remaining(o)})).filter(o=>o.left!==null&&o.left<=5).sort((a,b)=>a.left-b.left);
$('pp148-overdue-count').textContent=urgent.filter(o=>o.left<=0).length+' hilinenud';
$('pp148-urgency-list').innerHTML=urgent.length?urgent.slice(0,8).map(o=>'<span class="'+(o.left<=0?'pp148-overdue':'pp148-soon')+'">#'+clean(o.id)+' · '+(o.left<=0?'Hilinenud '+Math.abs(o.left)+' min':'Jäänud '+o.left+' min')+'</span>').join(''):'<span class="pp148-ok">Kiireloomulisi tellimusi pole</span>';
}
window.addEventListener('pp145:orders',e=>{snapshot=Array.isArray(e.detail?.orders)?e.detail.orders:[];origin=e.detail?.source||'DEMO';refresh()});setInterval(refresh,30000);
/* 3: sound studio preview. Does not replace or modify live notification logic. */
const sound=document.querySelector('.pp141-sound-settings');
if(sound){
const box=document.createElement('div');box.className='pp148-sound-studio';
box.innerHTML='<div><strong>Helistuudio · kiire tellimus</strong><small>Vali hoiatusheli tugevus ja kuula näidist. Olemasolevad LIVE-teavitused jäävad samaks.</small></div><div class="pp148-sound-controls"><label>Hoiatuse tugevus <input id="pp148-urgent-volume" type="range" min="0" max="100" step="5"><output id="pp148-urgent-volume-label"></output></label><button id="pp148-preview-urgent" type="button">♫ Kuula hoiatust</button></div>';
sound.appendChild(box);
const slider=$('pp148-urgent-volume');slider.value=load('pp148-urgent-volume',65);
const show=()=>{$('pp148-urgent-volume-label').textContent=slider.value+'%'};show();
slider.addEventListener('input',()=>{save('pp148-urgent-volume',Number(slider.value));show()});
$('pp148-preview-urgent').addEventListener('click',async()=>{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const ctx=new Audio();try{await ctx.resume();const now=ctx.currentTime;[0,.17,.34].forEach((delay,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=i===1?950:750;g.gain.setValueAtTime(.0001,now+delay);g.gain.exponentialRampToValueAtTime(Math.max(.0001,Number(slider.value)/100*.12),now+delay+.015);g.gain.exponentialRampToValueAtTime(.0001,now+delay+.14);o.connect(g).connect(ctx.destination);o.start(now+delay);o.stop(now+delay+.15)});setTimeout(()=>ctx.close().catch(()=>{}),900)}catch{ctx.close().catch(()=>{})}});
}
/* 4: order details via click, display only fields supplied by order data */
const modal=document.createElement('dialog');modal.className='pp148-details';modal.innerHTML='<div class="pp148-dialog-head"><h3 id="pp148-dialog-title">Tellimuse andmed</h3><button id="pp148-close" type="button" aria-label="Sulge">✕</button></div><div id="pp148-dialog-content"></div>';
document.body.appendChild(modal);$('pp148-close').addEventListener('click',()=>modal.close());
const detailsBtn=document.createElement('button');detailsBtn.type='button';detailsBtn.className='pp148-details-button';detailsBtn.textContent='Tellimuse detailid';
ordersPage?.querySelector('.pp148-urgency-head')?.appendChild(detailsBtn);
detailsBtn.addEventListener('click',()=>{const rows=snapshot.slice(0,30).map((o,i)=>'<button class="pp148-order-row" type="button" data-pp148-index="'+i+'">#'+clean(o.id)+' · '+clean(o.status)+'</button>').join('');$('pp148-dialog-title').textContent='Tellimuste detailid';$('pp148-dialog-content').innerHTML=rows||'<p>Tellimusi pole laaditud.</p>';modal.showModal()});
modal.addEventListener('click',e=>{const b=e.target.closest('[data-pp148-index]');if(!b)return;const o=snapshot[Number(b.dataset.pp148Index)];if(!o)return;$('pp148-dialog-title').textContent='Tellimus #'+String(o.id);
const items=(o.items||[]).map(x=>'<li>'+clean(Array.isArray(x)?x[0]:x.name||x.title)+' · '+clean(Array.isArray(x)?x[1]:x.quantity||1)+'</li>').join('');
const comment=o.comment||o.notes||o.customerComment||'Kommentaar puudub';$('pp148-dialog-content').innerHTML='<p><b>Staatus:</b> '+clean(o.status)+'</p><p><b>Allikas:</b> '+clean(origin)+'</p><p><b>Kommentaar:</b> '+clean(comment)+'</p><ul>'+items+'</ul><button id="pp148-back" type="button">← Tagasi nimekirja</button>';$('pp148-back').addEventListener('click',()=>detailsBtn.click())});
/* 6: deliberate tablet lock; blocks menu/settings only, never order cards or controls */
let locked=!!load('pp148-tablet-lock',false);
const lock=document.createElement('button');lock.id='pp148-tablet-lock';lock.type='button';lock.className='pp148-lock';lock.setAttribute('aria-pressed',String(locked));
document.querySelector('.pp146-kitchen-strip')?.appendChild(lock);
const draw=()=>{lock.textContent=locked?'🔒 Ava menüü':'🔓 Lukusta menüü';lock.setAttribute('aria-pressed',String(locked));document.body.classList.toggle('pp148-locked',locked)};draw();
lock.addEventListener('click',()=>{locked=!locked;save('pp148-tablet-lock',locked);draw()});
document.addEventListener('click',e=>{if(!locked)return;const b=e.target.closest('#menuBtn,#pp146-open-settings,[data-page="settings"]');if(b){e.preventDefault();e.stopImmediatePropagation()}},true);
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/live-v149.js == */
try{(function(){
/* Peetri Pizza v14.9: manual, authenticated LIVE read-only health check */
(()=>{'use strict';const $=id=>document.getElementById(id);
const test=$('pp149-test-live'),status=$('pp149-test-status'),result=$('pp149-test-result');if(!test||!status||!result)return;
const map={connected:'API töötab ja pizzeria seanss kehtib.',upstream_auth_failed:'Peetri Pizza API seanss on aegunud või puuduvad õigused. Logi uuesti sisse.',upstream_session_missing:'Peetri Pizza API seanss puudub. Logi uuesti sisse.',pizzeria_login_required:'Pizzeria ei ole sisse logitud.',authentication_required:'Töölaua sisselogimine on aegunud.',network_error:'Ühendus Peetri Pizza serveriga ebaõnnestus.',upstream_error:'Peetri Pizza API vastas veaga.',invalid_json:'API tagastas vigased JSON-andmed.',unexpected_schema:'Tellimuste andmevorming on muutunud.',too_many_orders:'Tellimuste vastus on ebatavaliselt suur.',curl_unavailable:'PHP cURL moodul puudub.',too_many_checks:'Järgmise testini tuleb veidi oodata.'};
function show(text,state='error'){status.dataset.state=state;status.textContent=text;}
test.addEventListener('click',async()=>{
 test.disabled=true;result.hidden=true;show('Ühenduse kontrollimine…','testing');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);
 try{
  const response=await fetch('api/live-health.php',{credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
  const data=await response.json();const state=data.state||'upstream_error';
  if(!response.ok||!data.ok){show(map[state]||'API ühendust ei saanud kontrollida.');if(state==='too_many_checks'&&data.retry_after)show('Proovi uuesti '+Number(data.retry_after)+' s pärast.');return;}
  show('● LIVE ühendus töötab','ok');
  const p=data.pizzeria||{};
  const row=(a,b)=>{const div=document.createElement('div');const key=document.createElement('span'),val=document.createElement('strong');key.textContent=a;val.textContent=b;div.append(key,val);return div};
  result.replaceChildren(row('Pizzeria',String(p.name||'')+' · ID '+String(p.id||'—')),row('Laaditud tellimusi',String(data.orders_count)),row('API vastusaeg',String(data.latency_ms)+' ms'),row('Juurdepääs','AINULT LUGEMISEKS'));
  result.hidden=false;
 }catch(_){show('Päring aegus või ühendus katkestati.','error')}
 finally{clearTimeout(timer);test.disabled=false;}
});
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/live-v150.js == */
try{(function(){
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
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/live-v154.js == */
try{(function(){
/* Peetri Pizza 15.4: diagnostics + guarded alert preferences + disabled customer bridge.
   No new Peetri Pizza upstream writes. Uses existing LIVE polling events. */
(()=>{'use strict';
const $=id=>document.getElementById(id),base=document.getElementById('ordersPage');if(!base)return;
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let prefs=get('pp154-alert-prefs',{overdue:true,offline:true}),everConnected=false,down=false,lastSuccess=0,latency=null,failures=0,baseline=false;
let state=new Map(),lastUrgentSound=0;
const box=document.createElement('section');box.className='pp154-sync';box.setAttribute('aria-label','LIVE sünkroonimise seis');
box.innerHTML=`<div class="pp154-sync-top"><div><strong>LIVE ühendus <span id="pp154-led" data-state="demo">●</span></strong><small id="pp154-sync-message">LIVE pole käivitatud</small></div><div class="pp154-sync-actions"><button id="pp154-refresh" type="button">↻ Kontrolli</button><button id="pp154-alert-toggle" type="button" aria-expanded="false">♫ Hoiatused</button></div></div>
<div id="pp154-stale" class="pp154-stale" hidden role="alert"><strong>⚠ LIVE-andmed ei ole värsked</strong><p>Viimased tellimused võivad olla vananenud. Kontrolli tellimusi ametlikust süsteemist. Köögisiseste olekute muutmine pole lubatud.</p></div>
<div id="pp154-alert-settings" class="pp154-alert-settings" hidden><label><input id="pp154-overdue-alert" type="checkbox"> Üle aja läinud tellimuse heli (üks kord)</label><label><input id="pp154-offline-alert" type="checkbox"> Ühenduse katkemise heli (üks kord)</label><p>Uue tellimuse heli juhitakse olemasoleva ♫ nupuga. iPad vajab heli aktiveerimiseks puudutust.</p></div>
<details class="pp154-diagnostics"><summary>Ühenduse üksikasjad · klienditeavitused</summary><div class="pp154-sync-stats"><span>Viimati: <b id="pp154-last">—</b></span><span>Vastus: <b id="pp154-latency">—</b></span><span>Tõrked: <b id="pp154-fails">0</b></span><span>Staatus: <b id="pp154-official">Ainult lugemine</b></span></div>
<div class="pp154-bridge"><div><strong>🔒 Klienditeavituste ühendus</strong><small id="pp154-bridge-status">Ametliku API kirjutusõigus kontrollimata · kliendid ei näe köögisiseseid olekuid.</small></div><button id="pp154-bridge-check" type="button">Kontrolli valmidust</button></div></details>`;
const tools=base.querySelector('.worktools');(tools||base).after(box);
const fmt=ms=>new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Tallinn'}).format(new Date(ms));
const isLive=()=>document.body.classList.contains('live-active');
const age=()=>lastSuccess?Date.now()-lastSuccess:Infinity;
function repaint(){const live=isLive(),stale=live&&(down||age()>30000);
 $('pp154-led').dataset.state=!live?'demo':stale?'error':'ok';
 $('pp154-sync-message').textContent=!live?'DEMO · Ühenda reaalsete tellimustega':stale?'LIVE · andmed aegunud':'LIVE · ühendatud';
 $('pp154-last').textContent=lastSuccess?fmt(lastSuccess):'—';
 $('pp154-latency').textContent=latency===null?'—':latency+' ms';
 $('pp154-fails').textContent=String(failures);
 $('pp154-stale').hidden=!stale;
 $('pp154-official').textContent='Ainult lugemine';
}
const sound=k=>{if(document.hidden)return false;return !!window.PPSound?.play(k)};
$('pp154-refresh').addEventListener('click',()=>document.dispatchEvent(new Event('pp:refresh-live')));
$('pp154-alert-toggle').addEventListener('click',()=>{const panel=$('pp154-alert-settings');panel.hidden=!panel.hidden;$('pp154-alert-toggle').setAttribute('aria-expanded',String(!panel.hidden))});
$('pp154-overdue-alert').checked=prefs.overdue!==false;
$('pp154-offline-alert').checked=prefs.offline!==false;
for(const [id,field] of [['pp154-overdue-alert','overdue'],['pp154-offline-alert','offline']]){
 $(id).addEventListener('change',e=>{prefs[field]=e.target.checked;set('pp154-alert-prefs',prefs)});
}
$('pp154-bridge-check').addEventListener('click',async()=>{const p=$('pp154-bridge-status');p.textContent='Kontrollimine…';try{const r=await fetch('api/customer-bridge.php',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();p.textContent=j.can_write?'Kirjutusrežiim vajab veel klienditesti':'Väljalülitatud: ametliku API kirjutusleping ja klienditest puuduvad.';}catch(_){p.textContent='Valmiduse kontroll ebaõnnestus; klienditeavitused jäävad väljalülitatuks.'}});
window.addEventListener('pp150:live-synced',e=>{everConnected=true;down=false;lastSuccess=Number(e.detail?.lastSuccess)||Date.now();latency=Number.isFinite(e.detail?.requestMs)?e.detail.requestMs:null;failures=0;repaint()});
window.addEventListener('pp150:live-failed',e=>{const wasDown=down;down=true;failures=Number(e.detail?.failures)||failures+1;
 if(everConnected&&!wasDown&&prefs.offline) sound('offline');repaint()});
window.addEventListener('pp150:live-stopped',()=>{everConnected=false;down=false;lastSuccess=0;latency=null;failures=0;baseline=false;state.clear();repaint()});
window.addEventListener('pp145:orders',e=>{if(e.detail?.source!=='LIVE'||document.body.classList.contains('live-connection-error'))return;
 const now=Date.now(),next=new Map();let crossed=false;
 for(const o of e.detail.orders||[]){if(!['new','active'].includes(o.status))continue;
  const deadline=Number(o.deadline)>0?Number(o.deadline):(Number(o.created)+Number(o.minutes)*60000);
  if(!Number.isFinite(deadline)||deadline<=0)continue;
  const late=deadline<=now;next.set(String(o.id),late);
  if(baseline&&late&&state.get(String(o.id))===false)crossed=true;
 }
 state=next;
 if(!baseline){baseline=true;return}
 if(crossed&&prefs.overdue&&now-lastUrgentSound>30000){sound('urgent');lastUrgentSound=now}
});
window.addEventListener('offline',()=>{if(isLive()){down=true;repaint()}});
window.addEventListener('online',()=>{if(isLive())document.dispatchEvent(new Event('pp:refresh-live'))});
setInterval(repaint,5000);repaint();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/pickup-v155.js == */
try{(function(){
/* v15.5: pickup uses immutable order IDs (not repeating public numbers), optimistic concurrency. */
(()=>{'use strict';const list=document.getElementById('doneOrders'),history=document.querySelector('.history-panel');if(!list||!history)return;
const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
let records={},pending=new Set(),connected=false,showHanded=false,scheduled=false,lastError='';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scope=()=>document.body.classList.contains('live-active')?'live':'demo';
const keyFor=c=>scope()+':'+(c.dataset.orderId||'');
const valid=k=>/^(live:live-[a-f0-9]{24}|demo:demo-[a-zA-Z0-9-]{1,80})$/.test(k);
const fmt=s=>{const d=new Date(s);return Number.isFinite(d.getTime())?d.toLocaleTimeString('et-EE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Tallinn'}):'—'};
const diff=(a,b)=>{const t=(new Date(b).getTime()-new Date(a).getTime())/60000;return Number.isFinite(t)&&t>=0&&t<10080?Math.round(t):null};
const bar=document.createElement('section');bar.className='pp154-pickup';bar.innerHTML=`<div class="pp154-pickup-row"><div><strong>📦 Valmis · Ootab klienti</strong><small id="pp154-pickup-sync">Ühendan serveriga…</small></div><div class="pp154-pickup-counts"><b id="pp154-pickup-wait">0 ootab</b><b id="pp154-pickup-handed">0 üle antud</b><button type="button" id="pp154-pickup-toggle">Näita üle antud</button><button type="button" id="pp154-pickup-refresh">↻</button></div></div><details class="pp154-pickup-log"><summary>Üleandmise ajalugu</summary><div id="pp154-pickup-history"></div></details><p class="pp154-pickup-note">Üleandmine salvestub meie serverisse. Kliendi Peetri Pizza staatus ei muutu.</p>`;
history.querySelector('.history-head')?.after(bar);
function render(){let waiting=0,handed=0;const now=Date.now();
 for(const c of list.querySelectorAll('.pp112-done-card')){const k=keyFor(c),rec=valid(k)?records[k]:null,done=!!rec?.handed_at;done?handed++:waiting++;
  c.hidden=done&&!showHanded;c.classList.toggle('pp154-picked',done);
  let action=c.querySelector('.pp154-handover'),tag=c.querySelector('.pp154-pickup-tag'),foot=c.querySelector('.pp112-card-footer');if(!foot)continue;
  if(!action){action=document.createElement('button');action.type='button';action.className='pp154-handover';foot.appendChild(action)}
  if(!tag){tag=document.createElement('span');tag.className='pp154-pickup-tag';foot.prepend(tag)}
  const ts=Number(c.dataset.readyAt);const ready=ts>0?new Date(ts):null;
  const elapsed=ready&&Number.isFinite(ready.getTime())?Math.max(0,Math.floor((now-ready.getTime())/60000)):null;
  c.classList.toggle('pp154-wait-long',!done&&elapsed!==null&&elapsed>=15);
  tag.textContent=done?'ÜLE ANTUD · '+fmt(rec.handed_at):elapsed!==null&&elapsed>=10?'⏱ Ootab '+(elapsed>=60?Math.floor(elapsed/60)+' h '+(elapsed%60)+' min':elapsed+' min'):'';
  action.textContent=done?'↶ Tühista':'✓ Üle antud';action.disabled=!connected||pending.has(k)||!valid(k);
 }
 $('pp154-pickup-wait').textContent=waiting+' ootab';$('pp154-pickup-handed').textContent=handed+' üle antud';
 $('pp154-pickup-toggle').textContent=showHanded?'Peida üle antud':'Näita üle antud';
 const done=Object.entries(records).filter(([k,r])=>r&&r.handed_at).sort((a,b)=>String(b[1].handed_at).localeCompare(String(a[1].handed_at))).slice(0,80);
 $('pp154-pickup-history').innerHTML=done.length?done.map(([k,r])=>'<div><b>'+esc(k)+'</b><span>Valmis '+fmt(r.ready_at)+' · Üle antud '+fmt(r.handed_at)+(r.ready_at&&diff(r.ready_at,r.handed_at)!==null?' · Ootas '+diff(r.ready_at,r.handed_at)+' min':'')+'</span></div>').join(''):'<p>Väljastamise kirjeid pole.</p>';
 window.dispatchEvent(new CustomEvent('pp155:pickup-state',{detail:{connected,records}}));
}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render()})}
async function sync(){try{const r=await fetch('api/pickup.php',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(!j.ok||typeof j.records!=='object'||!j.records||Array.isArray(j.records))throw Error('Vigane vastus');records=j.records;connected=true;lastError='';$('pp154-pickup-sync').textContent='● Sünkroonis serveriga';render()}catch(e){connected=false;lastError=e.message;$('pp154-pickup-sync').textContent='⚠ Sünkroonimise viga: '+lastError;render()}}
list.addEventListener('click',async e=>{const b=e.target.closest('.pp154-handover');if(!b||!connected)return;const c=b.closest('.pp112-done-card');if(!c)return;const k=keyFor(c);if(!valid(k)||pending.has(k))return;
 const old=records[k]||{},action=old.handed_at?'undo':'handed';if(action==='undo'&&!confirm('Kas tühistada üleandmise märge?'))return;
 pending.add(k);render();const ts=Number(c.dataset.readyAt);const ready=ts>0&&Number.isFinite(ts)?new Date(ts).toISOString():null;
 try{const r=await fetch('api/pickup.php',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({key:k,action,expected_revision:Number(old.revision)||0,ready_at:ready})});const j=await r.json();if(!r.ok){if(r.status===409&&j.records){records=j.records;throw Error('Teine töötaja muutis tellimust. Värskendasin andmed.')}throw Error(j.error||'HTTP '+r.status)}records=j.records;connected=true;$('pp154-pickup-sync').textContent='● Üleandmine salvestatud';}catch(err){alert('Üleandmist ei salvestatud: '+err.message);await sync()}finally{pending.delete(k);render()}
});
$('pp154-pickup-refresh').addEventListener('click',sync);
$('pp154-pickup-toggle').addEventListener('click',()=>{showHanded=!showHanded;render()});
new MutationObserver(queue).observe(list,{childList:true});
window.addEventListener('pp150:live-synced',queue);window.addEventListener('pp150:live-stopped',queue);
// v17.6: 5 s only in LIVE, 30 s in DEMO, slower after errors (max 60 s), paused while the screen is hidden.
(function(){let fails=0;const next=()=>{const base=document.body.classList.contains('live-active')?5000:30000;setTimeout(tick,Math.min(60000,base*Math.pow(2,Math.min(fails,3))))};async function tick(){if(!document.hidden){await sync();fails=connected?0:fails+1;}next()}next();document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});window.addEventListener('pp150:live-synced',()=>{if(fails)sync()})})();setInterval(queue,30000);
sync();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/kitchen-v155.js == */
try{(function(){
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
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/kitchen-v156.js == */
try{(function(){
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
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/home-v157.js == */
try{(function(){
/* v15.7 — One organized kitchen homepage. DOM nodes move, actions remain original. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const page=$('ordersPage');if(!page||page.dataset.pp157Home==='1')return;
page.dataset.pp157Home='1';document.body.classList.add('pp157-home');
// Purposefully reparent existing controls; do not duplicate live buttons or mutate API methods.
const home=document.createElement('div');home.className='pp157-home-shell';home.innerHTML=`
 <section class="pp157-ops" aria-label="Köögi juhtimine">
  <div class="pp157-heading"><div class="pp157-heading-left"><span class="pp157-kicker">KOLDE · PEETRI PIZZA</span><h1>Tellimused <span class="pp157-head-dot" aria-hidden="true">●</span></h1><p>Üks töölaud · uued, valmistamisel ja väljastus</p></div><div id="pp157-connection" class="pp157-connection" aria-live="polite"></div></div>
  <div class="pp157-metrics" aria-label="Tellimuste kokkuvõte">
   <div class="pp157-metric new"><span>Uued</span><strong id="pp157-total-new">0</strong></div>
   <div class="pp157-metric active"><span>Valmistamisel</span><strong id="pp157-total-active">0</strong></div>
   <div class="pp157-metric ready"><span>Valmis</span><strong id="pp157-total-ready">0</strong></div>
   <div class="pp157-metric urgent"><span>Kiire</span><strong id="pp157-total-urgent">0</strong></div>
  </div>
  <div class="pp157-fast-actions" aria-label="Kiirtoimingud"><div class="pp157-live-action" id="pp157-live-action"></div><div class="pp157-pickup-action" id="pp157-pickup-action"></div><div class="pp157-audio-action" id="pp157-audio-action"></div></div>
  <div id="pp157-alerts" class="pp157-alerts" aria-live="polite"></div>
 </section>
 <div class="pp157-list-header"><div><span class="pp157-kicker">KÖÖK · TÖÖJÄRJEKORD</span><h2>Aktiivsed tellimused</h2></div><div class="pp157-find" id="pp157-find"></div></div>
 <div id="pp157-mobile-mount"></div><div id="pp157-columns-mount"></div>
 <div id="pp157-ready-section" class="pp157-ready-section"></div>
 <details class="pp157-more" id="pp157-more"><summary><span><strong>⚙ Tööriistad ja ülevaated</strong><small>Filtrid, teavitused, LIVE diagnostika</small></span><span class="pp157-chevron" aria-hidden="true">⌄</span></summary><div class="pp157-more-content" id="pp157-more-content"></div></details>
`;
page.prepend(home);
const move=(el,dst)=>{const target=typeof dst==='string'?$(dst):dst;if(el&&target)target.appendChild(el)};
const advanced=$('pp157-more-content');
// Existing LIVE controls and hidden diagnostics retain their event handlers. The kitchen home shows orders, not engine banners.
move($('pp111-live-slot'),'pp157-live-action');
move($('toggleHistory'),'pp157-pickup-action');
move($('pp155-pickup-open'),'pp157-pickup-action');
move(page.querySelector('.pp155-audio'),'pp157-audio-action');
move(page.querySelector('.pp155-health'),advanced);
move(page.querySelector('.pp156-reconcile'),advanced);
move($('pp154-stale'),'pp157-alerts');
// Only one queue, and original history remains in normal document flow.
move(page.querySelector('.pp109-mobile-tabs'),'pp157-mobile-mount');
move(page.querySelector('.columns'),'pp157-columns-mount');
move(page.querySelector('.history-panel'),'pp157-ready-section');
// Keep the real search input immediately above the queues; the rest of its toolbar remains available below.
const search=$('orderSearch')?.closest('.order-search');move(search,'pp157-find');
// Reuse existing products/statistics navigation (the original listeners were attached during initialization).
const quick=document.createElement('div');quick.className='pp157-shortcuts';quick.innerHTML='<strong>Muud lehed</strong><button type="button" data-pp157-page="products">◫ Tooted</button><button type="button" data-pp157-page="statistics">▥ Statistika</button><a href="dough.php">▤ Taigna tellimine</a><button type="button" data-pp157-page="settings">⚙ Seaded</button>';
quick.addEventListener('click',e=>{const b=e.target.closest('[data-pp157-page]');if(b){const original=document.querySelector('#drawer [data-page="'+b.dataset.pp157Page+'"]');original?.click();}});
advanced.appendChild(quick);
// Preserve the existing fullscreen action in the advanced tools rather than the header.
move($('pp126-fullscreen'),quick);
// Move remaining status/diagnostics under expandable tools.
const leftovers=[...page.children].filter(el=>el!==home);
for(const el of leftovers)move(el,advanced);
// Move order-page ancillary controls living above the page into its expandable tools area.
move(document.querySelector('.dashboard-display-controls'),advanced);
move($('overview'),advanced);
move($('demoAdd'),advanced);
// Keep status badges tied to real state instead of maintaining a second order data model.
let scheduled=false;
function paint(){scheduled=false;
 const count=id=>{const n=Number(($(id)?.textContent||'0').trim().match(/\d+/)?.[0]||0);return Number.isFinite(n)?n:0};
 // v17.1: write only on change (prevents a once-per-second observer cascade).
 const set=(id,v)=>{const el=$(id);v=String(v);if(el&&el.textContent!==v)el.textContent=v};
 set('pp157-total-new',count('newCount'));
 set('pp157-total-active',count('activeCount'));
 set('pp157-total-ready',count('doneCount'));
 set('pp157-total-urgent',count('pp131-urgent-count'));
 const live=document.body.classList.contains('live-active')?'yes':'no',error=document.body.classList.contains('live-connection-error')?'yes':'no';
 if(home.dataset.live!==live)home.dataset.live=live;
 if(home.dataset.error!==error)home.dataset.error=error;
 const alert=$('pp154-stale');if(alert)home.classList.toggle('pp157-stale',!alert.hidden);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint)}
for(const id of ['newCount','activeCount','doneCount','pp131-urgent-count']){const el=$(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,subtree:true,characterData:true});}
new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
const stale=$('pp154-stale');if(stale)new MutationObserver(schedule).observe(stale,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('pp150:live-synced',schedule);window.addEventListener('pp150:live-failed',schedule);window.addEventListener('pp150:live-stopped',schedule);
paint();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/home-v158.js == */
try{(function(){
/* Peetri Pizza v15.8 — One-screen kitchen, view-only enhancements. No vendor API writes. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const home=$('ordersPage')?.querySelector('.pp157-home-shell');if(!home||home.dataset.pp158Ready)return;
home.dataset.pp158Ready='1';document.body.classList.add('pp158-home');
const advanced=$('pp157-more-content'), fast=$('pp157-fast-actions')||home.querySelector('.pp157-fast-actions');
if(!advanced||!fast)return;
/* Top bar stays menu, original brand, LIVE dot, clock and native sound switch.
   A duplicate *display control* is used to preserve original wait-select bindings across other pages. */
const originalWait=$('pp114-wait-select');
if(originalWait){
 const label=document.createElement('label');label.className='pp158-wait';label.htmlFor='pp158-wait-select';
 const cap=document.createElement('span');cap.textContent='Ooteaeg';const select=document.createElement('select');select.id='pp158-wait-select';select.setAttribute('aria-label','Köögi ooteaeg');
 for(const option of originalWait.options){const x=document.createElement('option');x.value=option.value;x.textContent=option.textContent;select.append(x)}
 select.value=originalWait.value;label.append(cap,select);
 fast.querySelector('.pp157-live-action')?.insertAdjacentElement('afterend',label);
 select.addEventListener('change',()=>{originalWait.value=select.value;originalWait.dispatchEvent(new Event('change',{bubbles:true}))});
 originalWait.addEventListener('change',()=>{select.value=originalWait.value});
}
/* Preserve button instances and their listeners. Less-used controls live in expandable tools. */
const audio=home.querySelector('.pp155-audio');if(audio){const slot=document.createElement('div');slot.className='pp158-advanced-sounds';slot.append(audio);advanced.prepend(slot)}
/* Brief urgency state based on existing card urgency (already updated by core timer loop). */
const ops=home.querySelector('.pp157-ops');const urgent=document.createElement('div');urgent.className='pp158-timer-state';urgent.id='pp158-timer-state';urgent.setAttribute('role','status');
urgent.innerHTML='<span class="pp158-state-dot" aria-hidden="true"></span><span id="pp158-timer-message">Ajad kontrolli all</span>';
ops.querySelector('.pp157-metrics')?.insertAdjacentElement('afterend',urgent);
/* Inline pickup section uses existing DOM + native action handlers; no duplicated POST requests. */
const pickupTarget=$('pp157-ready-section'), done=$('doneOrders'), newList=$('newOrders'), activeList=$('activeOrders');
if(!pickupTarget||!done||!newList||!activeList)return;
const quick=document.createElement('section');quick.className='pp158-pickup-quick';quick.id='pp158-pickup-quick';quick.setAttribute('aria-label','Väljastamise kiirvaade');
quick.innerHTML=`<div class="pp158-pickup-head"><div><span class="pp158-pickup-kicker">03 / VÄLJASTUS</span><strong>Valmis · ootab klienti <span id="pp158-pickup-count">0</span></strong></div><div class="pp158-pickup-actions"><button type="button" id="pp158-view-ready">Vaata kõiki</button><button type="button" id="pp158-open-station">📦 Väljastus</button></div></div><div id="pp158-pickup-rows" class="pp158-pickup-rows" aria-live="polite"></div><small class="pp158-pickup-note">Üleandmine salvestub ainult meie köögisüsteemi, mitte Peetri Pizza ametlikku API-sse.</small>`;
pickupTarget.prepend(quick);
const nativeHistory=$('toggleHistory');const nativeStation=$('pp155-pickup-open');
$('pp158-view-ready').addEventListener('click',()=>{
 if(nativeHistory?.getAttribute('aria-expanded')!=='true')nativeHistory?.click();
 pickupTarget.scrollIntoView({behavior:'smooth',block:'start'});
});
$('pp158-open-station').addEventListener('click',()=>nativeStation?.click());
function historyView(){pickupTarget.classList.toggle('pp158-history-open',nativeHistory?.getAttribute('aria-expanded')==='true')}
if(nativeHistory){new MutationObserver(historyView).observe(nativeHistory,{attributes:true,attributeFilter:['aria-expanded']});historyView()}
const rowsEl=$('pp158-pickup-rows');
let currentRecords={},connected=false,scheduled=false,lastFingerprint='',waitingCount=0,autoRush=false;
const showWait=ms=>{const m=Math.floor(ms/60000);return Number.isFinite(m)&&m>=0?m+' min':'—'};
function pickupCards(){
 const live=document.body.classList.contains('live-active');
 return [...done.querySelectorAll('.pp112-done-card')].filter(card=>{
  const id=card.dataset.orderId||'';
  if(live&&!/^live-[a-f0-9]{24}$/.test(id))return false;
  if(!live&&!/^demo-[a-zA-Z0-9-]{1,80}$/.test(id))return false;
  const key=(live?'live:':'demo:')+id;
  return !currentRecords[key]?.handed_at;
 }).sort((a,b)=>{const aa=Number(a.dataset.readyAt),bb=Number(b.dataset.readyAt);
  return (aa>0?aa:Number.MAX_SAFE_INTEGER)-(bb>0?bb:Number.MAX_SAFE_INTEGER);
 });
}
function renderPickup(){
 const cards=pickupCards();waitingCount=cards.length;
 $('pp158-pickup-count').textContent=String(waitingCount);
 const top=cards.slice(0,3);
 const fingerprint=top.map(c=>[c.dataset.orderId,c.dataset.readyAt,c.querySelector('.pp154-handover')?.disabled].join(':')).join('|')+'#'+waitingCount+'#'+connected;
 const currentRows=[...rowsEl.querySelectorAll('.pp158-pickup-row')];
 if(fingerprint!==lastFingerprint||currentRows.length!==top.length){
  lastFingerprint=fingerprint;rowsEl.replaceChildren();
  if(!top.length){const empty=document.createElement('p');empty.className='pp158-empty';empty.textContent=connected?'Kõik valmis tellimused on väljastatud.':'Valmis tellimusi pole või serveri sünkroon puudub.';rowsEl.append(empty)}
  top.forEach(card=>{
   const id=card.dataset.orderId;const row=document.createElement('div');row.className='pp158-pickup-row';row.dataset.orderId=id;
   const name=card.querySelector('.pp112-customer')?.textContent||'';const number=card.querySelector('.pp112-number')?.textContent||'#—';
   const head=document.createElement('div');head.className='pp158-pickup-person';
   const strong=document.createElement('strong');strong.textContent=number;
   const small=document.createElement('small');small.textContent=name;head.append(strong,small);
   const ago=document.createElement('span');ago.className='pp158-pickup-age';
   const button=document.createElement('button');button.type='button';button.className='pp158-handover';button.textContent='✓ Üle antud';
   button.disabled=!connected||!card.querySelector('.pp154-handover')||card.querySelector('.pp154-handover').disabled;
   button.addEventListener('click',()=>{
    const native=[...done.querySelectorAll('.pp112-done-card')].find(c=>c.dataset.orderId===id)?.querySelector('.pp154-handover');
    if(!native||native.disabled||!connected)return;
    button.disabled=true;native.click();
   });
   row.append(head,ago,button);rowsEl.append(row);
  });
 }
 for(const card of top){const row=[...rowsEl.querySelectorAll('.pp158-pickup-row')].find(r=>r.dataset.orderId===card.dataset.orderId);if(!row)continue;
  const stamp=Number(card.dataset.readyAt),ago=stamp>0&&Number.isFinite(stamp)?Date.now()-stamp:null;
  const age=row.querySelector('.pp158-pickup-age');age.textContent=ago===null?'Aeg teadmata':'Ootab '+showWait(Math.max(0,ago));
  row.classList.toggle('pp158-pickup-late',ago!==null&&ago>=15*60000);
  const action=row.querySelector('button'),native=card.querySelector('.pp154-handover');action.disabled=!connected||!native||native.disabled;
 }
}
function renderUrgency(){const cards=[...newList.querySelectorAll('.ordercard'),...activeList.querySelectorAll('.ordercard')];
 let late=0,soon=0;for(const card of cards){if(card.classList.contains('urgency-late'))late++;else if(card.classList.contains('urgency-soon'))soon++;
  const timer=card.querySelector('.pp117-countdown');if(timer)timer.setAttribute('aria-label',card.classList.contains('urgency-late')?'Tähtaeg ületatud':card.classList.contains('urgency-soon')?'Vähem kui viis minutit jäänud':'Aega jäänud');
 }
 const total=cards.length;autoRush=total>=6;
 home.classList.toggle('pp158-rush',autoRush);
 home.dataset.urgency=late?'late':soon?'soon':'normal';
 const msg=late?late+' hilinenud'+(soon?' · '+soon+' kiiret':''):soon?soon+' kiiret · jälgi taimerit':total>=6?'Tihe töörežiim · '+total+' aktiivset tellimust':'Ajad kontrolli all';
 const el=$('pp158-timer-message');if(el.textContent!==msg)el.textContent=msg;
}
function paint(){scheduled=false;renderUrgency();renderPickup()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint)}
for(const el of [newList,activeList,done])new MutationObserver(schedule).observe(el,{childList:true});
window.addEventListener('pp155:pickup-state',e=>{currentRecords=e.detail?.records||{};connected=!!e.detail?.connected;schedule()});
for(const name of ['pp150:live-synced','pp150:live-stopped','pp155:status-saved'])window.addEventListener(name,schedule);
setInterval(()=>{if(!document.hidden)paint()},15000);
schedule();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/peetri-v160.js == */
try{(function(){
/* Peetri Pizza Service App v16.0 — presentation/accessibility layer.
   Retains native order status, pickup, staff and LIVE request handlers; no vendor API writes. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const home=$('ordersPage')?.querySelector('.pp157-home-shell');
 if(!home || home.dataset.pp160Ready==='1')return;
 home.dataset.pp160Ready='1';document.body.classList.add('pp160-ui');
 const icon={
  chef:'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17V9a4 4 0 0 1 1.1-7.8 5 5 0 0 1 9.8 0A4 4 0 0 1 18 9v8"/><path d="M6 17h12v4H6z"/></svg>',
  live:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 8-8m8 8a8 8 0 0 1-8 8M7.5 12a4.5 4.5 0 0 1 4.5-4.5m4.5 4.5a4.5 4.5 0 0 1-4.5 4.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
  clock:'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  box:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4m-9 4v11m-4-13 9-4"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>',
  menu:'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
 };
 // Topbar: read-only state chips and a shortcut to the EXISTING operator dialog.
 const bar=document.querySelector('.topbar'), brand=bar?.querySelector('.brandgroup'), right=bar?.querySelector('.top-right');
 if(brand){
  const sub=document.createElement('div');sub.className='pp160-brand-sub';sub.innerHTML='<strong>TEENINDUS</strong><small>KÖÖGI TÖÖLAUD · v16</small>';
  brand.append(sub);
 }
 if(right){
  const live=document.createElement('span');live.className='pp160-live-chip';live.id='pp160-live-chip';live.dataset.state='demo';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.innerHTML='<i aria-hidden="true"></i><span>DEMO</span>';
  right.prepend(live);
  const totals=document.createElement('span');totals.className='pp160-top-totals';totals.title='Uued ja valmistamisel tellimused';
  totals.innerHTML='<span>Uued <b id="pp160-header-new">0</b></span><span>Töös <b id="pp160-header-active">0</b></span>';
  live.after(totals);
 }
 // Status is only labelled LIVE after a successful sync (not just an attempted connection).
 let liveConfirmed=false,liveError=false;
 function updateLive(){const chip=$('pp160-live-chip');if(!chip)return;
  const live=document.body.classList.contains('live-active');
  const state=liveError&&live?'error':live&&liveConfirmed?'live':live?'pending':'demo';
  if(chip.dataset.state===state&&chip.dataset.pp171Painted)return;chip.dataset.pp171Painted='1';
  chip.dataset.state=state;
  chip.querySelector('span').textContent=({live:'LIVE',pending:'ÜHENDAN',error:'ÜHENDUSE VIGA',demo:'DEMO'})[state];
  chip.setAttribute('aria-label',({live:'LIVE tellimused on sünkroonitud',pending:'LIVE tellimustega ühendamine',error:'LIVE ühendus katkes',demo:'Demorežiim'})[state]);
 }
 window.addEventListener('pp150:live-synced',()=>{liveConfirmed=true;liveError=false;updateLive()});
 window.addEventListener('pp150:live-failed',()=>{liveError=true;updateLive()});
 window.addEventListener('pp150:live-stopped',()=>{liveConfirmed=false;liveError=false;updateLive()});
 // Explicitly show that the original server is not written to by kitchen actions.
 const tagline=home.querySelector('.pp157-heading-left p');if(tagline)tagline.textContent='Uued tellimused · valmistamine · väljastamine';
 const kicker=home.querySelector('.pp157-heading-left .pp157-kicker');if(kicker)kicker.textContent='PEETRI PIZZA / SERVICE OS 16';
 const heading=home.querySelector('.pp157-heading-left h1');if(heading)heading.childNodes[0].textContent='Köögi töölaud ';
 const summary=document.createElement('p');summary.className='pp160-queue-note';summary.innerHTML=icon.clock+'<span id="pp160-queue-message">Tellimuste ülevaade on valmis</span>';
 home.querySelector('.pp157-list-header')?.append(summary);
 // Existing pickup-quick UI: show an actionable waiting summary, preserve delegated native POST.
 const pickup=$('pp158-pickup-quick');if(pickup){
  pickup.classList.add('pp160-pickup');
  const head=pickup.querySelector('.pp158-pickup-head>div:first-child');
  if(head){head.querySelector('.pp158-pickup-kicker').textContent='VÄLJASTUSKESKUS / 03';
   const title=head.querySelector('strong');if(title&&title.firstChild)title.firstChild.textContent='Klienti ootavad tellimused ';
  }
  const badge=document.createElement('span');badge.className='pp160-pickup-wait';badge.id='pp160-pickup-wait';badge.setAttribute('role','status');badge.textContent='Ootel: 0';
  pickup.querySelector('.pp158-pickup-actions')?.prepend(badge);
  const open=$('pp158-open-station');if(open){open.textContent='';open.insertAdjacentHTML('afterbegin',icon.box+'<span>Väljastus</span>');}
  const all=$('pp158-view-ready');if(all)all.textContent='Kõik valmis';
 }
 // Improve keyboard focus and semantics for the current native kitchen actions.
 const newOrders=$('newOrders'),activeOrders=$('activeOrders');
 let scheduled=false;
 const number=id=>{const text=$(id)?.textContent||'0';return Math.max(0,Number(text.match(/\d+/)?.[0]||0))};
 function paint(){scheduled=false;
  const n=number('pp157-total-new'),a=number('pp157-total-active'),urgent=number('pp157-total-urgent');
  if($('pp160-header-new')&&$('pp160-header-new').textContent!==String(n))$('pp160-header-new').textContent=String(n);
  if($('pp160-header-active')&&$('pp160-header-active').textContent!==String(a))$('pp160-header-active').textContent=String(a);
  const message=urgent?`${urgent} kiireloomulist · ${n} uut · ${a} töös`:`${n} uut · ${a} valmistamisel`;
  const status=$('pp160-queue-message');if(status&&status.textContent!==message)status.textContent=message;
  for(const col of [newOrders,activeOrders]){
   if(!col)continue;
   for(const card of col.querySelectorAll('.ordercard')){
    const timer=card.querySelector('.pp117-countdown');if(timer){
     const critical=card.classList.contains('urgency-late')?'late':card.classList.contains('urgency-soon')?'soon':'normal';
     if(timer.dataset.level!==critical)timer.dataset.level=critical;
     if(timer.getAttribute('role')!=='timer')timer.setAttribute('role','timer');
    }
    const action=card.querySelector('.cardfoot button[data-action],.cardfoot button[data-kitchen-action]');
    if(action&&!action.dataset.pp160Label){action.dataset.pp160Label='1';
     const orderNo=card.querySelector('.order-number')?.textContent||'';
     const label=(action.textContent||'').trim();action.setAttribute('aria-label',`${label} · tellimus ${orderNo}`.trim());
    }
   }
  }
  if(pickup){
   const waiting=number('pp158-pickup-count'),late=pickup.querySelectorAll('.pp158-pickup-row.pp158-pickup-late').length;
   const badge=$('pp160-pickup-wait');if(badge){const label=late?`Ootel: ${waiting} · ${late} kaua oodanud`:`Ootel: ${waiting}`;if(badge.textContent!==label)badge.textContent=label;badge.classList.toggle('is-late',late>0)}
   for(const row of pickup.querySelectorAll('.pp158-pickup-row')){
    const btn=row.querySelector('.pp158-handover');if(btn){btn.setAttribute('aria-label','Kinnita üleandmine · '+(row.querySelector('.pp158-pickup-person strong')?.textContent||'tellimus'));
     if(!btn.dataset.pp160Button){btn.dataset.pp160Button='1';btn.innerHTML=icon.check+'<span>Üle antud</span>';}
    }
   }
  }
  updateLive();
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint)}
 const pp171Tick='[data-timer],.prep-label,[data-pp110-priority],.pp117-countdown';
 // v17.1: the 1s countdown rewrites timer text only; skip those records, react to real list changes and urgency class changes.
 const pp171Meaningful=records=>records.some(r=>{const t=r.target&&r.target.nodeType===1?r.target:r.target?.parentElement;if(r.type==='attributes')return !!t&&t.classList.contains('ordercard');return !(t&&t.closest&&t.closest(pp171Tick));});
 [newOrders,activeOrders].filter(Boolean).forEach(el=>new MutationObserver(records=>{if(pp171Meaningful(records))schedule()}).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:['class']}));
 {const rows=$('pp158-pickup-rows');if(rows)new MutationObserver(schedule).observe(rows,{childList:true,subtree:true});}
 for(const id of ['pp157-total-new','pp157-total-active','pp157-total-urgent','pp158-pickup-count']){
  const el=$(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,characterData:true,subtree:true});
 }
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('pp145:orders',schedule);
 window.addEventListener('pp155:pickup-state',schedule);
 for(const event of ['pp150:live-synced','pp150:live-stopped','pp150:live-failed','pp155:status-saved'])window.addEventListener(event,schedule);
 // Pickup ages / urgency may change without an order list re-render.
 setInterval(()=>{if(!document.hidden)schedule()},10000);
 schedule();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/peetri-v161.js == */
try{(function(){
/* v16.1 — Remove green operations panel; waiting time in header only. */
(()=>{'use strict';
const home=document.querySelector('#ordersPage .pp157-home-shell');
if(!home||home.dataset.pp161Ready)return;
home.dataset.pp161Ready='1';document.body.classList.add('pp161-clean');
const ops=home.querySelector('.pp157-ops');
const wait=document.getElementById('pp158-wait-select')?.closest('.pp158-wait');
const bar=document.querySelector('.topbar .top-right');
if(wait&&bar){wait.classList.add('pp161-header-wait');bar.prepend(wait);}
// Keep original functional controls and listeners available in the existing tools drawer.
const advanced=document.getElementById('pp157-more-content');
if(ops&&advanced){
 const utility=document.createElement('div');utility.className='pp161-hidden-ops';
 utility.setAttribute('aria-label','Täiendavad köögi juhtnupud');
 for(const selector of ['.pp157-fast-actions','.pp157-connection','.pp157-alerts']){
  const node=ops.querySelector(selector);if(node)utility.append(node);
 }
 advanced.prepend(utility);
 // Keep nonvisual internal counters required by existing timer/queue observers.
 const internals=document.createElement('div');internals.id='pp164-internal-counters';internals.hidden=true;internals.setAttribute('aria-hidden','true');
 for(const selector of ['.pp157-metrics','.pp158-timer-state']){const node=ops.querySelector(selector);if(node)internals.append(node)}
 advanced.append(internals);
 ops.remove();
}
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/peetri-v162.js == */
try{(function(){
/* Peetri Pizza v16.2 — progressive enhancement only. Native status and pickup handlers untouched. */
(()=>{'use strict';
 const root=document.querySelector('#ordersPage .pp157-home-shell');
 if(!root||root.dataset.pp162Ready)return;
 root.dataset.pp162Ready='1';document.body.classList.add('pp162-ui');
 // Keep the previous wait selector in the upper header; avoid any secondary visible controls.
 const wait=document.getElementById('pp158-wait-select');
 const native=document.getElementById('pp114-wait-select');
 if(wait&&native){
  const sync=()=>{if(wait.value!==native.value)wait.value=native.value};
  native.addEventListener('change',sync);sync();
 }
 // Replace decorative legacy symbols with consistent SVG icons; do not touch navigation listeners.
 const icons={
  orders:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  products:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M9 10v10"/>',
  stats:'<path d="M4 20V12M10 20V4M16 20v-9M22 20v-5"/>',
  dough:'<path d="M4 17c2-9 14-9 16 0l-2 3H6zM8 13l-1-3M16 13l1-3"/>',
  bonus:'<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m10 2-.5 2.3-2.2.9-2-1.3-2.4 2.4 1.3 2-.9 2.2L1 11v3l2.3.5.9 2.2-1.3 2 2.4 2.4 2-1.3 2.2.9L10 23h4l.5-2.3 2.2-.9 2 1.3 2.4-2.4-1.3-2 .9-2.2L23 14v-3l-2.3-.5-.9-2.2 1.3-2-2.4-2.4-2 1.3-2.2-.9L14 2z"/>'
 };
 const nav=document.querySelectorAll('#drawer nav .navitem');
 [...nav].forEach((item,i)=>{
  const current=item.querySelector(':scope > span:first-child');
  const paths=Object.values(icons)[i];if(!current||!paths)return;
  current.className='pp162-nav-icon';current.setAttribute('aria-hidden','true');
  current.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
 });
 // Brief tactile response, but no fake completion state: core handlers remain authoritative.
 const cards=document.getElementById('pp157-columns-mount');
 if(cards)cards.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action],button[data-kitchen-action],button.accept,button.done');
  if(!button||button.disabled)return;
  const card=button.closest('.ordercard');if(!card)return;
  card.classList.add('pp162-processing');
  setTimeout(()=>{if(card.isConnected)card.classList.remove('pp162-processing')},650);
 },true);
 // Keep the drawer accessible for keyboard navigation.
 const menu=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
 const close=document.getElementById('closeDrawer');
 if(menu&&drawer&&close){
  drawer.addEventListener('keydown',e=>{if(e.key==='Escape'){close.click();menu.focus()}});
 }
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/peetri-v163.js == */
try{(function(){
/* Peetri Pizza Service App v16.3 — UI enhancements. Core order/API handlers unchanged. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const home=document.querySelector('#ordersPage .pp157-home-shell');
if(!home||home.dataset.pp163Ready)return;
home.dataset.pp163Ready='1';document.body.classList.add('pp163-ui');
const key='peetri-v163-view';
function saved(){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:{}}catch(_){return {}}}
const prefs={ultra:saved().ultra!==false,display:saved().display===true};
function persist(){try{localStorage.setItem(key,JSON.stringify(prefs))}catch(_){}}
/* Kitchen display mode is a visual toggle; no fullscreen privileges or API changes. */
const listHead=home.querySelector('.pp157-list-header');
const quick=document.createElement('button');quick.type='button';quick.className='pp163-screen-toggle';quick.setAttribute('aria-pressed','false');quick.title='Lülita suure ekraani köögivaade sisse või välja';quick.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 4H4v5m12-5h4v5M4 15v5h4m12-5v5h-4"/></svg><span>Ekraanirežiim</span>';
if(listHead)listHead.appendChild(quick);
const exit=document.createElement('button');exit.type='button';exit.className='pp163-display-exit';exit.id='pp163-display-exit';exit.textContent='✕ Välju ekraanirežiimist';document.body.appendChild(exit);
let ultraToggle,displayToggle;
function apply(){document.body.classList.toggle('pp163-ultra',prefs.ultra);document.body.classList.toggle('pp163-display',prefs.display);
 quick.setAttribute('aria-pressed',String(prefs.display));quick.title=prefs.display?'Välju ekraanirežiimist':'Ava ekraanirežiim';
 if(ultraToggle)ultraToggle.checked=prefs.ultra;if(displayToggle)displayToggle.checked=prefs.display;
}
function setMode(next){prefs.display=!!next;persist();apply()}
quick.addEventListener('click',()=>setMode(!prefs.display));exit.addEventListener('click',()=>setMode(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&prefs.display&&!document.querySelector('dialog[open]'))setMode(false)});
/* Group EXISTING controls rather than recreating their bindings. */
const panel=document.querySelector('#settingsPage .panel');
if(panel){const title=panel.querySelector(':scope > h2');if(title){const intro=document.createElement('p');intro.className='pp163-settings-intro';intro.textContent='Kiired ja selged töövahendid köögi jaoks. Seaded salvestatakse selles brauseris.';title.after(intro)}
 const group=(name,subtitle,symbol)=>{const box=document.createElement('section');box.className='pp163-pref-group';const head=document.createElement('div');head.className='pp163-pref-title';
  const icon=document.createElement('span');icon.className='pp163-pref-symbol';icon.setAttribute('aria-hidden','true');icon.textContent=symbol;
  const labels=document.createElement('div');const h=document.createElement('h3');h.textContent=name;const p=document.createElement('p');p.textContent=subtitle;labels.append(h,p);head.append(icon,labels);box.append(head);panel.append(box);return box};
 const move=(parent,id,selector='.settingsrow')=>{const node=byId(id)?.closest(selector);if(node)parent.append(node)};
 const view=group('Köögi vaade','Tellimuste tihedus ja ekraanirežiim','▣');
 move(view,'minusMinutes');move(view,'compactSetting');move(view,'focusSetting');
 const extra=(label,hint,id,checked,callback)=>{const row=document.createElement('div');row.className='pp163-setting-row';const info=document.createElement('div');const strong=document.createElement('strong');strong.textContent=label;const small=document.createElement('small');small.textContent=hint;info.append(strong,small);
  const wrap=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.id=id;input.checked=checked;const words=document.createElement('span');words.textContent='Sees';wrap.append(input,words);row.append(info,wrap);view.append(row);input.addEventListener('change',()=>callback(input.checked));return input};
 ultraToggle=extra('Ülikompaktsed tellimused','Rohkem tellimusi ekraanil, suured tegevusnupud säilivad.','pp163-ultra-toggle',prefs.ultra,on=>{prefs.ultra=on;persist();apply()});
 displayToggle=extra('Suur köögiekraan','Suuremad numbrid ja kellad, ainult tellimused. Väljumiseks ESC või all paremal nupp.','pp163-display-toggle',prefs.display,setMode);
 const personal=panel.querySelector('.pp145-personal');if(personal)view.append(personal);
 const audio=group('Heli ja teavitused','Signaalid ja helitugevus','♫');move(audio,'soundToggle');const soundPanel=panel.querySelector('.pp141-sound-settings');if(soundPanel)audio.append(soundPanel);
 const connection=group('Ühendus ja LIVE','Andmeallika olek ning diagnostika','↗');move(connection,'pp74-settings-mode');
 const livePanel=panel.querySelector('.pp149-live-diagnostic');if(livePanel)connection.append(livePanel);
 move(connection,'checkConnection');for(const id of ['connectionReport']){const node=byId(id);if(node)connection.append(node)}
 const center=panel.querySelector('.integration-center');if(center)connection.append(center);
 const data=group('Andmed','Eelvaated, eksport ja näidisandmed','▤');move(data,'importOrders');for(const id of ['importReport']){const node=byId(id);if(node)data.append(node)}move(data,'settingsExport');move(data,'resetDemo');
}
/* No server write is initiated here. Existing action handlers receive the FIRST click only. */
const locks=new Map();
document.addEventListener('click',e=>{
 const button=e.target.closest('#ordersPage .ordercard button[data-action],#ordersPage .ordercard button[data-kitchen-action]');
 if(!button||button.disabled||button.dataset.action==='details')return;
 const action=button.dataset.kitchenAction||button.dataset.action;
 if(!['accept','done','active'].includes(action))return;
 const order=button.closest('[data-order-id]');const id=button.dataset.id||order?.dataset.orderId;
 if(!id)return;
 const token=String(id)+'|'+action,now=performance.now(),last=locks.get(token)||-Infinity;
 if(now-last<1400){e.preventDefault();e.stopImmediatePropagation();return}
 locks.set(token,now);button.classList.add('pp163-tapped');
 setTimeout(()=>{button.classList.remove('pp163-tapped');if(locks.get(token)===now)locks.delete(token)},1450);
},true);
apply();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/peetri-v164.js == */
try{(function(){
/* Peetri Pizza v16.4 — UI + event handlers only; no API endpoint, write or independent poller. */
(()=>{'use strict';
const id=k=>document.getElementById(k),home=document.querySelector('#ordersPage .pp157-home-shell');
if(!home||home.dataset.pp164Ready==='1')return;
home.dataset.pp164Ready='1';document.body.classList.add('pp164-ui');
const preference='peetri-v164-ui';
const read=()=>{try{const v=JSON.parse(localStorage.getItem(preference));return v&&typeof v==='object'?v:{}}catch(_){return {}}};
const options={autoScroll:read().autoScroll===true};
const save=()=>{try{localStorage.setItem(preference,JSON.stringify(options))}catch(_){}};
// Never add a competing timer or flow engine. Native card rendering and order actions remain authoritative.
const view=id('settingsPage')?.querySelector('.pp163-pref-group');
if(view){
 const row=document.createElement('label');row.className='pp164-flow-option';
 row.innerHTML='<div><strong>Keri uue tellimuseni</strong><small>Uue LIVE-tellimuse korral vii vaade tellimuste algusesse. Vaikimisi välja lülitatud, et kokk ei kaotaks tööjärge.</small></div>';
 const checkbox=document.createElement('input');checkbox.id='pp164-autoscroll';checkbox.type='checkbox';checkbox.checked=options.autoScroll;
 checkbox.addEventListener('change',()=>{options.autoScroll=checkbox.checked;save()});row.append(checkbox);view.append(row);
}
// Audio: existing Web Audio engine has distinct new / urgent / offline patterns and native volume selector.
// Surface the existing overdue/offline preferences next to sound settings. Move nodes, never clone IDs/listeners.
const groups=[...document.querySelectorAll('#settingsPage .pp163-pref-group')];
const audio=groups.find(g=>g.querySelector('#soundToggle'));
if(audio){
 const alerts=id('pp154-alert-settings');
 if(alerts){alerts.classList.add('pp164-alert-options');alerts.hidden=false;alerts.removeAttribute('hidden');audio.append(alerts);
  const oldToggle=id('pp154-alert-toggle');if(oldToggle){oldToggle.hidden=true;oldToggle.setAttribute('aria-hidden','true');oldToggle.tabIndex=-1;}}
 const row=document.createElement('div');row.className='pp164-audio-tests';
 // Reuse existing new/urgent test button instances so their registered event handlers remain intact.
 const newTest=id('pp141-test-sound'),urgentTest=id('pp145-test-urgent');
 if(newTest){newTest.textContent='♫ Uus tellimus';row.append(newTest)}
 if(urgentTest){urgentTest.textContent='♫ Hilinenud';row.append(urgentTest)}
 const offlineTest=document.createElement('button');offlineTest.type='button';offlineTest.textContent='♫ Ühenduse viga';
 offlineTest.addEventListener('click',()=>window.PPSound?.preview('offline'));row.append(offlineTest);
 const note=document.createElement('p');note.className='pp164-sound-note';note.textContent='Helitugevus ja uue tellimuse toon kasutavad olemasolevaid seadeid. Signaalid töötavad ainult aktiveeritud heliga ja avatud vaates.';
 audio.append(row,note);
}
// Visual transition: native status actions stay exactly the same. The core owns completion and errors.
const columns=id('pp157-columns-mount');
if(columns){columns.addEventListener('click',e=>{
 const button=e.target.closest('.ordercard button[data-action],.ordercard button[data-kitchen-action]');
 if(!button||button.disabled||button.dataset.action==='details')return;
 const card=button.closest('.ordercard');if(!card)return;
 card.classList.add('pp164-action-tap');setTimeout(()=>{if(card.isConnected)card.classList.remove('pp164-action-tap')},420);
 },true)}
// Opt-in autoscroll reacts only to newly delivered LIVE orders, not every poll or local reorder.
let lastNudge=0;
window.addEventListener('pp150:live-synced',e=>{
 if(!options.autoScroll||!Number(e.detail?.newlyArrived)||document.hidden||!id('ordersPage')?.classList.contains('active'))return;
 if(document.querySelector('dialog[open]')||document.activeElement?.matches('input,textarea,select'))return;
 const now=Date.now();if(now-lastNudge<4000)return;lastNudge=now;
 const card=id('newOrders')?.querySelector('.live-just-arrived');
 if(card)card.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
});
// Precision: status is existing urgency; accessible labels must not announce every second.
const accessible=()=>{
 for(const card of document.querySelectorAll('#ordersPage .ordercard.pp117-ticket')){
  const timer=card.querySelector('.pp117-countdown');if(!timer)continue;
  const urgency=card.classList.contains('urgency-late')?'Tähtaeg ületatud':card.classList.contains('urgency-soon')?'Alla viie minuti':'Valmistamise aeg';
  if(timer.getAttribute('aria-label')!==urgency)timer.setAttribute('aria-label',urgency);
  timer.setAttribute('aria-live','off');
 }
};
const pp171Tick='[data-timer],.prep-label,[data-pp110-priority],.pp117-countdown';
// v17.1: the 1s countdown rewrites timer text only; skip those records, react to real list changes and urgency class changes.
const pp171Meaningful=records=>records.some(r=>{const t=r.target&&r.target.nodeType===1?r.target:r.target?.parentElement;if(r.type==='attributes')return !!t&&t.classList.contains('ordercard');return !(t&&t.closest&&t.closest(pp171Tick));});
for(const list of [id('newOrders'),id('activeOrders')])if(list)new MutationObserver(records=>{if(pp171Meaningful(records))accessible()}).observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
accessible();
// Connection monitor driven exclusively by the app's existing LIVE events and polling schedule.
const topbar=document.querySelector('.topbar'),warn=document.createElement('div');
warn.className='pp164-connection-warning';warn.id='pp164-connection-warning';warn.dataset.active='false';warn.setAttribute('role','alert');
const message=document.createElement('span'),retry=document.createElement('button');
retry.type='button';retry.textContent='↻ Kontrolli';retry.setAttribute('aria-label','Proovi LIVE-tellimusi uuesti laadida');
warn.append(message,retry);if(topbar)topbar.after(warn);
let received=false,last=0,failed=false,attempts=0;
const isLive=()=>document.body.classList.contains('live-active');
const paint=()=>{
 const live=isLive(),offline=navigator.onLine===false,stale=received&&Date.now()-last>30000;
 const danger=live&&(offline||failed||stale);
 warn.dataset.active=String(!!danger);
 if(!danger)return;
 const age=last?Math.max(0,Math.floor((Date.now()-last)/1000)):0;
 message.textContent=offline?'⚠ Võrguühendus puudub. Kontrolli internetti.':failed?'⚠ LIVE-ühendus katkes. Viimased tellimused võivad olla aegunud.':`⚠ LIVE-andmed pole ${age} sekundit uuenenud.`;
 retry.disabled=offline;retry.title=offline?'Internet puudub':'Uuenda LIVE olemasoleva ühenduse kaudu';
};
retry.addEventListener('click',()=>{if(!isLive()||navigator.onLine===false)return;retry.disabled=true;retry.textContent='Kontrollin…';document.dispatchEvent(new Event('pp:refresh-live'));
 // A retry can be blocked by network/auth; never claim reconnection from clicking.
 setTimeout(()=>{retry.disabled=false;retry.textContent='↻ Kontrolli';paint()},6000)});
window.addEventListener('pp150:live-synced',e=>{received=true;failed=false;attempts=0;last=Number(e.detail?.lastSuccess)||Date.now();paint()});
window.addEventListener('pp150:live-failed',e=>{failed=true;attempts=Number(e.detail?.failures)||attempts+1;paint()});
window.addEventListener('pp150:live-stopped',()=>{received=false;failed=false;last=0;attempts=0;paint()});
window.addEventListener('offline',paint);window.addEventListener('online',paint);
const liveChip=id('pp160-live-chip');if(liveChip)liveChip.title='LIVE ühenduse olek. Katkemise korral ilmub uuesti kontrollimise nupp.';
setInterval(()=>{if(!document.hidden)paint()},5000);paint();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/menu-live-v1692.js == */
try{(function(){
/* v16.9.2: restore original LIVE action, preserve source handlers and order view. */
(()=>{'use strict';
 const page=document.getElementById('ordersPage');
 const header=page?.querySelector('.pp157-list-header');
 const native=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Laadi päris tellimused ainult lugemiseks');
 if(header&&native&&!page.querySelector('.pp1692-live-mount')){
  const mount=document.createElement('div');mount.className='pp1692-live-mount';
  mount.append(native);header.append(mount);
 }
 // An obsolete team section should not appear in the drawer or settings.
 for(const element of document.querySelectorAll('#drawer nav .navitem, #settingsPage section')){
  const title=element.querySelector('h2,h3,strong')?.textContent?.trim()||element.textContent.trim();
  if(/^Köögimeeskond$/i.test(title))element.remove();
 }
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/header-v171.js == */
try{(function(){
/* Peetri Pizza v17.1 — Statistika and Valmis (N) shortcuts in the approved header.
 * Reuses existing handlers only: the drawer's Statistika item (showPage) and the native
 * #toggleHistory button. No server requests, no LIVE writes, no new state.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const right=document.querySelector('.topbar .top-right');
if(!right||$('pp171-stats'))return;
const navStats=document.querySelector('#drawer [data-page="statistics"]');
const navOrders=document.querySelector('#drawer [data-page="orders"]');
const history=$('toggleHistory'),doneCount=$('doneCount');
const icon={
 stats:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
 check:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>'
};
const mk=(id,html,label)=>{const b=document.createElement('button');b.type='button';b.id=id;b.className='pp171-head-btn';b.innerHTML=html;b.setAttribute('aria-label',label);return b};
const stats=navStats?mk('pp171-stats',icon.stats+'<span class="pp171-label">Statistika</span>','Ava statistika'):null;
const ready=history?mk('pp171-ready',icon.check+'<span class="pp171-label">Valmis</span> <b id="pp171-ready-count">0</b>','Valmis tellimused'):null;
const anchor=$('pp160-live-chip')||$('clock')||right.firstChild;
for(const b of [stats,ready])if(b)right.insertBefore(b,anchor);
const ordersActive=()=>!!$('ordersPage')?.classList.contains('active');
if(stats)stats.addEventListener('click',()=>{navStats.click();sync()});
if(ready)ready.addEventListener('click',()=>{
 const open=history.getAttribute('aria-expanded')==='true';
 if(!ordersActive()){navOrders?.click();if(!open)history.click();}
 else history.click();
 if(history.getAttribute('aria-expanded')==='true'){
  const target=$('pp157-ready-section')||$('doneOrders');
  requestAnimationFrame(()=>target?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));
 }
 sync();
});
function sync(){
 if(stats){const on=!!$('statisticsPage')?.classList.contains('active');const v=String(on);if(stats.getAttribute('aria-pressed')!==v)stats.setAttribute('aria-pressed',v);}
 if(ready){
  const n=String(Number((doneCount?.textContent||'0').match(/\d+/)?.[0]||0));
  const out=$('pp171-ready-count');if(out&&out.textContent!==n)out.textContent=n;
  const on=String(ordersActive()&&history.getAttribute('aria-expanded')==='true');
  if(ready.getAttribute('aria-pressed')!==on)ready.setAttribute('aria-pressed',on);
  const label=`Valmis tellimused: ${n}`;if(ready.getAttribute('aria-label')!==label)ready.setAttribute('aria-label',label);
 }
}
if(doneCount)new MutationObserver(sync).observe(doneCount,{childList:true,characterData:true,subtree:true});
if(history)new MutationObserver(sync).observe(history,{attributes:true,attributeFilter:['aria-expanded']});
for(const page of document.querySelectorAll('.page'))new MutationObserver(sync).observe(page,{attributes:true,attributeFilter:['class']});
sync();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ui-v172.js == */
try{(function(){
/* Peetri Pizza v17.2 — DEMO / LIVE switch in the header + small consistency fixes.
 * The switch only clicks the ORIGINAL read-only LIVE button (same handler as "Reaalsed tellimused"),
 * so LIVE stays read-only and the existing polling/backoff logic is untouched.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const right=document.querySelector('.topbar .top-right');
const native=document.querySelector('button[aria-label="Laadi päris tellimused ainult lugemiseks"]');
if(right&&native&&!$('pp172-mode')){
 const wrap=document.createElement('div');wrap.id='pp172-mode';wrap.className='pp172-mode';wrap.setAttribute('role','group');wrap.setAttribute('aria-label','Andmeallikas');
 wrap.innerHTML='<button type="button" data-mode="demo">DEMO</button><button type="button" data-mode="live"><i aria-hidden="true"></i>LIVE</button>';
 const anchor=$('pp160-live-chip')||$('clock');right.insertBefore(wrap,anchor);
 const isLive=()=>document.body.classList.contains('live-active');
 let busy=false;
 wrap.addEventListener('click',e=>{
  const b=e.target.closest('button[data-mode]');if(!b||busy)return;
  // Phones show one pill: tapping it always toggles.
  const compact=getComputedStyle(wrap).getPropertyValue('--pp172-compact').trim()==='1';
  const want=compact?(isLive()?'demo':'live'):b.dataset.mode;
  if((want==='live')===isLive())return;
  busy=true;native.click();setTimeout(()=>{busy=false;sync()},400);
 });
 function sync(){
  const live=isLive(),err=live&&document.body.classList.contains('live-connection-error');
  const state=!live?'demo':err?'error':(window.pp150LiveConnecting?'pending':'live');
  if(wrap.dataset.state!==state)wrap.dataset.state=state;
  for(const b of wrap.querySelectorAll('button')){const on=String((b.dataset.mode==='live')===live);if(b.getAttribute('aria-pressed')!==on)b.setAttribute('aria-pressed',on)}
  const label=({demo:'Näidisandmed (DEMO). Vajuta LIVE, et laadida päris tellimused ainult lugemiseks.',live:'LIVE: päris tellimused, ainult lugemiseks',pending:'LIVE: ühendan…',error:'LIVE ühendus katkes — näidatakse viimaseid teadaolevaid tellimusi'})[state];
  if(wrap.title!==label)wrap.title=label;
 }
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 for(const ev of ['pp150:live-synced','pp150:live-failed','pp150:live-stopped'])window.addEventListener(ev,sync);
 sync();
}
// v17.3: full-screen button in the header (the old "Ekraanirežiim" row is hidden). Browser fullscreen only, no server calls.
if(right&&!$('pp173-fullscreen')){
 const root=document.documentElement;
 const req=root.requestFullscreen||root.webkitRequestFullscreen;
 const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
 const exit=()=>(document.exitFullscreen||document.webkitExitFullscreen)?.call(document);
 const fb=document.createElement('button');fb.type='button';fb.id='pp173-fullscreen';fb.className='pp171-head-btn pp173-fs';
 fb.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path class="pp173-in" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><path class="pp173-out" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
 const anchor=$('clock')||right.lastChild;right.insertBefore(fb,anchor);
 const toast=msg=>{const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)};
 const syncFs=()=>{const on=!!fsEl();fb.setAttribute('aria-pressed',String(on));const l=on?'Välju täisekraanilt':'Täisekraan';fb.setAttribute('aria-label',l);fb.title=l};
 fb.addEventListener('click',async()=>{
  try{if(fsEl())await exit();else if(req)await req.call(root);else throw Error('unsupported')}
  catch(_){toast('Täisekraan pole selles brauseris saadaval. Kasuta brauseri menüüd „Lisa avaekraanile”.')}
  syncFs();
 });
 document.addEventListener('fullscreenchange',syncFs);document.addEventListener('webkitfullscreenchange',syncFs);syncFs();
}
// Header sub-label still said "v16".
const sub=document.querySelector('.topbar .pp160-brand-sub small');if(sub&&/v16/.test(sub.textContent))sub.textContent='KÖÖGI TÖÖLAUD';
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v174.js == */
try{(function(){
/* Peetri Pizza v17.4 — kitchen reliability helpers.
 * 1) Session expired banner (any api/*.php answers 401) + LIVE refresh after network/page comes back.
 * 2) Screen Wake Lock (Seaded toggle, stored in this browser only).
 * 3) "Tap to enable sound" banner while LIVE is on and the browser still blocks audio.
 * 4) Clear on-screen notice when a kitchen tap is refused because LIVE data is stale (> 30 s).
 * 5) Client error journal: JS errors only (no orders, no customer data) -> api/client-log.php.
 * Nothing here talks to peetripizza.ee and nothing here changes LIVE data.
 */
(function(){
 'use strict';
 if(window.pp174Ops)return;window.pp174Ops=true;
 const $=id=>document.getElementById(id);
 const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v===null?f:v}catch(_){return f}};
 const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
 const csrf=()=>document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
 const release=()=>document.querySelector('meta[name="peetri-release"]')?.content||'';
 const liveOn=()=>document.body.classList.contains('live-active')&&!window.pp150LiveConnecting;
 function bar(id,cls,html){
  let el=$(id);if(el)return el;
  el=document.createElement('div');el.id=id;el.className='pp174-bar '+cls;el.hidden=true;el.setAttribute('role','alert');el.innerHTML=html;
  document.body.appendChild(el);return el;
 }
 const show=(el,on)=>{if(el.hidden===on)el.hidden=!on;};

 /* ---------- 1. Session expired ---------- */
 const sessionBar=bar('pp174-session','pp174-bar-danger','<strong>Sessioon aegus</strong><span>Logi uuesti sisse, muidu uued tellimused ei tule.</span><a class="pp174-bar-btn" href="./?aegus=1">Logi sisse</a>');
 const apiUrl=u=>{try{const x=new URL(u,location.href);return x.origin===location.origin&&/\/api\/[a-z0-9-]+\.php$/i.test(x.pathname)}catch(_){return false}};
 const nativeFetch=window.fetch;
 if(typeof nativeFetch==='function'){
  window.fetch=function(input,init){
   const url=typeof input==='string'?input:(input&&input.url)||'';
   const p=nativeFetch.apply(this,arguments);
   if(apiUrl(url))p.then(r=>{if(r.status===401){show(sessionBar,true);document.body.classList.add('pp174-session-expired');}else if(r.ok&&!sessionBar.hidden){show(sessionBar,false);document.body.classList.remove('pp174-session-expired');}}).catch(()=>{});
   return p;
  };
 }
 const refreshLive=()=>{if(document.body.classList.contains('live-active'))document.dispatchEvent(new Event('pp:refresh-live'));};
 window.addEventListener('online',()=>setTimeout(refreshLive,800));
 window.addEventListener('pageshow',e=>{if(e.persisted)refreshLive();});

 /* ---------- 2. Screen Wake Lock ---------- */
 const WL_KEY='pp-wakelock-v174';
 let wlWanted=!!read(WL_KEY,true),wl=null,wlInput=null;
 const wlSupported='wakeLock' in navigator;
 async function wlAcquire(){
  if(!wlSupported||!wlWanted||document.hidden||wl)return;
  try{wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null;wlLabel();});}catch(_){wl=null;}
  wlLabel();
 }
 function wlRelease(){try{wl&&wl.release()}catch(_){}wl=null;wlLabel();}
 function wlLabel(){
  const s=$('pp174-wakelock-state');if(!s)return;
  const t=!wlSupported?'See brauser ei toeta (vaja Chrome ja https)':!wlWanted?'Välja lülitatud':wl?'● Ekraan jääb põlema':'Aktiveerub esimesel puudutusel';
  if(s.textContent!==t)s.textContent=t;
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)wlAcquire();});
 // Some browsers need a user gesture for the first request.
 document.addEventListener('pointerdown',()=>{if(wlWanted&&!wl)wlAcquire();},{passive:true});
 function wlSettings(){
  const anchor=$('pp163-display-toggle')?.closest('.pp163-pref-group')||document.querySelector('#settingsPage .pp163-pref-group');
  if(!anchor||$('pp174-wakelock'))return;
  const row=document.createElement('div');row.className='pp163-setting-row pp174-setting-row';
  row.innerHTML='<div><strong>Ekraan ei kustu</strong><small>Planšeti ekraan jääb põlema, kuni rakendus on avatud. <span id="pp174-wakelock-state"></span></small></div>';
  const label=document.createElement('label');wlInput=document.createElement('input');wlInput.type='checkbox';wlInput.id='pp174-wakelock';wlInput.checked=wlWanted;wlInput.disabled=!wlSupported;
  const words=document.createElement('span');words.textContent='Sees';label.append(wlInput,words);row.append(label);
  const display=$('pp163-display-toggle')?.closest('.pp163-setting-row');
  if(display)display.after(row);else anchor.append(row);
  wlInput.addEventListener('change',()=>{wlWanted=wlInput.checked;save(WL_KEY,wlWanted);if(wlWanted)wlAcquire();else wlRelease();});
  wlLabel();
 }

 /* ---------- 3. Sound needs a tap ---------- */
 const soundBar=bar('pp174-sound','pp174-bar-warn','<strong>🔔 Heli on vaigistatud</strong><span>Puuduta siin, et uute tellimuste heli sisse lülitada.</span><button type="button" class="pp174-bar-btn">Lülita heli sisse</button>');
 soundBar.setAttribute('role','status');
 soundBar.addEventListener('click',async()=>{try{const d=window.PPSound?.diagnostics?.();if(d&&!d.enabled)$('soundBtn')?.click();const p=window.PPSound?.unlock?.();if(p)await p;}catch(_){}soundCheck();});
 function soundCheck(){
  const d=window.PPSound?.diagnostics?.();
  const blocked=!!d&&d.supported&&d.enabled&&d.state!=='running';
  show(soundBar,blocked&&liveOn()&&sessionBar.hidden);
 }

 /* ---------- 4. Stale LIVE data: explain clearly why a tap is not saved ---------- */
 // live-status-v155.js already refuses kitchen writes when LIVE is older than 30 s (safety rule, kept).
 // Its message lives in the hidden tools block, so the cook saw nothing. Show it on screen and retry LIVE.
 const STALE_MS=30000;
 const stale=()=>{
  if(!liveOn())return false;
  if(document.body.classList.contains('live-connection-error'))return true;
  const at=Number(window.pp155LiveFreshAt)||0;return !at||Date.now()-at>=STALE_MS;
 };
 const ageText=()=>{const at=Number(window.pp155LiveFreshAt)||0;if(!at)return 'Ühendus LIVE-iga puudub.';const s=Math.round((Date.now()-at)/1000);return s<120?`Viimane uuendus ${s} s tagasi.`:`Viimane uuendus ${Math.round(s/60)} min tagasi.`};
 const dlg=document.createElement('div');dlg.id='pp174-stale';dlg.className='pp174-confirm';dlg.hidden=true;
 dlg.innerHTML='<div class="pp174-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="pp174-stale-title"><h3 id="pp174-stale-title">LIVE andmed on aegunud</h3><p id="pp174-stale-text"></p><p class="pp174-confirm-note">Muudatust ei salvestatud, et köök ei töötaks vanade andmetega. Proovin kohe uuesti ühenduda — kui LIVE on taas roheline, vajuta nuppu uuesti.</p><div class="pp174-confirm-actions"><button type="button" class="secondary" data-pp174="close">Sulge</button><button type="button" data-pp174="retry">Uuenda kohe</button></div></div>';
 document.body.appendChild(dlg);
 const closeDlg=()=>{dlg.hidden=true;};
 dlg.addEventListener('click',e=>{
  const b=e.target.closest('[data-pp174]');if(!b&&e.target!==dlg)return;
  closeDlg();if(b&&b.dataset.pp174==='retry')refreshLive();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dlg.hidden)closeDlg();});
 // window capture runs before live-status-v155's document capture handler (which stops propagation).
 window.addEventListener('click',e=>{
  const btn=e.target.closest&&e.target.closest('#ordersPage button[data-kitchen-action]');
  if(!btn||btn.disabled||!stale())return;
  e.preventDefault();e.stopImmediatePropagation();
  $('pp174-stale-text').textContent=ageText();
  dlg.hidden=false;dlg.querySelector('[data-pp174="retry"]').focus();
  refreshLive();
 },true);
 // Close the notice by itself once fresh LIVE data arrives.
 window.addEventListener('pp150:live-synced',()=>{if(!dlg.hidden){closeDlg();window.toast?.('LIVE on taas ühendatud · vajuta nuppu uuesti');}});

 /* ---------- 5. Client error journal ---------- */
 let sent=0;const seen=new Set();
 const clip=(s,n)=>String(s==null?'':s).replace(/[\u0000-\u001f]+/g,' ').slice(0,n);
 const file=u=>{try{const x=new URL(u,location.href);return x.origin===location.origin?x.pathname.split('/').pop():'external'}catch(_){return ''}};
 function report(kind,message,source,line,col,stack){
  if(sent>=10)return;
  const key=kind+'|'+message+'|'+source+'|'+line;if(seen.has(key))return;seen.add(key);sent++;
  const page=document.querySelector('.page.active,section.page:not([hidden])')?.id||'';
  const body=JSON.stringify({kind,message:clip(message,300),source:clip(file(source),80),line:Number(line)||0,col:Number(col)||0,stack:clip(stack,600),release:clip(release(),20),page:clip(page,40),mode:liveOn()?'live':'demo'});
  try{nativeFetch.call(window,'api/client-log.php',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf()},body}).catch(()=>{});}catch(_){}
 }
 window.addEventListener('error',e=>{
  if(!e||!(e.message||e.error))return; // resource load errors have no message
  if(e.message==='Script error.')return; // cross-origin, no details
  report('error',e.message,e.filename,e.lineno,e.colno,e.error&&e.error.stack);
 });
 window.addEventListener('unhandledrejection',e=>{
  const r=e&&e.reason;if(r&&r.name==='AbortError')return;
  report('promise',r&&r.message||String(r),r&&r.fileName||'',0,0,r&&r.stack);
 });
 window.pp174Report=(m)=>report('manual',m,'',0,0,'');

 /* ---------- v17.5: header Ooteaeg follows the server value ---------- */
 // header-v115.js reloads the wait time every 12 s but sets the hidden original <select> without a change
 // event, so the visible header copy (#pp158-wait-select) kept the old value when another tablet changed it.
 document.addEventListener('peetri:wait-time-change',e=>{
  const v=String(e.detail&&e.detail.minutes||'');const s=$('pp158-wait-select');
  if(s&&v&&s.value!==v&&document.activeElement!==s&&[...s.options].some(o=>o.value===v))s.value=v;
 });

 /* ---------- start ---------- */
 function start(){wlSettings();wlAcquire();soundCheck();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 setInterval(soundCheck,2000);
 window.addEventListener('pp150:live-synced',soundCheck);
 document.addEventListener('pointerdown',()=>setTimeout(soundCheck,300),{passive:true});
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v176.js == */
try{(function(){
/* Peetri Pizza v17.6 — site status (read-only), menu lock, offline shell, daily summary.
 * Never writes to peetripizza.ee. Uses only this app's own api/*.php endpoints.
 */
(function(){
 'use strict';
 if(window.pp176Ops)return;window.pp176Ops=true;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const toast=t=>{try{window.toast?.(t)}catch(_){}};
 const liveOn=()=>document.body.classList.contains('live-active');
 /* Small shared scheduler: visible-only, slower after errors (max 5 min). */
 function every(ms,fn){let fails=0,timer=null;
  const run=async()=>{clearTimeout(timer);timer=null;if(document.hidden)return;let ok=true;try{ok=(await fn())!==false}catch(_){ok=false}fails=ok?0:Math.min(fails+1,4);timer=setTimeout(run,Math.min(300000,ms*Math.pow(2,fails)))};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!timer)run();});
  return run;
 }
 window.PPEvery=every;

 /* ---------- 2 + 3: what the customer website shows ---------- */
 let site=null;
 const badge=document.createElement('span');badge.id='pp176-site';badge.className='pp176-site';badge.hidden=true;badge.setAttribute('role','status');
 function placeBadge(){const w=$('pp158-wait-select')?.closest('.pp158-wait');if(w&&badge.parentElement!==w)w.appendChild(badge);}
 function localWait(){const v=Number($('pp158-wait-select')?.value||$('pp114-wait-select')?.value);return Number.isFinite(v)&&v>0?v:null;}
 function paintBadge(){
  placeBadge();
  if(!site){badge.hidden=true;return;}
  let text='',kind='';
  if(site.temporarily_closed){text='Saidil SULETUD';kind='danger';}
  else if(site.wait_time_minutes!=null&&localWait()!=null&&site.wait_time_minutes!==localWait()){text='Saidil '+site.wait_time_minutes+' min';kind='warn';}
  const title=site.temporarily_closed?'Peetri Pizza kodulehel on see pitseeria märgitud ajutiselt suletuks. Kliendid ei saa tellida.':
   'Kliendid näevad kodulehel ooteaega '+site.wait_time_minutes+' min. Siin valitud ooteaeg kehtib ainult selles rakenduses.';
  if(badge.textContent!==text)badge.textContent=text;badge.dataset.kind=kind;badge.title=title;badge.hidden=!text;
 }
 function paintMissing(){
  const page=$('productsPage');if(!page)return;
  let box=$('pp176-missing');
  if(!box){box=document.createElement('section');box.id='pp176-missing';box.className='pp176-missing';
   (page.querySelector('.pp140-intro')||page.firstElementChild)?.insertAdjacentElement('afterend',box)||page.prepend(box);}
  if(!site){box.innerHTML='<div class="pp176-missing-head"><strong>Kodulehel otsas</strong><small>Andmeid ei saanud kodulehelt laadida.</small></div>';return;}
  const all=[...site.missing_products.map(x=>({...x,t:'Toode'})),...site.missing_toppings.map(x=>({...x,t:'Lisand'}))];
  const when=new Date((site.checked_at||0)*1000).toLocaleTimeString('et-EE',{hour:'2-digit',minute:'2-digit'});
  const head='<div class="pp176-missing-head"><strong>Kodulehel otsas · klient ei saa tellida</strong><small>'+(site.temporarily_closed?'<b class="pp176-closed">Pitseeria on kodulehel ajutiselt suletud.</b> ':'')+
   (site.today_hours?'Täna avatud '+esc(site.today_hours)+' · ':'')+'Kontrollitud '+esc(when)+(site.stale?' (vana andmestik)':'')+' · ainult vaatamiseks</small></div>';
  box.innerHTML=head+(all.length?'<div class="pp176-chips">'+all.map(x=>'<span class="pp176-chip" data-type="'+esc(x.t)+'"><em>'+esc(x.t)+'</em>'+esc(x.name)+'</span>').join('')+'</div>':'<p class="pp176-none">Kodulehel on kõik saadaval.</p>');
 }
 async function loadSite(){
  try{const r=await fetch('api/site-status.php',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
   if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(!j.ok)throw Error('bad');
   j.missing_products=Array.isArray(j.missing_products)?j.missing_products:[];j.missing_toppings=Array.isArray(j.missing_toppings)?j.missing_toppings:[];
   site=j;paintBadge();paintMissing();return true;
  }catch(_){paintBadge();paintMissing();return false;}
 }
 document.addEventListener('peetri:wait-time-change',()=>setTimeout(paintBadge,0));
 document.addEventListener('change',e=>{if(e.target&&(e.target.id==='pp158-wait-select'||e.target.id==='pp114-wait-select'))setTimeout(paintBadge,0);});

 /* ---------- 4: menu lock without the hidden tools block ---------- */
 const nativeLock=()=>$('pp148-tablet-lock');
 const locked=()=>document.body.classList.contains('pp148-locked');
 function lockRow(){
  if($('pp176-lock'))return;
  const anchor=$('pp174-wakelock')?.closest('.pp163-setting-row')||$('pp163-display-toggle')?.closest('.pp163-setting-row');if(!anchor||!nativeLock())return;
  const row=document.createElement('div');row.className='pp163-setting-row pp174-setting-row';
  row.innerHTML='<div><strong>Lukusta menüü</strong><small>Kaitseb juhusliku vajutuse eest: menüü ja Seaded ei avane. Lahti saab, kui hoiad menüünuppu 2 sekundit all.</small></div>';
  const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.id='pp176-lock';input.checked=locked();
  const words=document.createElement('span');words.textContent='Sees';label.append(input,words);row.append(label);anchor.after(row);
  input.addEventListener('change',()=>{if(input.checked!==locked())nativeLock()?.click();input.checked=locked();if(locked()){toast('Menüü lukus · avamiseks hoia menüünuppu 2 s');window.showPage?.('orders');}});
 }
 new MutationObserver(()=>{const i=$('pp176-lock');if(i&&i.checked!==locked())i.checked=locked();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 // Long-press (2 s) on the menu button unlocks; a short tap explains how.
 let pressTimer=null,unlockedByPress=false;
 window.addEventListener('pointerdown',e=>{if(!locked()||!e.target.closest?.('#menuBtn'))return;unlockedByPress=false;clearTimeout(pressTimer);
  pressTimer=setTimeout(()=>{if(locked()){nativeLock()?.click();unlockedByPress=true;toast('Menüü avatud');}},2000);},true);
 ['pointerup','pointercancel','pointerleave'].forEach(t=>window.addEventListener(t,()=>{clearTimeout(pressTimer);pressTimer=null;},true));
 window.addEventListener('click',e=>{if(!e.target.closest?.('#menuBtn'))return;
  if(unlockedByPress){unlockedByPress=false;e.preventDefault();e.stopImmediatePropagation();return;}
  if(locked())toast('Menüü on lukus · hoia menüünuppu 2 sekundit');},true);

 /* ---------- 5: offline shell + banner ---------- */
 const offBar=document.createElement('div');offBar.id='pp176-offline';offBar.className='pp174-bar pp174-bar-warn pp176-offline';offBar.hidden=true;offBar.setAttribute('role','status');
 offBar.innerHTML='<strong>Internet puudub</strong><span>Näidatud viimased teadaolevad andmed. LIVE jätkub ise, kui ühendus tagasi tuleb.</span>';
 document.body.appendChild(offBar);
 const net=()=>{offBar.hidden=navigator.onLine!==false;};window.addEventListener('online',net);window.addEventListener('offline',net);net();
 if('serviceWorker' in navigator&&window.isSecureContext){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});});
  // Logging out removes the offline copy of the dashboard right away.
  document.addEventListener('submit',e=>{const f=e.target;if(f&&f.querySelector?.('input[name="action"][value="logout"]'))navigator.serviceWorker.controller?.postMessage('pp-clear-shell');},true);
 }

 /* ---------- 6: today's kitchen summary (Statistika) ---------- */
 const todayKey=d=>{const x=new Date(d);return x.getFullYear()+'-'+x.getMonth()+'-'+x.getDate();};
 // v17.8: pizza boxes used today (orders on screen, by size; branded counted separately).
 function boxesHtml(list){
  const info=window.PPOrderInfo;if(!info)return '';
  const total=new Map();let dine=0;
  for(const o of list){const b=info.boxes(o);if(b===null){dine++;continue;}for(const [k,n] of b)total.set(k,(total.get(k)||0)+n);}
  const rows=info.boxOrder.filter(k=>total.has(k)).map(k=>'<div class="pp178-box"><strong>'+esc(total.get(k))+'</strong><small>'+esc(k)+'</small></div>').join('');
  const sum=[...total.values()].reduce((a,b)=>a+b,0);
  return '<div class="pp178-boxes-head"><strong>📦 Karbid täna</strong><span>'+esc(sum)+' kokku'+(dine?' · '+esc(dine)+' tellimust kohapeal':'')+'</span></div>'+(rows?'<div class="pp178-box-row">'+rows+'</div>':'<p class="pp178-box-none">Täna pole veel pitsakarpe vaja läinud.</p>');
 }
 async function summary(){
  const page=$('statisticsPage');if(!page)return true;
  let box=$('pp176-today');
  if(!box){box=document.createElement('section');box.id='pp176-today';box.className='pp176-today';
   const panel=page.querySelector('.panel');const h=panel?.querySelector('h2');(h||panel||page).insertAdjacentElement(h?'afterend':'afterbegin',box);}
  const now=Date.now(),tk=todayKey(now);
  const snap=window.pp145LatestSnapshot;const orders=Array.isArray(snap?.orders)?snap.orders:[];
  const todays=orders.filter(o=>o.created&&todayKey(o.created)===tk);
  const late=todays.filter(o=>o.status==='done'&&o.completed&&o.deadline&&o.completed>o.deadline).length;
  let avg=null,accepted=0,done=0,src='DEMO';
  if(liveOn()||String(snap?.source||'').startsWith('LIVE')){
   src='LIVE';
   try{const r=await fetch('api/kitchen-history.php?limit=500',{credentials:'same-origin',cache:'no-store'});const j=await r.json();
    if(r.ok&&j.ok&&Array.isArray(j.events)){
     const acc=new Map(),fin=new Map();
     for(const ev of j.events){const t=Date.parse(ev.at);if(!t||todayKey(t)!==tk)continue;
      if(ev.to==='active'&&ev.from==='new'){accepted++;if(!acc.has(ev.order)||acc.get(ev.order)>t)acc.set(ev.order,t);}
      if(ev.to==='done'){done++;if(!fin.has(ev.order)||fin.get(ev.order)<t)fin.set(ev.order,t);}}
     const spans=[];for(const [id,t] of fin){const a=acc.get(id);if(a&&t>a)spans.push(t-a);}
     if(spans.length)avg=Math.round(spans.reduce((s,x)=>s+x,0)/spans.length/60000);
    }}catch(_){}
  }else{accepted=todays.filter(o=>o.status!=='new').length;done=todays.filter(o=>o.status==='done').length;}
  const tile=(label,val,hint)=>'<div class="pp176-tile"><small>'+esc(label)+'</small><strong>'+esc(val)+'</strong>'+(hint?'<span>'+esc(hint)+'</span>':'')+'</div>';
  const html='<div class="pp176-today-head"><strong>Täna köögis</strong><span>'+esc(src)+'</span></div><div class="pp176-tiles">'+
   tile('Tellimusi täna',todays.length,'ekraanil olevad')+tile('Vastu võetud',accepted,'')+tile('Valmis',done,'')+
   tile('Keskmine valmimisaeg',avg==null?'—':avg+' min',src==='LIVE'?'Võta vastu → Valmis':'arvutatakse LIVE režiimis')+tile('Hilinenud',late,'valmis pärast tähtaega')+'</div>'+boxesHtml(todays);
  if(box.innerHTML!==html)box.innerHTML=html;
  return true;
 }
 window.addEventListener('pp145:orders',()=>{if($('statisticsPage')?.classList.contains('active'))summary();});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="statistics"],#pp171-stats')){setTimeout(summary,50);setTimeout(summary,700);}});

 /* ---------- start ---------- */
 function start(){lockRow();placeBadge();every(60000,loadSite)();every(60000,summary)();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v179.js == */
try{(function(){
/* Peetri Pizza v17.9 — new order visible without sound, urgent orders on top, 14:00 dough reminder.
 * Local only: nothing is sent to peetripizza.ee or to the dough supplier.
 */
(function(){
 'use strict';
 if(window.pp179Ops)return;window.pp179Ops=true;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v===null?f:v}catch(_){return f}};
 const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
 const play=k=>{try{return window.PPSound?.play?.(k)}catch(_){return false}};
 const tallinn=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const now=()=>{const p=Object.fromEntries(tallinn.formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,hm:`${p.hour}:${p.minute}`,min:Number(p.hour)*60+Number(p.minute)}};

 /* ---------- 1: new order you can see without sound ---------- */
 const alertBox=document.createElement('div');alertBox.id='pp179-new';alertBox.hidden=true;alertBox.setAttribute('role','alert');
 document.body.appendChild(alertBox);
 let known=null;const pending=new Map();
 function info(o){
  const raw=(window.pp153RawLiveOrders||[]).find(x=>x&&x.id===o.id)||o;
  const items=Array.isArray(o.items)?o.items:[];
  return {id:o.id,number:o.number,name:raw.customerName||'',count:items.reduce((n,i)=>n+(Number(i[1])||0),0)};
 }
 function paintAlert(){
  if(!pending.size){alertBox.hidden=true;document.body.classList.remove('pp179-flash');return;}
  const list=[...pending.values()];const first=list[0];
  alertBox.innerHTML='<div class="pp179-new-box"><span class="pp179-new-tag">UUS TELLIMUS'+(list.length>1?' · '+list.length:'')+'</span><strong>#'+esc(first.number)+'</strong>'+(first.name?'<b>'+esc(first.name)+'</b>':'')+(first.count?'<em>'+esc(first.count)+' toodet</em>':'')+(list.length>1?'<small>+ '+esc(list.slice(1).map(x=>'#'+x.number).join(', '))+'</small>':'')+'<button type="button">Selge</button></div>';
  alertBox.hidden=false;document.body.classList.add('pp179-flash');
 }
 alertBox.addEventListener('click',()=>{pending.clear();paintAlert();document.getElementById('newOrders')?.scrollIntoView({block:'start',behavior:'smooth'});});
 window.addEventListener('pp145:orders',()=>{
  const snap=window.pp145LatestSnapshot;const orders=Array.isArray(snap?.orders)?snap.orders:[];
  const ids=new Set(orders.map(o=>o.id));
  if(known===null||known.src!==snap?.source){known={src:snap?.source,ids};return;} // first data / DEMO<->LIVE switch: baseline only
  for(const o of orders)if(o.status==='new'&&!known.ids.has(o.id))pending.set(o.id,info(o));
  for(const id of [...pending.keys()]){const o=orders.find(x=>x.id===id);if(!o||o.status!=='new')pending.delete(id);} // accepted elsewhere
  known.ids=ids;paintAlert();
 });

 /* ---------- 3: urgent orders on top + one short signal ---------- */
 const URG_KEY='pp179-urgent-signalled';let signalled=new Set(read(URG_KEY,[]));
 function urgentPass(){
  for(const col of ['newOrders','activeOrders']){const box=$(col);if(!box)continue;
   const cards=[...box.querySelectorAll(':scope > .ordercard, :scope .ordercard')];
   for(const c of cards){const late=c.classList.contains('urgency-late'),soon=c.classList.contains('urgency-soon');
    c.classList.toggle('pp179-top',late||soon);
    const id=c.dataset.orderId;if(!id||!(late||soon))continue;
    const key=id+(late?':late':':soon');
    if(!signalled.has(key)){signalled.add(key);if(!document.hidden)play('urgent');c.classList.add('pp179-pulse');setTimeout(()=>c.classList.remove('pp179-pulse'),4000);}
   }}
  if(signalled.size>400)signalled=new Set([...signalled].slice(-200));save(URG_KEY,[...signalled]);
 }
 // Remember already-urgent orders at start so a reload does not beep for all of them.
 let mutQueued=false;const mo=new MutationObserver(()=>{if(mutQueued)return;mutQueued=true;queueMicrotask(()=>{mutQueued=false;markTop();});});
 function markTop(){document.querySelectorAll('#newOrders .ordercard,#activeOrders .ordercard').forEach(c=>c.classList.toggle('pp179-top',c.classList.contains('urgency-late')||c.classList.contains('urgency-soon')));}
 for(const col of ['newOrders','activeOrders'])if($(col))mo.observe($(col),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 setTimeout(()=>{document.querySelectorAll('.ordercard.urgency-late,.ordercard.urgency-soon').forEach(c=>{const id=c.dataset.orderId;if(id){signalled.add(id+':soon');if(c.classList.contains('urgency-late'))signalled.add(id+':late');}});setInterval(urgentPass,2000);urgentPass();},2500);

 /* ---------- 6 (replaced): dough reminder at 14:00, order closes 15:05 ---------- */
 const START=14*60,CLOSE=15*60+5;
 const bar=document.createElement('div');bar.id='pp179-dough';bar.hidden=true;bar.setAttribute('role','alert');document.body.appendChild(bar);
 let orderedCache={date:'',at:0,ordered:false};
 async function orderedToday(date){
  if(orderedCache.date===date&&orderedCache.ordered)return true;
  if(orderedCache.date===date&&Date.now()-orderedCache.at<120000)return orderedCache.ordered;
  try{const r=await fetch('api/dough.php',{credentials:'same-origin',cache:'no-store'});const j=await r.json();
   const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit'});
   const ok=r.ok&&j.ok&&Array.isArray(j.orders)&&j.orders.some(o=>o&&o.created_at&&fmt.format(new Date(o.created_at))===date&&o.status!=='Tühistatud');
   // v17.48: also counts dough already ordered today in the official Peetri Pizza panel (read-only)
   let site=false;if(!ok){try{const r2=await fetch('api/dough-site.php',{credentials:'same-origin',cache:'no-store'});const j2=await r2.json();site=!!(r2.ok&&j2.ok&&Array.isArray(j2.orders)&&j2.orders.length);}catch(_){}}
   orderedCache={date,at:Date.now(),ordered:!!(ok||site)};return !!(ok||site);
  }catch(_){return false}
 }
 async function doughCheck(){
  const t=now();const snoozeUntil=Number(read('pp179-dough-snooze',0))||0;
  if(t.min<START||t.min>=CLOSE||read('pp179-dough-done',null)===t.date||Date.now()<snoozeUntil){bar.hidden=true;return;}
  if(await orderedToday(t.date)){save('pp179-dough-done',t.date);bar.hidden=true;return;}
  const left=CLOSE-t.min;const urgent=left<=20;
  bar.className=urgent?'pp179-dough-urgent':'';
  bar.innerHTML='<div class="pp179-dough-box"><span class="pp179-dough-ico">🥖</span><div><strong>Telli tainas!</strong><small>Tellimine sulgub kell 15:05 · jäänud '+left+' min. Pärast seda ainult külmutatud tooted.</small></div><a class="pp179-dough-go" href="dough.php">Telli nüüd</a><button type="button" data-pp179="snooze">15 min pärast</button></div>';
  if(bar.hidden){bar.hidden=false;play(urgent?'urgent':'new');}
 }
 bar.addEventListener('click',e=>{const b=e.target.closest('[data-pp179]');if(!b)return;if(b.dataset.pp179==='snooze'){save('pp179-dough-snooze',Date.now()+15*60000);bar.hidden=true;}});
 window.pp179DoughCheck=doughCheck;
 const tick=()=>{if(!document.hidden)doughCheck();};
 setInterval(tick,60000);document.addEventListener('visibilitychange',tick);setTimeout(tick,3000);
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1711.js == */
try{(function(){
/* Peetri Pizza v17.11
 *  A) "Klienti ootavad tellimused" on the home screen shows full ready cards (name, number, products, sum, Üle antud)
 *     instead of the 3 short rows. Cards are copies of the real #doneOrders cards; every button forwards to the original one.
 *  B) "↶ Tagasi" for 10 s after Võta vastu / Valmis (LIVE) and after Üle antud (LIVE and DEMO). Our server only.
 *  C) "Lõpeta vahetus": end-of-shift summary with 80 mm print. Read-only.
 * Nothing is sent to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.pp1711Ops)return;window.pp1711Ops=true;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const live=()=>document.body.classList.contains('live-active');
 const scopeKey=id=>(live()?'live:':'demo:')+id;
 const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
 const withConfirmYes=fn=>{const old=window.confirm;window.confirm=()=>true;try{return fn()}finally{window.confirm=old}};
 let pickupRecords={},pickupConnected=false;
 window.addEventListener('pp155:pickup-state',e=>{pickupRecords=e.detail?.records||{};pickupConnected=!!e.detail?.connected;});

 /* ---------- A: full cards in "Klienti ootavad tellimused" ---------- */
 const done=$('doneOrders');
 let wrap=null,lastSig='',queued=false;
 function waitingCards(){
  if(!done)return [];
  return [...done.querySelectorAll('.pp112-done-card')].filter(card=>{
   const id=card.dataset.orderId||'';
   if(live()?!/^live-[a-f0-9]{24}$/.test(id):!/^demo-[a-zA-Z0-9-]{1,80}$/.test(id))return false;
   return !pickupRecords[scopeKey(id)]?.handed_at;
  }).sort((a,b)=>{const x=Number(a.dataset.readyAt)||Number.MAX_SAFE_INTEGER,y=Number(b.dataset.readyAt)||Number.MAX_SAFE_INTEGER;return x-y;});
 }
 function ensureWrap(){
  if(wrap&&wrap.isConnected)return wrap;
  const rows=$('pp158-pickup-rows');if(!rows)return null;
  wrap=document.createElement('div');wrap.id='pp1711-pickup';wrap.className='pp1711-pickup';wrap.setAttribute('aria-live','polite');
  rows.insertAdjacentElement('afterend',wrap);document.body.classList.add('pp1711-cards');
  return wrap;
 }
 function renderCards(){
  queued=false;const box=ensureWrap();if(!box)return;
  const cards=waitingCards();
  const sig=cards.map(c=>c.outerHTML).join('')+'|'+pickupConnected;
  if(sig===lastSig&&box.childElementCount)return;lastSig=sig;
  if(!cards.length){box.innerHTML='<p class="pp1711-empty">'+(pickupConnected?'Kõik valmis tellimused on väljastatud.':'Valmis tellimusi pole.')+'</p>';return;}
  const frag=document.createDocumentFragment();
  for(const card of cards){
   const copy=card.cloneNode(true);
   copy.dataset.pp1711Id=card.dataset.orderId;copy.removeAttribute('data-order-id');copy.classList.add('pp1711-copy');
   copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
   const at=Number(card.dataset.readyAt);copy.classList.toggle('pp1711-late',at>0&&Date.now()-at>=15*60000);
   frag.appendChild(copy);
  }
  box.replaceChildren(frag);
 }
 const scheduleCards=()=>{if(queued)return;queued=true;requestAnimationFrame(renderCards);};
 if(done)new MutationObserver(scheduleCards).observe(done,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','class','data-ready-at']});
 window.addEventListener('pp155:pickup-state',scheduleCards);
 for(const ev of ['pp150:live-synced','pp150:live-stopped','pp145:orders'])window.addEventListener(ev,scheduleCards);
 setInterval(()=>{if(!document.hidden)scheduleCards();},15000);
 // Buttons in a copy press the same button of the real card (same position), so all existing logic stays in one place.
 window.addEventListener('click',e=>{
  const btn=e.target.closest?.('#pp1711-pickup .pp1711-copy button');if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();
  const copy=btn.closest('.pp1711-copy'),id=copy.dataset.pp1711Id;
  const real=done&&[...done.querySelectorAll('.pp112-done-card')].find(c=>c.dataset.orderId===id);
  if(!real)return;
  const i=[...copy.querySelectorAll('button')].indexOf(btn),target=real.querySelectorAll('button')[i];
  if(target&&!target.disabled&&target.className===btn.className){btn.disabled=true;target.click();}
 },true);

 /* ---------- B: undo for 10 seconds ---------- */
 const bar=document.createElement('div');bar.id='pp1711-undo';bar.hidden=true;bar.setAttribute('role','status');
 bar.innerHTML='<span id="pp1711-undo-text"></span><button type="button" id="pp1711-undo-btn">↶ Tagasi <b id="pp1711-undo-left">10</b></button>';
 document.body.appendChild(bar);
 let undo=null,tick=null;
 function hideUndo(){undo=null;clearInterval(tick);bar.hidden=true;}
 function offerUndo(label,run){
  clearInterval(tick);undo={run,until:Date.now()+10000};
  $('pp1711-undo-text').textContent=label;$('pp1711-undo-left').textContent='10';$('pp1711-undo-btn').disabled=false;bar.hidden=false;
  tick=setInterval(()=>{const left=Math.ceil((undo.until-Date.now())/1000);if(left<=0)return hideUndo();$('pp1711-undo-left').textContent=String(left);},250);
 }
 window.pp1711OfferUndo=offerUndo;
 $('pp1711-undo-btn').addEventListener('click',async()=>{
  if(!undo)return;const run=undo.run;$('pp1711-undo-btn').disabled=true;clearInterval(tick);
  try{await run();toast2('↶ Tagasi võetud');}catch(err){toast2('⚠ Tagasivõtmine ebaõnnestus: '+(err&&err.message||err));}
  hideUndo();
 });
 function toast2(m){try{if(typeof window.toast==='function')return window.toast(m);}catch(_){}
  const t=$('toast');if(t){t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);}}
 const numberOf=id=>{const o=(window.pp153RawLiveOrders||[]).find(x=>x&&x.id===id)||(window.pp145LatestSnapshot?.orders||[]).find(x=>x&&x.id===id);return o?.number?'#'+o.number:'Tellimus';};

 // LIVE Võta vastu / Valmis: the undo bar replaces the "Kas tellimus on valmis?" question.
 window.addEventListener('click',e=>{
  const b=e.target.closest?.('button[data-kitchen-action="done"]');if(!b||!live())return;
  const old=window.confirm;window.confirm=()=>true;setTimeout(()=>{window.confirm=old;},0);
 },true);
 let reverting=false;
 window.addEventListener('pp155:status-saved',e=>{
  const id=e.detail?.id,next=e.detail?.status;if(reverting||!id||!/^live-[a-f0-9]{24}$/.test(id))return;
  const back=next==='active'?'new':next==='done'?'active':null;if(!back)return;
  offerUndo(numberOf(id)+' → '+(next==='done'?'Valmis':'Valmistamisel'),async()=>{
   const raw=(window.pp153RawLiveOrders||[]).find(o=>o&&o.id===id);if(!raw)throw new Error('tellimust ei leitud');
   await window.PPKitchenStatus?.pull?.(false);
   reverting=true;
   try{
    const r=await fetch('api/kitchen-status.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-Token':csrf},
     body:JSON.stringify({id,status:back,official_status:raw.status,expected_revision:window.PPKitchenStatus?.revision?.(id)||0})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.ok)throw new Error(r.status===409?'teine töötaja muutis tellimust':(j.error||'HTTP '+r.status));
   }finally{reverting=false;await window.PPKitchenStatus?.pull?.(true);window.pp153UpdateKitchenUI?.();}
  });
 });
 // Üle antud (any button that hands over: card, home section, Väljastus window): offer undo once the server confirms.
 const handing=new Map();
 window.addEventListener('click',e=>{
  const b=e.target.closest?.('.pp154-handover,.pp158-handover,[data-pp155-pickup]');if(!b)return;
  let id=b.dataset.pp155Pickup||b.closest('[data-order-id]')?.dataset.orderId||b.closest('[data-pp1711-id]')?.dataset.pp1711Id||'';
  if(!id){const row=b.closest('.pp158-pickup-row');id=row?.dataset.orderId||'';}
  if(!id)return;const k=scopeKey(id);if(pickupRecords[k]?.handed_at)return; // that click was an undo, not a handover
  handing.set(k,{id,at:Date.now()});
 },true);
 window.addEventListener('pp155:pickup-state',()=>{
  for(const [k,v] of handing){
   if(Date.now()-v.at>20000){handing.delete(k);continue;}
   if(!pickupRecords[k]?.handed_at)continue;
   handing.delete(k);
   offerUndo(numberOf(v.id)+' → Üle antud',async()=>{
    const real=done&&[...done.querySelectorAll('.pp112-done-card')].find(c=>c.dataset.orderId===v.id);
    const btn=real?.querySelector('.pp154-handover');if(!btn||btn.disabled)throw new Error('nuppu ei leitud');
    withConfirmYes(()=>btn.click());
   });
  }
 });

 /* ---------- C: Lõpeta vahetus ---------- */
 const dlg=document.createElement('dialog');dlg.id='pp1711-shift';dlg.className='pp1711-shift';
 dlg.innerHTML='<div class="pp1711-shift-head"><div><small>PEETRI PIZZA · VAHETUSE KOKKUVÕTE</small><h2>🧾 Lõpeta vahetus</h2></div><button type="button" id="pp1711-shift-close" aria-label="Sulge">✕</button></div><div id="pp1711-shift-body" class="pp1711-shift-body"></div><div class="pp1711-shift-actions"><button type="button" id="pp1711-shift-print">⎙ Prindi 80 mm</button><button type="button" class="secondary" id="pp1711-shift-done">Sulge</button></div>';
 document.body.appendChild(dlg);
 $('pp1711-shift-close').addEventListener('click',()=>dlg.close());$('pp1711-shift-done').addEventListener('click',()=>dlg.close());
 const tzDay=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit'});
 const tzTime=new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit'});
 const tzDate=new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn',day:'numeric',month:'long',year:'numeric'});
 const dayOf=t=>tzDay.format(new Date(t));
 const money=n=>new Intl.NumberFormat('et-EE',{style:'currency',currency:'EUR'}).format(n||0);
 const baseName=n=>String(n||'').split(/\s+[—–-]\s+/)[0].replace(/\s*\((small|large|family|väike|suur|pere)[^)]*\)/ig,'').trim().slice(0,60);
 let lastShift=null;
 async function shiftData(){
  const now=Date.now(),today=dayOf(now);
  const snap=window.pp145LatestSnapshot;const orders=(Array.isArray(snap?.orders)?snap.orders:[]).filter(o=>o&&o.created&&dayOf(o.created)===today);
  const src=live()||String(snap?.source||'').startsWith('LIVE')?'LIVE':'DEMO';
  const sum=orders.reduce((s,o)=>s+(Number(o.amount)||0),0);
  const doneN=orders.filter(o=>o.status==='done').length,open=orders.filter(o=>o.status!=='done').length;
  const late=orders.filter(o=>o.status==='done'&&o.completed&&o.deadline&&o.completed>o.deadline).length;
  let avg=null;
  if(src==='LIVE'){
   try{const r=await fetch('api/kitchen-history.php?limit=500',{credentials:'same-origin',cache:'no-store'});const j=await r.json();
    if(r.ok&&j.ok&&Array.isArray(j.events)){const acc=new Map(),fin=new Map();
     for(const ev of j.events){const t=Date.parse(ev.at);if(!t||dayOf(t)!==today)continue;
      if(ev.to==='active'&&ev.from==='new'&&(!acc.has(ev.order)||acc.get(ev.order)>t))acc.set(ev.order,t);
      if(ev.to==='done'&&(!fin.has(ev.order)||fin.get(ev.order)<t))fin.set(ev.order,t);}
     const spans=[];for(const [id,t] of fin){const a=acc.get(id);if(a&&t>a)spans.push(t-a);}
     if(spans.length)avg=Math.round(spans.reduce((s,x)=>s+x,0)/spans.length/60000);}}catch(_){}
  }
  const pre=src==='LIVE'?'live:':'demo:';let handed=0;const waits=[];
  for(const [k,r] of Object.entries(pickupRecords)){if(!k.startsWith(pre)||!r?.handed_at||dayOf(r.handed_at)!==today)continue;handed++;
   const w=(Date.parse(r.handed_at)-Date.parse(r.ready_at))/60000;if(Number.isFinite(w)&&w>=0&&w<600)waits.push(w);}
  const pickupAvg=waits.length?Math.round(waits.reduce((s,x)=>s+x,0)/waits.length):null;
  const boxes=new Map();let dine=0;const info=window.PPOrderInfo;
  if(info)for(const o of orders){const b=info.boxes(o);if(b===null){dine++;continue;}for(const [k,n] of b)boxes.set(k,(boxes.get(k)||0)+n);}
  const boxRows=info?info.boxOrder.filter(k=>boxes.has(k)).map(k=>[k,boxes.get(k)]):[];
  const top=new Map();for(const o of orders)for(const it of (Array.isArray(o.items)?o.items:[])){const n=baseName(it[0]);if(n)top.set(n,(top.get(n)||0)+(Number(it[1])||0));}
  const topRows=[...top.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
  const first=orders.reduce((m,o)=>Math.min(m,Number(o.created)||m),now);
  return {src,date:tzDate.format(new Date(now)),from:orders.length?tzTime.format(new Date(first)):'—',to:tzTime.format(new Date(now)),
   count:orders.length,sum,doneN,open,late,avg,handed,pickupAvg,boxRows,boxTotal:[...boxes.values()].reduce((a,b)=>a+b,0),dine,topRows,location:document.querySelector('.drawer-header strong')?.textContent||''};
 }
 function shiftHtml(d){
  const tile=(l,v,h)=>'<div class="pp1711-tile"><small>'+esc(l)+'</small><strong>'+esc(v)+'</strong>'+(h?'<span>'+esc(h)+'</span>':'')+'</div>';
  return '<p class="pp1711-shift-when">'+esc(d.date)+' · '+esc(d.from)+'–'+esc(d.to)+' · '+esc(d.src)+'</p>'+
   '<div class="pp1711-tiles">'+tile('Tellimusi',d.count,d.open?d.open+' veel pooleli':'kõik valmis')+tile('Tellimuste summa',money(d.sum),'')+
   tile('Valmis',d.doneN,d.late?d.late+' hilinenud':'hilinenuid pole')+tile('Keskmine valmimisaeg',d.avg==null?'—':d.avg+' min',d.src==='LIVE'?'Võta vastu → Valmis':'ainult LIVE')+
   tile('Üle antud',d.handed,'')+tile('Ootas leti ääres',d.pickupAvg==null?'—':d.pickupAvg+' min','keskmiselt')+'</div>'+
   '<h3>📦 Karbid · '+esc(d.boxTotal)+'</h3>'+(d.boxRows.length?'<div class="pp1711-list">'+d.boxRows.map(([k,n])=>'<div><span>'+esc(k)+'</span><b>'+esc(n)+'</b></div>').join('')+'</div>':'<p class="pp1711-none">Karpe ei läinud.</p>')+(d.dine?'<p class="pp1711-none">Kohapeal: '+esc(d.dine)+' tellimust</p>':'')+
   '<h3>🍕 Enim tellitud</h3>'+(d.topRows.length?'<div class="pp1711-list">'+d.topRows.map(([k,n])=>'<div><span>'+esc(k)+'</span><b>'+esc(n)+'×</b></div>').join('')+'</div>':'<p class="pp1711-none">Tellimusi pole.</p>');
 }
 async function openShift(){
  $('pp1711-shift-body').innerHTML='<p class="pp1711-none">Arvutan…</p>';if(!dlg.open)dlg.showModal();
  lastShift=await shiftData();$('pp1711-shift-body').innerHTML=shiftHtml(lastShift);
 }
 window.pp1711OpenShift=openShift;
 $('pp1711-shift-print').addEventListener('click',()=>{
  const d=lastShift;if(!d)return;
  const line=(l,v)=>'<div class="r"><span>'+esc(l)+'</span><b>'+esc(v)+'</b></div>';
  const page='<!doctype html><html lang="et"><head><meta charset="utf-8"><title>Vahetuse kokkuvõte</title><style>@page{size:80mm auto;margin:3mm}body{margin:0;font:13px/1.35 Arial,sans-serif;color:#000}main{max-width:74mm;margin:0 auto}h1{font-size:18px;text-align:center;margin:4px 0}p{text-align:center;margin:0 0 6px;font-size:12px}h2{font-size:14px;border-top:1.5px dashed #000;padding-top:5px;margin:8px 0 3px}.r{display:flex;justify-content:space-between;gap:6px}.r b{white-space:nowrap}</style></head><body><main>'+
   '<h1>VAHETUSE KOKKUVÕTE</h1><p>'+esc(d.date)+'<br>'+esc(d.from)+'–'+esc(d.to)+' · '+esc(d.src)+'</p>'+
   line('Tellimusi',d.count)+line('Tellimuste summa',money(d.sum))+line('Valmis',d.doneN)+line('Pooleli',d.open)+line('Hilinenud',d.late)+line('Keskm. valmimisaeg',d.avg==null?'—':d.avg+' min')+line('Üle antud',d.handed)+line('Ootas leti ääres',d.pickupAvg==null?'—':d.pickupAvg+' min')+
   '<h2>Karbid ('+esc(d.boxTotal)+')</h2>'+(d.boxRows.map(([k,n])=>line(k,n)).join('')||'<div>—</div>')+(d.dine?line('Kohapeal',d.dine):'')+
   '<h2>Enim tellitud</h2>'+(d.topRows.map(([k,n])=>line(k,n+'×')).join('')||'<div>—</div>')+'<p style="margin-top:10px">Prinditud '+esc(tzTime.format(new Date()))+'</p></main></body></html>';
  let w=null;try{w=window.open('','_blank','width=460,height=700');}catch(_){}
  if(!w){toast2('Brauser blokeeris printimise akna.');return;}
  w.document.open();w.document.write(page);w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(_){}},350);
 });
 function placeShiftButtons(){
  const stats=$('statisticsPage')?.querySelector('.panel');
  if(stats&&!$('pp1711-shift-open')){const b=document.createElement('button');b.type='button';b.id='pp1711-shift-open';b.className='pp1711-shift-open';b.textContent='🧾 Lõpeta vahetus';
   const h=stats.querySelector('h2');(h||stats).insertAdjacentElement(h?'afterend':'afterbegin',b);b.addEventListener('click',openShift);}
  const nav=document.querySelector('#drawer nav');
  if(nav&&!$('pp1711-shift-nav')){const b=document.createElement('button');b.type='button';b.id='pp1711-shift-nav';b.className='navitem';b.innerHTML='<span>🧾</span> Lõpeta vahetus';
   nav.appendChild(b);b.addEventListener('click',()=>{$('closeDrawer')?.click();openShift();});}
 }

 function start(){ensureWrap();scheduleCards();placeShiftButtons();}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1712.js == */
try{(function(){
/* Peetri Pizza v17.12 — keep "Köögimeeskond" out of Seaded and the menu, also when another script adds it later.
 * Hidden (class pp1712-hidden), never removed: other scripts may still look for these elements.
 */
(function(){
 'use strict';
 if(window.pp1712Ops)return;window.pp1712Ops=true;
 const re=/k[öo]{2}gi\s*meeskond/i;
 function sweep(){
  for(const el of document.querySelectorAll('#settingsPage section,#settingsPage .settingsrow,#settingsPage .panel>div,#drawer nav .navitem')){
   if(el.classList.contains('pp1712-hidden'))continue;
   const head=el.querySelector('h2,h3,strong,.section-tag')||el;
   if(re.test(head.textContent||'')){el.classList.add('pp1712-hidden');el.setAttribute('aria-hidden','true');}
  }
 }
 let q=false;const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;sweep();});};
 function start(){sweep();for(const id of ['settingsPage','drawer']){const n=document.getElementById(id);if(n)new MutationObserver(later).observe(n,{childList:true,subtree:true});}}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/late-v1714.js == */
try{(function(){
/* Peetri Pizza v17.14 (+17.15 … 17.21) — load the 17.14/17.15 layers after the page is shown, so first paint on a slow tablet is not delayed. */
(()=>{'use strict';const v='17.52.0';
function go(){for(const c of ['ops-v1714.css','ops-v1715.css','ops-v1716.css','ops-v1718.css','ops-v1719.css','ops-v1721.css']){const css=document.createElement('link');css.rel='stylesheet';css.href='assets/'+c+'?v='+v;document.head.append(css);}
 // v17.15: settings-only modules (printing, order window print, health, version) also load here, after first paint.
 for(const f of ['print-v169.js','operations-v168.js','health-v169.js','ops-v1710.js','print-monitor-v1714.js','ops-v1714.js','ops-v1715.js','ops-v1716.js','ops-v1718.js','ops-v1719.js','ops-v1721.js']){const s=document.createElement('script');s.src='assets/'+f+'?v='+v;s.async=false;document.body.append(s);}}
if(document.readyState==='complete')setTimeout(go,0);else window.addEventListener('load',()=>setTimeout(go,0),{once:true});
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1722.js == */
try{(function(){
/* Peetri Pizza v17.22 (+17.23: LIVE colour moved into the DEMO|LIVE switch) — header, owner said "Давай" to all six:
 * 1 LIVE dot (green / orange / red) + "uuendatud N s tagasi"   2 counters Uued · Töös (+ Valmis button in green)
 * 3 bigger clock with date   4 Ooteaeg as one big button -> 15/20/30/45/60 tiles (same select + change event as before)
 * 5 cleaner: brand subtitle hidden, fullscreen button moved to the side menu   6 phone: header in two rows.
 * Old header elements stay in the page (hidden by CSS only), other scripts still use them. Nothing is sent to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1722)return;
 const $=id=>document.getElementById(id);
 const right=document.querySelector('.topbar .top-right');
 if(!right)return;
 const isLive=()=>document.body.classList.contains('live-active');
 const put=(id,v)=>{const e=$(id);if(e&&e.textContent!==String(v))e.textContent=v;};
 const el=(tag,id,cls,html)=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
 document.documentElement.classList.add('pp1722');

 /* 1: LIVE dot */
 let lastOk=0;
 const live=el('div','pp1722-live','pp1722-live','<i></i><span><b id="pp1722-live-t">DEMO</b><small id="pp1722-live-s"></small></span>');
 live.setAttribute('role','status');
 window.addEventListener('pp150:live-synced',()=>{lastOk=Date.now();liveTick();});
 window.addEventListener('pp150:live-stopped',()=>{lastOk=0;liveTick();});
 window.addEventListener('online',()=>liveTick());window.addEventListener('offline',()=>liveTick());
 function ago(s){if(s<60)return s+' s tagasi';const m=Math.floor(s/60);return m+' min tagasi';}
 function liveTick(){
  let state='demo',t='DEMO',s='näidisandmed';
  if(!navigator.onLine){state='bad';t='Internet puudub';s=lastOk?'viimati '+ago(Math.round((Date.now()-lastOk)/1000)):'';}
  else if(isLive()){
   if(!lastOk){state='wait';t='LIVE';s='ühendan…';}
   else{const sec=Math.max(0,Math.round((Date.now()-lastOk)/1000));state=sec>=180?'bad':sec>=45?'wait':'ok';t=state==='bad'?'LIVE ei vasta':'LIVE';s=ago(sec);}
  }
  if(live.dataset.state!==state)live.dataset.state=state;if(live.classList.contains('pp1722-off')===navigator.onLine)live.classList.toggle('pp1722-off',!navigator.onLine);put('pp1722-live-t',t);put('pp1722-live-s',s);
  // 17.23: owner asked why a second LIVE plate — the colour now lives in the DEMO|LIVE switch itself.
  const mode=$('pp172-mode');if(mode){if(mode.dataset.pp1722!==state)mode.dataset.pp1722=state;const tt=state==='demo'?'':t+(s?' · '+s:'');const lb=mode.querySelector('[data-mode=live]');if(lb&&lb.title!==tt)lb.title=tt;}
  return state;
 }

 /* 2: counters */
 const cnt=el('div','pp1722-counts','pp1722-counts','<span class="pp1722-c-new"><b id="pp1722-n-new">0</b>Uued</span><span class="pp1722-c-work"><b id="pp1722-n-work">0</b>Töös</span>');
 cnt.setAttribute('aria-label','Tellimused');
 function countTick(){
  const n=document.querySelectorAll('#newOrders .ordercard').length,w=document.querySelectorAll('#activeOrders .ordercard').length;
  put('pp1722-n-new',n);put('pp1722-n-work',w);
  if(cnt.classList.contains('pp1722-has-new')!==n>0)cnt.classList.toggle('pp1722-has-new',n>0);
  return [n,w];
 }

 /* 3: clock + date */
 const clk=el('div','pp1722-clock','pp1722-clock','<b id="pp1722-time">--:--</b><small id="pp1722-date"></small>');
 const tf=new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Tallinn'});
 const df=new Intl.DateTimeFormat('et-EE',{weekday:'short',day:'numeric',month:'short',timeZone:'Europe/Tallinn'});
 function clockTick(){const d=new Date();put('pp1722-time',tf.format(d));put('pp1722-date',df.format(d).replace(/\.$/,''));}

 /* 4: Ooteaeg button + tiles */
 const sel=()=>$('pp158-wait-select')||$('pp114-wait-select');
 const wbtn=el('button','pp1722-wait','pp1722-wait','<small>Ooteaeg</small><b id="pp1722-wait-v">–</b>');wbtn.type='button';
 const pop=el('div','pp1722-wait-pop','pp1722-wait-pop');pop.hidden=true;pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Vali ooteaeg');
 function waitTick(){const s=sel();if(!s)return;const o=s.options[s.selectedIndex];put('pp1722-wait-v',o?o.textContent.trim():'–');
  const box=s.closest('.pp158-wait');wbtn.classList.toggle('hot',!!(box&&box.classList.contains('pp1718-wait-hot')));}
 function openPop(){
  const s=sel();if(!s)return;
  pop.innerHTML='<strong>Ooteaeg</strong><div>'+[...s.options].map(o=>'<button type="button" data-v="'+o.value+'"'+(o.value===s.value?' class="on"':'')+'>'+o.textContent.trim().replace(' min','<small>min</small>')+'</button>').join('')+'</div>';
  const r=wbtn.getBoundingClientRect();pop.style.top=Math.round(r.bottom+8)+'px';pop.style.left=Math.max(8,Math.min(window.innerWidth-pop.offsetWidth-8,Math.round(r.left)))+'px';
  pop.hidden=false;
  const w=pop.offsetWidth;pop.style.left=Math.max(8,Math.min(window.innerWidth-w-8,Math.round(r.left+r.width/2-w/2)))+'px';
 }
 function closePop(){pop.hidden=true;}
 function choose(v){const s=sel();if(!s||![...s.options].some(o=>o.value===v))return;
  if(s.value!==v){s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));window.toast?.('Ooteaeg '+v+' min');}
  closePop();waitTick();}

 /* 5: fullscreen into the side menu */
 function addFsNav(){
  const nav=document.querySelector('#drawer nav');if(!nav||$('pp1722-fs-nav')||!$('pp173-fullscreen'))return;
  const b=el('button','pp1722-fs-nav','navitem','<span>⛶</span> Täisekraan');b.type='button';
  const st=nav.querySelector('[data-page="settings"]');st?nav.insertBefore(b,st):nav.append(b);
 }

 // Clicks: live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  if(t.closest('#pp1722-wait')){e.preventDefault();e.stopPropagation();pop.hidden?openPop():closePop();return;}
  const v=t.closest('#pp1722-wait-pop [data-v]');if(v){e.preventDefault();e.stopPropagation();choose(v.dataset.v);return;}
  if(t.closest('#pp1722-fs-nav')){e.preventDefault();e.stopPropagation();$('pp173-fullscreen')?.click();$('closeDrawer')?.click();return;}
  if(!pop.hidden&&!t.closest('#pp1722-wait-pop'))closePop();
 },true);
 window.addEventListener('resize',closePop);window.addEventListener('scroll',closePop,{passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closePop();});

 /* place everything */
 function place(){
  const box=(sel()||{}).closest?.('.pp158-wait');
  if(box&&wbtn.parentElement!==right)right.insertBefore(wbtn,box);
  const stats=$('pp171-stats');
  if(cnt.parentElement!==right)right.insertBefore(cnt,stats||right.firstChild);
  const mode=$('pp172-mode');
  if(live.parentElement!==right)(mode?mode.after(live):right.append(live));
  const old=$('clock');if(clk.parentElement!==right)(old?old.after(clk):right.append(clk));
  if(!pop.parentElement)document.body.append(pop);
  addFsNav();
 }
 place();
 const s0=sel();if(s0)s0.addEventListener('change',()=>setTimeout(waitTick,0));
 document.addEventListener('peetri:wait-time-change',()=>setTimeout(waitTick,50));
 window.addEventListener('pp145:orders',()=>setTimeout(()=>{countTick();liveTick();},0));
 function all(){place();liveTick();countTick();clockTick();waitTick();}
 all();setInterval(all,5000);setInterval(()=>{liveTick();clockTick();},1000);
 window.PP1722={liveTick,countTick,clockTick,waitTick,openPop,choose,_test:{setLast:v=>{lastOk=v}}};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1723.js == */
try{(function(){
/* Peetri Pizza v17.23 — design pack 2, owner picked 1, 2, 5.
 * 1: order card contents (CSS only, ops-v1723.css).
 * 2: order columns: coloured strip on top; an empty column says so instead of staying blank.
 * 5: Tooted as tiles: the whole tile is the button. First tap turns the tile orange ("puuduta uuesti"),
 *    second tap within 4 s marks it Otsas / Saadaval. Replaces the browser confirm() window, which froze
 *    timers and LIVE while it was open. Still only a local note on this tablet, nothing goes to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1723)return;
 const $=id=>document.getElementById(id);

 /* 2: empty columns */
 const EMPTY={newOrders:['Uusi tellimusi pole','Uus tellimus ilmub siia koos helisignaaliga.'],activeOrders:['Midagi ei valmistata','Võta tellimus vastu, siis tuleb see siia.']};
 function emptyTick(){
  for(const id in EMPTY){
   const box=$(id);if(!box)continue;const col=box.closest('.ordercol');if(!col)continue;
   col.classList.add('pp1723-col','pp1723-col-'+(id==='newOrders'?'new':'work'));
   let e=col.querySelector(':scope>.pp1723-empty');
   if(!e){e=document.createElement('div');e.className='pp1723-empty';e.innerHTML='<span aria-hidden="true">'+(id==='newOrders'?'🍕':'✓')+'</span><strong>'+EMPTY[id][0]+'</strong><small>'+EMPTY[id][1]+'</small>';box.after(e);}
   const none=!box.querySelector('.ordercard');if(e.hidden===none)e.hidden=!none;
  }
 }
 window.addEventListener('pp145:orders',()=>setTimeout(emptyTick,0));
 setInterval(emptyTick,3000);setTimeout(emptyTick,300);

 /* 5: product tiles, two taps */
 let armed=null,armTimer=0,passing=false;
 function disarm(){if(armed){armed.classList.remove('pp1723-armed');armed.querySelector('.pp1723-hint')?.remove();}armed=null;clearTimeout(armTimer);}
 window.addEventListener('click',e=>{
  if(passing)return; // our own forwarded click goes straight to the old handler
  const t=e.target;if(!(t instanceof Element))return;
  const card=t.closest('#productList .pp140-card');
  if(!card){if(armed&&!t.closest('#productList'))disarm();return;}
  const btn=card.querySelector('[data-product]');if(!btn)return;
  e.preventDefault();e.stopPropagation();
  if(armed!==card){
   disarm();armed=card;card.classList.add('pp1723-armed');
   const h=document.createElement('div');h.className='pp1723-hint';h.textContent=card.classList.contains('is-available')?'Puuduta uuesti → OTSAS':'Puuduta uuesti → SAADAVAL';card.append(h);
   armTimer=setTimeout(disarm,4000);return;
  }
  disarm();
  const keep=window.confirm;window.confirm=()=>true; // the two taps are the confirmation
  passing=true;try{btn.click();}finally{passing=false;window.confirm=keep;}
 },true);

 window.PP1723={emptyTick,disarm};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1724.js == */
try{(function(){
/* Peetri Pizza v17.24 — design pack 3, owner said "Давай" to all six.
 * 1: late card: red pulsing frame (CSS only, ops-v1724.css).
 * 2: order type as a coloured strip on the left of the card: Kulleriga / Kaasa / Kohapeal.
 * 3: smooth move: after "Võta vastu" / "Valmis" the cards glide to their new place instead of jumping.
 * 4: one toast for the whole app: big, top centre, colour by meaning, hides itself.
 * 5: dialogs as a sheet from the bottom; the browser confirm() windows become a sheet too
 *    (the browser window froze timers and LIVE while it was open).
 * 6: Statistika in the card style (CSS only).
 * Nothing here talks to the server or to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1724)return;
 const $=id=>document.getElementById(id);
 const root=document.documentElement;
 const calm=()=>root.classList.contains('pp1714-lite')||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

 /* 2: order type */
 function typeOf(card){
  const s=card.querySelector('.pp118-serving');if(!s)return '';
  if(/KOHAPEAL/i.test(s.textContent||''))return 'kohapeal';
  return s.classList.contains('pp118-delivery')?'kuller':'kaasa';
 }
 function tag(){
  for(const c of document.querySelectorAll('#ordersPage .ordercard')){
   const t=typeOf(c);if(!t||c.dataset.pp1724t===t)continue;
   c.classList.remove('pp1724-t-kuller','pp1724-t-kaasa','pp1724-t-kohapeal');
   c.classList.add('pp1724-t-'+t);c.dataset.pp1724t=t;
  }
 }

 /* 3: smooth move (FLIP). A tap on a card button remembers where every card was;
  * after the next render each card slides from the old place to the new one. */
 let snap=null;
 function rects(){const m=new Map();for(const c of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){const r=c.getBoundingClientRect();if(r.width)m.set(c.dataset.orderId,r);}return m;}
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  const card=t.closest('#ordersPage .ordercard[data-order-id]');
  if(!card||!t.closest('button'))return;
  if(t.closest('[data-action="details"],.details,.pp155-share-btn'))return;
  const r=card.getBoundingClientRect();
  snap={at:Date.now(),pos:rects(),id:card.dataset.orderId,ghost:card.cloneNode(true),r};
 },true);
 function flip(){
  if(!snap||Date.now()-snap.at>8000){snap=null;return;}
  const s=snap,now=rects();
  // nothing moved yet (the click was cancelled, or the server has not answered): keep waiting
  const moved=[...now].some(([id,r])=>{const o=s.pos.get(id);return !o||Math.abs(o.top-r.top)>2||Math.abs(o.left-r.left)>2;})||!now.has(s.id);
  if(!moved)return;
  snap=null;if(calm())return;
  for(const c of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const o=s.pos.get(c.dataset.orderId),n=now.get(c.dataset.orderId);if(!o||!n)continue;
   const dx=o.left-n.left,dy=o.top-n.top;if(Math.abs(dx)<2&&Math.abs(dy)<2)continue;
   try{c.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:dx?420:300,easing:'cubic-bezier(.2,.8,.2,1)'});}catch(_){}
  }
  if(!now.has(s.id)&&s.ghost){ // the card left the screen (Valmis): let it fade out where it stood
   const g=s.ghost;g.classList.add('pp1724-ghost');g.removeAttribute('data-order-id');
   g.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
   Object.assign(g.style,{position:'fixed',left:s.r.left+'px',top:s.r.top+'px',width:s.r.width+'px',height:s.r.height+'px',margin:'0',zIndex:'50',pointerEvents:'none'});
   const host=$('ordersPage')||document.body;host.append(g);
   let a=null;try{a=g.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX(60px) scale(.96)'}],{duration:380,easing:'ease-in',fill:'forwards'});}catch(_){}
   if(a)a.onfinish=()=>g.remove();setTimeout(()=>g.remove(),900);
  }
 }

 window.addEventListener('pp145:orders',()=>{queueMicrotask(()=>{try{flip()}catch(_){};try{tag()}catch(_){}});});
 setInterval(tag,2000);setTimeout(tag,300);

 /* 4: one toast */
 function tone(t){
  t=String(t||'');
  if(/ebaõnnestus|ei õnnestunud|ei saanud|viga|error|katkes|puudub|ei tööta|ühendus puudub/i.test(t))return 'bad';
  if(/tühist|tagasi|hoiatus|⚠|ainult lugemiseks|oota|kontrolli|offline|vaikne/i.test(t))return 'warn';
  return 'ok';
 }
 const ICON={ok:'✓',warn:'!',bad:'✕'};
 let toastTimer=0;
 function toast(text){
  const el=$('toast');if(!el)return;
  const k=tone(text);
  el.classList.add('pp1724-toast');el.classList.remove('pp1724-ok','pp1724-warn','pp1724-bad');el.classList.add('pp1724-'+k);
  el.innerHTML='';const i=document.createElement('b');i.textContent=ICON[k];const s=document.createElement('span');s.textContent=String(text??'');el.append(i,s);
  el.classList.add('show');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),k==='bad'?5000:3000);
 }
 try{window.toast=toast;}catch(_){}
 document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('#toast.pp1724-toast')){clearTimeout(toastTimer);$('toast').classList.remove('show');}});

 /* 5: confirm() as a sheet. When a button click asks confirm(), we answer "no" for now, show the sheet,
  * and on "Jah" click the same button again with every confirm() answering "yes". */
 const nativeConfirm=window.confirm.bind(window);
 let lastClick=null,allow=false,sheet=null,askedAt=0;
 window.addEventListener('click',e=>{lastClick=e;},true);
 function findAgain(el){
  if(el.isConnected)return el;
  const sel=['data-kitchen-action','data-action','data-id','data-order-id','data-product','data-pp155-key'].filter(a=>el.hasAttribute(a)).map(a=>'['+a+'="'+CSS.escape(el.getAttribute(a))+'"]').join('');
  if(sel)return document.querySelector(el.tagName.toLowerCase()+sel);
  return null;
 }
 function closeSheet(){if(!sheet)return;const s=sheet;sheet=null;s.classList.remove('open');setTimeout(()=>s.remove(),220);}
 function openSheet(msg,target){
  closeSheet();
  const valmis=/valmis/i.test(msg)&&!/tühist/i.test(msg);
  const risky=/tühist|tühjend|taasta|kustuta/i.test(msg);
  const w=document.createElement('div');w.className='pp1724-sheet-wrap';
  w.innerHTML='<div class="pp1724-sheet" role="dialog" aria-modal="true"><i class="pp1724-grip"></i><p></p><div class="pp1724-sheet-btns"><button type="button" class="pp1724-no">Tagasi</button><button type="button" class="pp1724-yes"></button></div></div>';
  w.querySelector('p').textContent=msg;
  const yes=w.querySelector('.pp1724-yes');yes.textContent=valmis?'✓ Jah, valmis':'Jah';if(risky)yes.classList.add('risky');
  w.addEventListener('click',e=>{
   if(e.target===w||e.target.closest('.pp1724-no')){e.stopPropagation();closeSheet();return;}
   if(e.target.closest('.pp1724-yes')){
    e.stopPropagation();closeSheet();
    const el=findAgain(target);if(!el){toast('Tellimus muutus vahepeal, proovi uuesti');return;}
    // peetri-v163 ignores a second tap on the same order button within 1.4 s (double-tap guard);
    // the "Jah" tap is a confirmed repeat, so during this one click its clock runs 1.5 s ahead.
    const pn=performance.now,shift=Math.max(0,1500-(Date.now()-askedAt));
    allow=true;try{if(shift)performance.now=()=>pn.call(performance)+shift;el.click();}finally{allow=false;if(shift)performance.now=pn;}
   }
  });
  document.body.append(w);sheet=w;requestAnimationFrame(()=>w.classList.add('open'));
  setTimeout(()=>yes.focus({preventScroll:true}),50);
 }
 document.addEventListener('keydown',e=>{if(sheet&&e.key==='Escape')closeSheet();});
 window.confirm=function(msg){
  if(allow)return true;
  const ev=window.event;
  const t=ev&&ev===lastClick&&ev.type==='click'&&ev.target instanceof Element?ev.target:null;
  const btn=t&&!t.closest('input,select,textarea,label')?t.closest('button,a,[role="button"],.pp140-card'):null;
  if(!btn||root.classList.contains('pp1724-native-confirm'))return nativeConfirm(msg);
  askedAt=Date.now();openSheet(String(msg??''),btn);
  return false;
 };

 /* 5: Ooteaeg tiles as a sheet: the popup is placed by ops-v1722 under the button; CSS moves it down. */

 window.PP1724={tag,flip,toast,tone,closeSheet};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1725.js == */
try{(function(){
/* Peetri Pizza v17.25 — design pack 4, owner picked 1, 2, 4, 5, 6 ("все кроме 3").
 * 1: Uued counter in the header pulses orange while a new order waits (CSS only).
 * 2: a new order card slides in and glows orange for 10 s.
 * 4: order details sheet looks like the card: name, number, type and the products big on top,
 *    office data small below, big Prindi + Võta vastu / Valmis buttons at the bottom.
 * 5: Tooted: category tabs and search stuck under the header, the big counters and duplicate quick chips hidden.
 * 6: one set of line icons instead of emoji (emoji look different on every Android).
 * Nothing here talks to the server or to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1725)return;
 const $=id=>document.getElementById(id);
 const root=document.documentElement;

 /* 6: icons */
 const P={
  car:'<path d="M4 16v-5l2-5h12l2 5v5"/><path d="M3 16h18M5 11h14"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  bag:'<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  dine:'<path d="M7 3v18M5 3v5a2 2 0 0 0 4 0V3"/><path d="M17 21V3c-2 1-3 4-3 8h3"/>',
  box:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  flag:'<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  warn:'<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  pizza:'<path d="M3 21 11 2c4.8 1.4 8.2 4.8 10 9.5L3 21Z"/><circle cx="11" cy="12" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M7 17h4"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  bread:'<path d="M5 19c-2.5-2.5 0-7 4-11s8.5-6.5 11-4-0 7-4 11-8.5 6.5-11 4z"/><path d="m9 10 2 2m1-5 2 2m-8 4 2 2"/>',
  receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'
 };
 const MAP={'🚗':'car','🛵':'car','🛍':'bag','🍽':'dine','📦':'box','⚑':'flag','🚩':'flag','⚠':'warn','🍕':'pizza','🥖':'bread','🧾':'receipt'};
 const RE=new RegExp('('+Object.keys(MAP).join('|')+')\\uFE0F?\\s?','gu');
 const svg=k=>'<svg class="pp1725-i pp1725-i-'+k+'" viewBox="0 0 24 24" aria-hidden="true">'+P[k]+'</svg>';
 const ROOTS='#ordersPage .ordercard,#statisticsPage .pp1719-service,.pp1723-empty,.pp179-dough-box,#orderDialog,#pp1711-shift .pp1711-shift-head,#pp1714-print-dialog';
 function iconize(el){
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>{RE.lastIndex=0;return RE.test(n.nodeValue)&&!n.parentElement?.closest('.prep-label,script,style,textarea,input,svg')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
  const list=[];let n;while((n=w.nextNode()))list.push(n);
  for(const t of list){
   const html=t.nodeValue.split(RE);const frag=document.createDocumentFragment();
   html.forEach((part,i)=>{
    if(i%2===1){const s=document.createElement('span');s.className='pp1725-ic';s.innerHTML=svg(MAP[part]);frag.append(s);}
    else if(part)frag.append(document.createTextNode(part));
   });
   t.replaceWith(frag);
  }
 }
 function icons(){if(root.classList.contains('pp1725-emoji'))return;for(const el of document.querySelectorAll(ROOTS)){try{iconize(el)}catch(_){}}}

 /* 2: new order glows for 10 s */
 const seen=new Set(),fresh=new Map(),boot=Date.now()+8000;
 function freshTick(){
  const now=Date.now(),add=[];
  for(const c of document.querySelectorAll('#newOrders .ordercard[data-order-id]')){
   const id=c.dataset.orderId;if(!seen.has(id)){seen.add(id);add.push(id);}
  }
  // no glow while the page or LIVE is loading (many cards at once)
  if(now>boot&&add.length<=3)for(const id of add)fresh.set(id,now+10000);
  for(const c of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const until=fresh.get(c.dataset.orderId),on=!!until&&until>now&&c.closest('#newOrders');
   if(c.classList.contains('pp1725-fresh')!==!!on)c.classList.toggle('pp1725-fresh',!!on);
  }
  for(const [id,u] of fresh)if(u<=now)fresh.delete(id);
  if(seen.size>500)seen.clear();
 }

 function tick(){try{freshTick()}catch(_){}try{icons()}catch(_){}}
 window.addEventListener('pp145:orders',()=>queueMicrotask(tick));
 setInterval(tick,1000);setTimeout(tick,200);

 /* 4: order details like a card */
 window.addEventListener('pp168:details-opened',e=>{
  const id=String(e.detail?.id||'');const body=$('detailBody'),dlg=$('orderDialog');if(!body||!dlg)return;
  dlg.classList.add('pp1725-details');
  dlg.querySelector('.pp1725-dfoot')?.remove();body.querySelector('.pp1725-dhead')?.remove();
  const card=id?document.querySelector('#ordersPage .ordercard[data-order-id="'+CSS.escape(id)+'"]'):null;
  dlg.classList.toggle('pp1725-has-card',!!card);
  if(!card)return;
  const head=document.createElement('div');head.className='pp1725-dhead';
  const top=card.querySelector('.pp117-ticket-identity');const boxes=card.querySelectorAll('.pp177-boxes,.pp177-dinein');const items=card.querySelector('.pp117-ticket-items');
  if(top)head.append(top.cloneNode(true));
  for(const b of boxes)if(!b.closest('.pp117-ticket-identity'))head.append(b.cloneNode(true));
  if(items){const it=items.cloneNode(true);it.classList.add('pp1725-ditems');head.append(it);}
  head.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
  head.querySelectorAll('button').forEach(x=>x.remove());
  body.prepend(head);
  // bottom bar: print (the existing button is moved visually by CSS) + the card's own action button
  const act=card.querySelector('.cardfoot button[data-action="accept"],.cardfoot button[data-action="done"],.cardfoot button[data-kitchen-action]');
  const foot=document.createElement('div');foot.className='pp1725-dfoot';
  const pr=document.createElement('button');pr.type='button';pr.className='pp1725-dprint';pr.textContent='Prindi';
  pr.addEventListener('click',()=>$('pp168-print-order')?.click());
  foot.append(pr);
  if(act&&!act.disabled){
   const b=document.createElement('button');b.type='button';
   const accept=(act.dataset.kitchenAction||act.dataset.action)==='accept'||(act.dataset.kitchenAction==='active');
   b.className='pp1725-dact '+(accept?'accept':'done');b.textContent=accept?'Alusta valmistamist':'✓ Valmis';
   b.addEventListener('click',()=>{try{dlg.close()}catch(_){};const again=document.querySelector('#ordersPage .ordercard[data-order-id="'+CSS.escape(id)+'"] .cardfoot '+(act.dataset.kitchenAction?'button[data-kitchen-action]':'button[data-action="'+act.dataset.action+'"]'));(again||act).click();});
   foot.append(b);
  }
  dlg.querySelector('.modalbody')?.append(foot);
  try{icons()}catch(_){}
 });

 /* 5: Tooted — show how many are out on the "Otsas" filter */
 function outCount(){
  const n=$('pp140-out')?.textContent?.trim();const tabs=$('pp140-status-tabs');if(!tabs)return;
  const b=[...tabs.querySelectorAll('button')].find(x=>/otsas/i.test(x.textContent));if(!b)return;
  let s=b.querySelector('.pp1725-n');if(!s){s=document.createElement('b');s.className='pp1725-n';b.append(s);}
  const v=n&&n!=='0'?n:'';if(s.textContent!==v)s.textContent=v;s.hidden=!v;
 }
 setInterval(outCount,2000);setTimeout(outCount,500);

 /* 6: sound button icon follows aria-pressed (CSS) */
 window.PP1725={icons,freshTick,outCount};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1726.js == */
try{(function(){
/* Peetri Pizza v17.26 — design pack 5, owner picked 1, 3, 5, 6 (not 2, 4).
 * 1: header sticks to the top on every screen and gets slimmer after scrolling (CSS + html.pp1726-scrolled).
 * 3: "Telli tainas!" reminder as a slim bar at the very bottom; the page gets room so the cards can scroll above it (CSS).
 * 5: when sound is off or blocked by Chrome, a new order flashes the screen frame orange.
 * 6: Tooted tiles compact (CSS).
 * Nothing here talks to the server or to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1726)return;
 const root=document.documentElement;

 /* 1 */
 let ticking=false;
 function onScroll(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;const on=window.scrollY>40;if(root.classList.contains('pp1726-scrolled')!==on)root.classList.toggle('pp1726-scrolled',on);});}
 window.addEventListener('scroll',onScroll,{passive:true});onScroll();

 /* 5: silent flash */
 const seen=new Set(),boot=Date.now()+8000;
 function silent(){
  try{const d=window.PPSound?.diagnostics?.();if(d)return !d.enabled||!d.supported||d.state!=='running';}catch(_){}
  return document.getElementById('soundBtn')?.getAttribute('aria-pressed')==='false';
 }
 let fl=null;
 function flash(){
  if(!fl){fl=document.createElement('div');fl.id='pp1726-flash';fl.setAttribute('aria-hidden','true');document.body.append(fl);}
  fl.classList.remove('on');void fl.offsetWidth;fl.classList.add('on');
  clearTimeout(flash.t);flash.t=setTimeout(()=>fl.classList.remove('on'),3200);
 }
 function check(){
  const ids=[...document.querySelectorAll('#newOrders .ordercard[data-order-id]')].map(c=>c.dataset.orderId);
  let fresh=0;for(const id of ids)if(!seen.has(id)){seen.add(id);fresh++;}
  if(seen.size>500)seen.clear();
  if(fresh&&fresh<=3&&Date.now()>boot&&silent())flash();
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(()=>{try{check()}catch(_){}}));
 setInterval(()=>{try{check()}catch(_){}},2000);setTimeout(check,300);

 window.PP1726={flash,silent,check};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1728.js == */
try{(function(){
/* Peetri Pizza v17.28 — order cards clearer (owner: "Го все", all six).
 * 1: pizzas first; drinks, sauces and other non-pizza lines in one "Lisaks" line under them.
 * 2: timer as "Valmis 13:22" + "veel 17 min" (late: "HILJA 3 min" + "pidi 13:22"). The old timer is only hidden.
 * 3: summary chip "3 pitsat · 2 lisa" next to the order number.
 * 4: payment chip (MAKSTUD / SULARAHA / KAART) when the order has a payment value.
 * 5: modifiers marked + (add) or − (remove).
 * 6: the KARBID / KOHAPEAL row moves to the bottom, next to the Valmis button.
 * Cards are only re-arranged on screen; order data, printing and LIVE are untouched.
 */
(function(){
 'use strict';
 if(window.PP1728)return;
 const root=document.documentElement;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pad=n=>String(n).padStart(2,'0');
 const hm=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes());};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 function deadline(o){try{if(typeof orderDeadline==='function')return orderDeadline(o)}catch(_){}const d=Number(o.deadline);return d>0?d:(Number(o.created)||0)+(Number(o.minutes)||20)*60000;}
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 function isPizza(raw){try{const p=window.PPOrderInfo?.parse(raw);return !!(p&&(p.size||p.code));}catch(_){return false}}

 function payChip(p){
  const v=String(p||'').trim().toLowerCase();if(!v||v==='—'||v==='-')return null;
  if(/online|paid|makstud|stripe|montonio|bank|link|prepaid|internet/.test(v))return ['MAKSTUD','paid'];
  if(/cash|sula/.test(v))return ['SULARAHA','cash'];
  if(/card|kaart|terminal/.test(v))return ['KAART','card'];
  return [v.toUpperCase().slice(0,14),'card'];
 }

 function build(card,o){
  const items=Array.isArray(o.items)?o.items:[];
  const lines=[...card.querySelectorAll('.pp117-ticket-items>.product-line')];
  // 1 + 3
  let pz=0,other=0;const extra=[],sizes=new Map();
  if(lines.length===items.length){
   items.forEach((it,i)=>{const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];if(isPizza(raw)){pz+=qty(q);let c='pitsa';try{c=window.PPOrderInfo.parse(raw).code||'pitsa'}catch(_){}sizes.set(c,(sizes.get(c)||0)+qty(q));}else{other+=qty(q);extra.push(i);}});
   if(pz&&extra.length){
    const box=card.querySelector('.pp117-ticket-items');
    const row=document.createElement('div');row.className='pp1728-lisaks';
    row.innerHTML='<b>Lisaks</b>'+extra.map(i=>{const l=lines[i];l.classList.add('pp1728-moved');
     const n=l.querySelector('.product-name');const name=(n?.querySelector('.pp177-name')||n)?.textContent?.trim()||'';
     return '<span><strong>'+esc(l.querySelector('.product-qty')?.textContent?.trim()||'')+'</strong> '+esc(name)+'</span>';}).join('');
    box.append(row);
   }
  }
  const line=card.querySelector('.pp117-identity-line');
  if(line&&(pz||other)){
   const s=document.createElement('span');s.className='pp1728-sum';
   // v17.29: pizzas by size code ("2× SÕ · 1× VP"), then the other products
   s.textContent=[...[...sizes].map(([c,n])=>n+'× '+c),other?other+' lisa':''].filter(Boolean).join(' · ')||(pz?pz+' pitsa':'');
   const t=line.querySelector('.pp118-order-time');t?line.insertBefore(s,t):line.append(s);
  }
  // 4
  const pc=payChip(o.payment);
  if(line&&pc){const s=document.createElement('span');s.className='pp1728-pay pp1728-pay-'+pc[1];s.textContent=pc[0];const t=line.querySelector('.pp1728-sum');t?line.insertBefore(s,t):line.append(s);}
  // 5
  for(const m of card.querySelectorAll('.pp177-mod')){
   const t=(m.textContent||'').trim();
   if(/^(ilma|vähem|without|no\b|-)/i.test(t))m.classList.add('pp1728-minus');
   else if(/^(topelt|lisa|extra|äär|\+|juust$|[\p{L}-]*äär$)/iu.test(t)||/:\s*(juustuäär|extra|topelt)/i.test(t))m.classList.add('pp1728-plus');
  }
  for(const e of card.querySelectorAll('.pp177-extras em'))e.classList.add('pp1728-plus');
  // 6
  const foot=card.querySelector('.cardfoot');
  if(foot)for(const b of card.querySelectorAll(':scope>.pp177-boxes'))foot.before(b);
  // 2
  const meter=card.querySelector('.prep-meter');
  if(meter&&!meter.querySelector('.pp1728-due')){const d=document.createElement('div');d.className='pp1728-due';d.innerHTML='<i></i><b></b><small></small>';meter.prepend(d);}
 }

 function timers(byId){
  const now=Date.now();
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-pp1728]')){
   const o=byId.get(card.dataset.orderId);const d=card.querySelector('.pp1728-due');if(!o||!d)continue;
   const dl=deadline(o),min=Math.ceil((dl-now)/60000);
   const late=dl<now;
   // v17.41: pre-order far ahead shows the day ("Täna"/"Homme") over the time; state for colours
   const cr=Number(o.created),pre=!late&&o.deadlineSource==='official'&&cr>0&&dl-cr>=90*60000&&dl-now>=60*60000;
   const day=()=>{const a=new Date(dl),t=new Date(now);const d0=new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime();const dd=Math.round((new Date(a.getFullYear(),a.getMonth(),a.getDate()).getTime()-d0)/86400000);return dd<=0?'Täna':dd===1?'Homme':pad(a.getDate())+'.'+pad(a.getMonth()+1);};
   // v17.44 (owner): big = minutes left, small = ready time
   const l=late?'HILJA':pre?day():'JÄÄNUD';const a=late?'+'+Math.max(1,Math.floor((now-dl)/60000))+' min':pre?hm(dl):Math.max(1,min)+' min';
   const b=late?'pidi '+hm(dl):pre?'':'valmis '+hm(dl);
   const st=late?'late':pre?'pre':min<=5?'soon':'ok';if(d.dataset.s!==st)d.dataset.s=st;
   const [L,B,S]=d.children;if(L.textContent!==l)L.textContent=l;if(B.textContent!==a)B.textContent=a;if(S.textContent!==b)S.textContent=b;
  }
 }

 function tick(){
  if(root.classList.contains('pp1728-off'))return;
  const list=orders();const byId=new Map(list.map(o=>[String(o.id),o]));
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]:not([data-pp1728])')){
   const o=byId.get(card.dataset.orderId);if(!o)continue;
   card.dataset.pp1728='1';
   try{build(card,o)}catch(_){}
  }
  root.classList.add('pp1728-on');
  try{timers(byId)}catch(_){}
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(tick));
 setInterval(tick,5000);setTimeout(tick,150);

 window.PP1728={tick,payChip};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1729.js == */
try{(function(){
/* Peetri Pizza v17.29 — order card, pack 2 (owner: "Давай", all six). Screen only, data untouched.
 * 1: summary by size ("2× SÕ · 1× VP") — in ops-v1728.js.
 * 2: print mark on the card: "⎙ prinditud 13:05" / "⎙ ei prinditud" (from the shared print log, PPPrintMonitor).
 * 3: tap on the customer name folds the card to its header + button; tap again unfolds. Remembered per order on this tablet until reload.
 * 4: pre-order: when the official ready time is 90+ min after the order came in, a line "ETTETELLIMUS · 18:30" on top.
 * 5: simpler bottom: price and ⓘ small, the action button takes the rest of the width (CSS).
 * 6: the "Kas valmis?" sheet lists what is easy to forget: drinks, sauces, boxes.
 */
(function(){
 'use strict';
 if(window.PP1729)return;
 const pad=n=>String(n).padStart(2,'0');
 const hm=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes());};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 const byId=id=>orders().find(o=>String(o.id)===String(id));
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 const PRE=90*60000;

 /* 3: folded cards */
 const folded=new Set();
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  const n=t.closest('#ordersPage .ordercard .pp92-customer');if(!n)return;
  const card=n.closest('.ordercard[data-order-id]');if(!card)return;
  e.preventDefault();e.stopPropagation();
  const id=card.dataset.orderId,on=!folded.has(id);
  on?folded.add(id):folded.delete(id);card.classList.toggle('pp1729-folded',on);
 },true);

 function tick(){
  const list=orders(),map=new Map(list.map(o=>[String(o.id),o]));
  const pm=window.PPPrintMonitor;
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const id=card.dataset.orderId,o=map.get(id);if(!o)continue;
   if(card.classList.contains('pp1729-folded')!==folded.has(id))card.classList.toggle('pp1729-folded',folded.has(id));
   // 4
   const dl=Number(o.deadline),cr=Number(o.created);
   const pre=o.deadlineSource==='official'&&dl>0&&cr>0&&dl-cr>=PRE&&o.status!=='done';
   let p=card.querySelector(':scope>.pp1729-pre');
   if(pre&&!p){p=document.createElement('div');p.className='pp1729-pre';card.prepend(p);}
   if(p){if(!pre)p.remove();else{const tx='ETTETELLIMUS';if(p.textContent!==tx)p.textContent=tx;}}
   // 2
   if(pm&&typeof pm.record==='function'){
    const foot=card.querySelector('.cardfoot');if(!foot)continue;
    let m=foot.querySelector('.pp1729-print');
    if(!m){m=document.createElement('span');m.className='pp1729-print';const price=foot.querySelector('.price');price?price.after(m):foot.prepend(m);}
    let r=null;try{r=pm.record(id)}catch(_){}
    const done=!!(r&&r.count>0);const tx=done?'⎙ prinditud '+(r.last_at?hm(r.last_at):''):'⎙ ei prinditud';
    if(m.textContent!==tx){m.textContent=tx;m.classList.toggle('is-done',done);}
   }
  }
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(()=>{try{tick()}catch(_){}}));
 setInterval(()=>{try{tick()}catch(_){}},4000);setTimeout(tick,400);

 /* 6: reminder inside the Valmis sheet (17.24) */
 let doneId=null,doneAt=0;
 window.addEventListener('click',e=>{
  const b=e.target instanceof Element&&e.target.closest('#ordersPage .ordercard button[data-action="done"],#ordersPage .ordercard button[data-kitchen-action="done"]');
  if(b){doneId=b.closest('.ordercard')?.dataset.orderId||b.dataset.id||null;doneAt=Date.now();}
 },true);
 function remind(o){
  const parts=[];
  for(const it of (Array.isArray(o.items)?o.items:[])){
   const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];let p=null;try{p=window.PPOrderInfo?.parse(raw)}catch(_){}
   if(p&&(p.size||p.code))continue;
   parts.push(qty(q)+'× '+String((p&&p.name)||raw||'').split(' — ')[0]);
  }
  let boxes=null;try{boxes=window.PPOrderInfo?.boxes(o)}catch(_){}
  if(Array.isArray(boxes))for(const [k,n] of boxes)parts.push(n+' karp '+k);
  return parts;
 }
 new MutationObserver(ms=>{
  for(const m of ms)for(const n of m.addedNodes){
   if(!(n instanceof Element)||!n.classList.contains('pp1724-sheet-wrap'))continue;
   if(!doneId||Date.now()-doneAt>1500)continue;
   const o=byId(doneId);if(!o)continue;const list=remind(o);if(!list.length)continue;
   const box=document.createElement('div');box.className='pp1729-forget';
   box.innerHTML='<b>Ära unusta</b>'+list.map(x=>'<span>'+esc(x)+'</span>').join('');
   n.querySelector('.pp1724-sheet-btns')?.before(box);
  }
 }).observe(document.body,{childList:true});

 window.PP1729={tick,folded};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1730.js == */
try{(function(){
/* Peetri Pizza v17.30 — owner picked 1, 2, 3, 6.
 * 1: "Klienti ootavad tellimused": ready cards in the style of the new order cards (type strip, type + payment chips, "ootab N min").
 * 2: 80 mm ticket in the card's order — in print-v169.js.
 * 3: Seaded → Köök: switches for what the order card shows (price, payment, print mark, summary, arrival time). Saved on this tablet.
 * 6: order details: a time line "saabus · vastu võetud · prinditud · valmis".
 * Screen only; nothing goes to the server or to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1730)return;
 const root=document.documentElement;
 const pad=n=>String(n).padStart(2,'0');
 const hm=t=>{const d=new Date(t);return isNaN(d)?'':pad(d.getHours())+':'+pad(d.getMinutes());};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 const byId=id=>orders().find(o=>String(o.id)===String(id));

 /* 3: what the card shows */
 const KEY='pp1730-card';
 const OPTS=[['price','Hind'],['pay','Makse (MAKSTUD / KAART / SULARAHA)'],['print','Printimise märge'],['sum','Kokkuvõte (2× SÕ · 1 lisa)'],['time','Saabumise aeg']];
 let hide={};try{hide=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){hide={}}
 function applyHide(){for(const [k] of OPTS)root.classList.toggle('pp1730-no-'+k,!!hide[k]);}
 applyHide();
 function settings(){
  if(document.getElementById('pp1730-set'))return true;
  const anchor=document.querySelector('#settingsPage #pp1714-lite-row')||document.querySelector('#settingsPage #minusMinutes');
  const host=anchor&&anchor.closest('#settingsPage>.panel>*');if(!host)return false;
  const box=document.createElement('div');box.id='pp1730-set';box.className='pp1730-set';
  box.innerHTML='<h3>Tellimuse kaart</h3><p>Vali, mida tellimuse kaardil näidata. Kehtib ainult selles tahvlis.</p>'+OPTS.map(([k,l])=>'<label><input type="checkbox" data-pp1730="'+k+'"'+(hide[k]?'':' checked')+'><span></span>'+esc(l)+'</label>').join('');
  box.addEventListener('change',e=>{const i=e.target.closest('[data-pp1730]');if(!i)return;hide[i.dataset.pp1730]=!i.checked;try{localStorage.setItem(KEY,JSON.stringify(hide))}catch(_){}applyHide();});
  host.append(box);return true;
 }
 let tries=0;const st=setInterval(()=>{if(settings()||++tries>40)clearInterval(st);},1500);

 /* 1: ready cards */
 function decorate(){
  const box=document.getElementById('pp1711-pickup');if(!box)return;
  const now=Date.now();
  for(const c of box.querySelectorAll('.pp1711-copy')){
   const o=byId(c.dataset.pp1711Id);
   if(!c.dataset.pp1730){
    c.dataset.pp1730='1';
    const t=o?(o.dineIn?'kohapeal':o.serving==='delivery'?'kuller':'kaasa'):'';
    if(t)c.classList.add('pp1730-t-'+t);
    const num=c.querySelector('.pp112-number');
    if(num&&o){
     const line=document.createElement('span');line.className='pp1730-chips';
     const label={kuller:'🚗 KULLERIGA',kaasa:'🛍 KAASA',kohapeal:'🍽 KOHAPEAL'}[t]||'';
     let pay=null;try{pay=window.PP1728?.payChip(o.payment)}catch(_){}
     line.innerHTML=(label?'<span class="pp1730-type">'+label+'</span>':'')+(pay?'<span class="pp1728-pay pp1728-pay-'+pay[1]+'">'+esc(pay[0])+'</span>':'');
     num.after(line);
    }
    const top=c.querySelector('.pp112-completed');
    if(top&&!top.querySelector('.pp1730-wait')){const w=document.createElement('em');w.className='pp1730-wait';top.append(w);}
   }
   const w=c.querySelector('.pp1730-wait');const at=Number(o?.completed)||0;
   if(w){const m=at?Math.max(0,Math.floor((now-at)/60000)):null;const tx=m===null?'':m<1?'just valmis':'ootab '+m+' min';if(w.textContent!==tx)w.textContent=tx;w.classList.toggle('long',m!==null&&m>=15);}
  }
  try{window.PP1725?.icons()}catch(_){}
 }
 function watch(){
  const box=document.getElementById('pp1711-pickup');if(!box)return false;
  new MutationObserver(()=>queueMicrotask(decorate)).observe(box,{childList:true});decorate();return true;
 }
 let wt=0;const wi=setInterval(()=>{if(watch()||++wt>40)clearInterval(wi);},1500);
 setInterval(decorate,20000);

 /* 6: time line in the details sheet */
 window.addEventListener('pp168:details-opened',e=>{
  const id=String(e.detail?.id||'');const body=document.getElementById('detailBody');if(!body||!id)return;
  body.querySelector('.pp1730-line')?.remove();
  const o=byId(id);if(!o)return;
  const steps=[['saabus',Number(o.created)||0]];
  let acc=Number(o.accepted)||0;
  try{const r=window.PPKitchenStatus?.get(id);if(r&&!acc&&r.status==='active'&&r.changed_at)acc=Date.parse(r.changed_at)||0;}catch(_){}
  if(acc)steps.push(['vastu võetud',acc]);
  try{const p=window.PPPrintMonitor?.record(id);if(p&&p.count>0){const t=Date.parse(p.first_at||p.last_at||'')||Number(p.last_at)||0;if(t)steps.push(['prinditud',t]);}}catch(_){}
  if(o.status==='done'&&Number(o.completed)>0)steps.push(['valmis',Number(o.completed)]);
  steps.sort((a,b)=>a[1]-b[1]);
  const el=document.createElement('div');el.className='pp1730-line';
  el.innerHTML=steps.filter(s=>s[1]>0).map(([l,t],i,a)=>'<span><b>'+hm(t)+'</b>'+esc(l)+(i>0?'<i>+'+Math.max(0,Math.round((t-a[i-1][1])/60000))+' min</i>':'')+'</span>').join('<u></u>');
  const head=body.querySelector('.pp1725-dhead');head?head.after(el):body.prepend(el);
 });

 window.PP1730={decorate,applyHide};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1732.js == */
try{(function(){
/* Peetri Pizza v17.32 — owner: "Makstud вниз к сумме, Saabus под время", Kliendi märkus под коробки. Moves two chips on the card; data untouched. */
(function(){
 'use strict';
 if(window.PP1732)return;
 function tick(){
  for(const c of document.querySelectorAll('#ordersPage .ordercard[data-pp1728]:not([data-pp1732])')){
   c.dataset.pp1732='1';
   const foot=c.querySelector('.cardfoot'),price=foot&&foot.querySelector('.price');
   const pay=c.querySelector('.pp117-identity-line .pp1728-pay');
   if(pay&&foot){price?price.after(pay):foot.prepend(pay);}
   // owner: customer note at the bottom, under the boxes (above the buttons)
   const note=c.querySelector('.pp117-ticket-items>.customer-note');
   if(note&&foot){note.classList.add('pp1732-note');foot.before(note);}
   const meter=c.querySelector('.prep-meter'),time=c.querySelector('.pp117-identity-line .pp118-order-time');
   if(meter&&time){
    let col=meter.parentElement.classList.contains('pp1732-timecol')?meter.parentElement:null;
    if(!col){col=document.createElement('div');col.className='pp1732-timecol';meter.before(col);col.append(meter);}
    col.append(time);
   }
  }
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(()=>queueMicrotask(tick)));
 setInterval(tick,1500);setTimeout(tick,300);
 window.PP1732={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1733.js == */
try{(function(){
/* Peetri Pizza v17.33 — owner: nicer customer name. Adds a round initial in front of the name (screen only). */
(function(){
 'use strict';
 if(window.PP1733)return;
 function tick(){
  for(const n of document.querySelectorAll('#ordersPage .ordercard .pp92-customer:not([data-pp1733])')){
   n.dataset.pp1733='1';if(n.classList.contains('pp111-name-missing'))continue;
   const t=(n.textContent||'').trim();const ch=(t.match(/\p{L}/u)||[''])[0].toUpperCase();if(!ch)continue;
   const a=document.createElement('span');a.className='pp1733-ini';a.setAttribute('aria-hidden','true');a.textContent=ch;
   const w=document.createElement('span');w.className='pp1733-name';while(n.firstChild)w.append(n.firstChild);
   n.append(a,w);
  }
 }
 window.addEventListener('pp145:orders',()=>queueMicrotask(tick));
 setInterval(tick,1500);setTimeout(tick,200);
 window.PP1733={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1734.js == */
try{(function(){
/* Peetri Pizza v17.34 — owner: pizzas ordered several at a time go first, then big before small; phone next to the name.
 * Only moves elements that are already on the card; order data, printing and LIVE are untouched.
 */
(function(){
 'use strict';
 if(window.PP1734)return;
 const SIZE={family:0,large:1,medium:2,small:3};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 function sortCard(card,o){
  const box=card.querySelector('.pp117-ticket-items');if(!box)return;
  const lines=[...box.querySelectorAll(':scope>.product-line')];if(lines.length<2)return;
  const items=Array.isArray(o.items)?o.items:[];
  if(!lines.every(l=>l.dataset.pp1734i!==undefined)){
   if(lines.length!==items.length)return;
   lines.forEach((l,i)=>{l.dataset.pp1734i=String(i);});
  }
  const key=l=>{const it=items[Number(l.dataset.pp1734i)]||[];const raw=Array.isArray(it)?it[0]:it?.name;const q=qty(Array.isArray(it)?it[1]:it?.quantity);
   let p=null;try{p=window.PPOrderInfo?.parse(raw)}catch(_){}
   const pizza=!!(p&&(p.size||p.code));
   return [pizza?0:1,q>1?0:1,p&&p.size in SIZE?SIZE[p.size]:9,String(p?.name||raw||'').toLowerCase(),Number(l.dataset.pp1734i)];};
  const cmp=(a,b)=>{const x=key(a),y=key(b);for(let i=0;i<x.length;i++){if(x[i]<y[i])return -1;if(x[i]>y[i])return 1;}return 0;};
  const sorted=[...lines].sort(cmp);
  if(sorted.every((l,i)=>l===lines[i]))return;
  const anchor=lines[0].previousSibling;let ref=anchor?anchor.nextSibling:box.firstChild;
  for(const l of sorted){box.insertBefore(l,ref);ref=l.nextSibling;}
 }
 function phoneNext(card){
  const name=card.querySelector('.pp117-ticket-identity>.pp92-customer');const ph=card.querySelector('.pp117-identity-line .pp177-phone');
  if(!name||!ph)return;
  const row=document.createElement('div');row.className='pp1734-namerow';
  name.before(row);row.append(name,ph);
 }
 function tick(){
  const byId=new Map(orders().map(o=>[String(o.id),o]));
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const o=byId.get(card.dataset.orderId);
   if(o)try{sortCard(card,o)}catch(_){}
   try{phoneNext(card)}catch(_){}
  }
 }
 window.addEventListener('pp145:orders',()=>setTimeout(tick,0));
 setInterval(tick,1500);setTimeout(tick,250);
 window.PP1734={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1735.js == */
try{(function(){
/* Peetri Pizza v17.35 — owner: fullscreen button in the header where the sound button was; sound on/off moves to the side menu;
 * "Lõpeta vahetus" hidden from the menu (only hidden, the module stays). */
(function(){
 'use strict';
 if(window.PP1735)return;
 const $id=id=>document.getElementById(id);
 function soundLabel(){const s=$id('soundBtn');const off=!s||s.getAttribute('aria-pressed')==='false';return off?'Heli: väljas':'Heli: sees';}
 function place(){
  const s=$id('soundBtn'),fs=$id('pp173-fullscreen');
  if(s&&fs&&s.previousElementSibling!==fs)s.before(fs);
  const nav=document.querySelector('#drawer nav');
  if(nav&&!$id('pp1735-sound-nav')){const b=document.createElement('button');b.type='button';b.id='pp1735-sound-nav';b.className='navitem';b.innerHTML='<span>♫</span> <em></em>';
   const st=nav.querySelector('[data-page="settings"]');st?nav.insertBefore(b,st):nav.append(b);}
  const t=$id('pp1735-sound-nav')?.querySelector('em');if(t){const l=soundLabel();if(t.textContent!==l)t.textContent=l;}
 }
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  if(t.closest('#pp1735-sound-nav')){e.preventDefault();e.stopPropagation();$id('soundBtn')?.click();setTimeout(place,50);}
 },true);
 setInterval(place,1500);setTimeout(place,200);
 window.PP1735={place};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1736.js == */
try{(function(){
/* Peetri Pizza v17.36 — owner: a phone handset in front of the name (where the round letter was).
 * The number is hidden; tap the handset to show it, tap the number to call. Tap the handset again to hide it. */
(function(){
 'use strict';
 if(window.PP1736)return;
 const open=new Set();
 const SVG='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
 function tick(){
  for(const ph of document.querySelectorAll('#ordersPage .ordercard .pp1734-namerow>a.pp177-phone:not([data-pp1736])')){
   ph.dataset.pp1736='1';
   const num=(ph.textContent||'').replace(/[^0-9+ -]/g,'').trim();if(num)ph.textContent=num;
   const row=ph.parentElement;if(row.querySelector('.pp1736-call'))continue;
   const b=document.createElement('button');b.type='button';b.className='pp1736-call';b.title='Näita numbrit';b.setAttribute('aria-label','Näita kliendi telefoni');b.innerHTML=SVG;
   row.prepend(b);
   const id=ph.closest('.ordercard')?.dataset.orderId;if(id&&open.has(id))row.classList.add('pp1736-open');
  }
 }
 // live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  const b=t.closest('#ordersPage .pp1736-call');if(!b)return;
  e.preventDefault();e.stopPropagation();
  const row=b.parentElement;const on=row.classList.toggle('pp1736-open');
  const id=b.closest('.ordercard')?.dataset.orderId;if(id){on?open.add(id):open.delete(id);}
  b.title=on?'Peida number':'Näita numbrit';
 },true);
 window.addEventListener('pp145:orders',()=>setTimeout(tick,20));
 setInterval(tick,1500);setTimeout(tick,300);
 window.PP1736={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1737.js == */
try{(function(){
/* Peetri Pizza v17.37 — owner: "Когда приходит новый заказ мы выбираем время приготовления".
 * Tap "Võta vastu" → a sheet with times; the chosen time becomes the card timer (now + N min).
 * LIVE: saved with the kitchen status on our server (api/kitchen-status.php, prep_minutes) and shared between tablets.
 * Nothing is sent to peetripizza.ee. DEMO: changes the demo order only. */
(function(){
 'use strict';
 if(window.PP1737)return;
 const TIMES=[10,15,20,25,30,40,50,60];
 const pending=new Map();let pass=false,target=null;
 const api={last:null,take(id){const v=pending.get(id);pending.delete(id);api.last=Number.isInteger(v)?v:null;return api.last;}};
 window.PP1737=api;
 const sheet=document.createElement('div');sheet.id='pp1737-sheet';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','Valmistusaeg');
 document.body.append(sheet);
 function defMin(){const s=document.getElementById('pp158-wait-select')||document.getElementById('pp114-wait-select');const v=Number(s?.value);return TIMES.includes(v)?v:20;}
 function open(btn){
  target=btn;const card=btn.closest('.ordercard');
  const name=(card?.querySelector('.pp1733-name')||card?.querySelector('.pp92-customer'))?.textContent?.trim()||'';
  const num=card?.querySelector('.order-number')?.textContent?.trim()||'';
  const d=defMin();
  sheet.innerHTML='<div class="pp1737-box"><div class="pp1737-head"><div><small>VALMISTUSAEG</small><strong>'+esc(name)+' <span>'+esc(num)+'</span></strong></div><button type="button" class="pp1737-x" aria-label="Sulge">✕</button></div>'+
   '<div class="pp1737-grid">'+TIMES.map(t=>'<button type="button" data-min="'+t+'"'+(t===d?' class="on"':'')+'><b>'+t+'</b><small>min</small></button>').join('')+'</div>'+
   '<p>Kell valmis: <b class="pp1737-at"></b> · ainult köögis, kliendile ei saadeta</p></div>';
  sheet.hidden=false;hover(d);
 }
 function hover(m){const at=sheet.querySelector('.pp1737-at');if(at){const x=new Date(Date.now()+m*60000);at.textContent=String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0');}}
 function close(){sheet.hidden=true;target=null;}
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function choose(m){
  const btn=target;close();if(!btn||!btn.isConnected)return;
  const id=btn.dataset.id;
  if(btn.dataset.kitchenAction==='active'){pending.set(id,m);}
  pass=true;try{btn.click();}finally{pass=false;}
  if(btn.dataset.action==='accept'){
   try{const o=(typeof orders!=='undefined'&&Array.isArray(orders))?orders.find(x=>x.id===id):null;
    if(o&&o.status==='active'){o.minutes=m;o.deadline=Date.now()+m*60000;if(typeof save==='function')save();if(typeof renderOrders==='function')renderOrders();}}catch(_){}
  }
 }
 // live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  if(!sheet.hidden){
   const b=t.closest('#pp1737-sheet [data-min]');
   if(b){e.preventDefault();e.stopPropagation();choose(Number(b.dataset.min));return;}
   if(t.closest('.pp1737-x')||!t.closest('.pp1737-box')){e.preventDefault();e.stopPropagation();close();return;}
   return;
  }
  if(pass)return;
  const btn=t.closest('#ordersPage .ordercard button[data-kitchen-action="active"],#ordersPage .ordercard button[data-action="accept"]');
  if(!btn||btn.disabled)return;
  const card=btn.closest('.ordercard');
  if(btn.dataset.kitchenAction==='active'&&!card?.classList.contains('pp118-new'))return; // "Tühista valmis" etc. stay as they were
  e.preventDefault();e.stopPropagation();open(btn);
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1738.js == */
try{(function(){
/* Peetri Pizza v17.38 — owner: screen scale slider in Seaded → Köök ("кому-то побольше, кому-то поменьше").
 * Saved on this tablet only (localStorage pp1738-zoom), applied with CSS zoom on <html>. 100% = as before. */
(function(){
 'use strict';
 if(window.PP1738)return;
 const KEY='pp1738-zoom',MIN=80,MAX=130,STEP=5;
 const clamp=v=>Math.min(MAX,Math.max(MIN,Math.round(v/STEP)*STEP));
 let z=100;try{const v=Number(localStorage.getItem(KEY));if(v)z=clamp(v);}catch(_){}
 function apply(){document.documentElement.style.zoom=z===100?'':String(z/100);const o=document.getElementById('pp1738-val');if(o)o.textContent=z+'%';const r=document.getElementById('pp1738-range');if(r&&Number(r.value)!==z)r.value=String(z);}
 function set(v){z=clamp(v);try{z===100?localStorage.removeItem(KEY):localStorage.setItem(KEY,String(z));}catch(_){}apply();}
 apply();
 function row(){
  if(document.getElementById('pp1738-row'))return;
  const lite=document.getElementById('pp1714-lite-row');if(!lite)return;
  const rows=[...lite.parentElement.querySelectorAll(':scope>.settingsrow,:scope>.pp163-setting-row')];const anchor=rows[rows.length-1]||lite;
  const d=document.createElement('div');d.className='settingsrow';d.id='pp1738-row';
  d.innerHTML='<div><strong>Ekraani suurus</strong><small>Kõik tekst ja nupud suuremaks või väiksemaks. Kehtib ainult selles tahvlis.</small></div>'+
   '<div class="pp1738-ctl"><button type="button" data-z="-" aria-label="Väiksemaks">A−</button><input id="pp1738-range" type="range" min="'+MIN+'" max="'+MAX+'" step="'+STEP+'" value="'+z+'" aria-label="Ekraani suurus"><button type="button" data-z="+" aria-label="Suuremaks">A+</button><button type="button" data-z="0" id="pp1738-val" title="Tagasi 100%">'+z+'%</button></div>';
  anchor.after(d);
  const r=d.querySelector('#pp1738-range');
  r.addEventListener('change',()=>set(Number(r.value)));
  r.addEventListener('input',()=>{const o=document.getElementById('pp1738-val');if(o)o.textContent=r.value+'%';});
 }
 // live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const b=e.target instanceof Element&&e.target.closest('#pp1738-row [data-z]');if(!b)return;
  e.preventDefault();e.stopPropagation();
  const k=b.dataset.z;set(k==='0'?100:z+(k==='+'?STEP:-STEP));
 },true);
 setInterval(row,1500);setTimeout(row,400);
 window.PP1738={set,get:()=>z};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1739.js == */
try{(function(){
/* Peetri Pizza v17.39 — owner: one calm style everywhere.
 * Tooted: "Kodulehel otsas" moves to the bottom of the page and is folded (tap the title to open).
 * Drawer footer shows the real installed version. Layout only; data, LIVE and printing untouched. */
(function(){
 'use strict';
 if(window.PP1739)return;
 const ver=(document.querySelector('meta[name="peetri-release"]')?.content||'').replace(/\.0$/,'');
 function tick(){
  const page=document.getElementById('productsPage'),box=document.getElementById('pp176-missing');
  if(page&&box){
   const foot=page.querySelector(':scope>.pp-footer,:scope>footer');
   if(foot?(box.nextElementSibling!==foot):(page.lastElementChild!==box))foot?foot.before(box):page.append(box);
   const n=box.querySelectorAll('.pp176-chip').length;const c=String(n);
   box.classList.toggle('pp1739-has',n>0);
   const h=box.querySelector('.pp176-missing-head');if(h&&h.dataset.n!==c+' otsas')h.dataset.n=c+' otsas';
  }
  const db=document.querySelector('#drawer .drawer-bottom');
  if(db&&ver){for(const t of db.childNodes){if(t.nodeType===3&&/v\d+\.\d+/.test(t.nodeValue)&&!t.nodeValue.includes('v'+ver))t.nodeValue=t.nodeValue.replace(/v\d+(\.\d+)+/,'v'+ver);}}
 }
 // live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const h=e.target instanceof Element&&e.target.closest('#pp176-missing.pp1739-has .pp176-missing-head');if(!h)return;
  e.preventDefault();e.stopPropagation();h.parentElement.classList.toggle('pp1739-open');
 },true);
 setInterval(tick,1500);setTimeout(tick,300);
 window.PP1739={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1740.js == */
try{(function(){
/* Peetri Pizza v17.40 — owner picked 1,2,3,4,6. Here: #2 finished orders on the Valmis page look like the kitchen cards
 * (type stripe, number chip, KAASA/KULLERIGA/KOHAPEAL + payment chips, no big check square). Layout only. */
(function(){
 'use strict';
 if(window.PP1740)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function byId(id){try{return (typeof shownOrders==='function'?shownOrders():[]).find(o=>String(o.id)===String(id))||null}catch(_){return null}}
 function decorate(){
  for(const c of document.querySelectorAll('#doneOrders .pp112-done-card[data-order-id]:not([data-pp1740])')){
   c.dataset.pp1740='1';
   const o=byId(c.dataset.orderId);
   const t=o?(o.dineIn?'kohapeal':o.serving==='delivery'?'kuller':'kaasa'):'kaasa';
   c.classList.add('pp1740-card','pp1730-t-'+t);
   const num=c.querySelector('.pp112-number');
   if(num&&o&&!c.querySelector('.pp1730-chips')){
    const line=document.createElement('span');line.className='pp1730-chips';
    const label={kuller:'KULLERIGA',kaasa:'KAASA',kohapeal:'KOHAPEAL'}[t];
    let pay=null;try{pay=window.PP1728?.payChip(o.payment)}catch(_){}
    line.innerHTML='<span class="pp1730-type">'+label+'</span>'+(pay?'<span class="pp1728-pay pp1728-pay-'+pay[1]+'">'+esc(pay[0])+'</span>':'');
    num.after(line);
   }
  }
 }
 setInterval(decorate,1500);setTimeout(decorate,300);
 window.addEventListener('pp145:orders',()=>setTimeout(decorate,30));
 window.PP1740={decorate};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1741.js == */
try{(function(){
/* Peetri Pizza v17.41/17.42 (17.42: cards only, header/menu/columns untouched) — main screen like the owner's picture (12.11.2026, "Давай сделаем вот так").
 * Screen only, data untouched. Nothing removed: header buttons are hidden and reachable from the menu.
 * - header: "Kolde / Peetri Pizza" text, Ootaeg in the middle, status dot + clock + fullscreen on the right
 * - menu gets "Valmis tellimused" and "DEMO / LIVE" (they left the header)
 * - columns: "Uued" / "Valmistamisel"
 * - card: "N pitsat" in the meta row, "Alusta valmistamist" instead of "Võta vastu"
 */
(function(){
 'use strict';
 if(window.PP1741)return;
 const $q=(s,r)=>(r||document).querySelector(s);
 const qn=t=>{const m=String(t||'').match(/(\d+)/);return m?Number(m[1]):1;};

 function header(){
  const bg=$q('.topbar .brandgroup');
  if(bg&&!$q('.pp1741-brand',bg)){
   const loc=($q('.pp114-location',bg)?.textContent||'').trim();
   const nice=loc?loc.charAt(0).toUpperCase()+loc.slice(1).toLowerCase():'';
   const d=document.createElement('div');d.className='pp1741-brand';
   d.innerHTML='<strong></strong><small>Peetri Pizza</small>';
   d.firstChild.textContent=nice||'Peetri Pizza';
   if(!nice)d.lastChild.remove();
   const mb=$q('#menuBtn',bg);mb?mb.after(d):bg.append(d);
  }
  const clock=$q('#pp1722-clock');
  if(clock&&!$q('#pp1741-dot')){
   const i=document.createElement('i');i.id='pp1741-dot';i.setAttribute('aria-hidden','true');clock.before(i);
  }
  const dot=$q('#pp1741-dot');
  if(dot){
   const chip=$q('#pp160-live-chip'),mode=$q('#pp172-mode');
   const s=(chip&&chip.dataset.state)||(mode&&mode.dataset.state)||'demo';
   if(dot.dataset.state!==s){dot.dataset.state=s;dot.title=s==='live'?'LIVE ühendus':s==='demo'?'DEMO (näidisandmed)':'LIVE ühendus katkes';}
  }
  const w=$q('#pp1722-wait');
  if(w&&!$q('.pp1741-wi',w)){
   w.insertAdjacentHTML('afterbegin','<svg class="pp1741-wi" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>');
   w.insertAdjacentHTML('beforeend','<svg class="pp1741-wc" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>');
  }
 }

 function menu(){
  const nav=$q('.drawer nav');if(!nav)return;
  const anchor=$q('#pp1735-sound-nav',nav);
  if(!$q('#pp1741-ready-nav',nav)){
   const b=document.createElement('button');b.type='button';b.id='pp1741-ready-nav';b.className='navitem';
   b.innerHTML='<span aria-hidden="true">✓</span> <em>Valmis tellimused</em> <b class="pp1741-n"></b>';
   anchor?anchor.before(b):nav.append(b);
  }
  if(!$q('#pp1741-mode-nav',nav)){
   const b=document.createElement('button');b.type='button';b.id='pp1741-mode-nav';b.className='navitem';
   b.innerHTML='<span aria-hidden="true">●</span> <em class="pp1741-mt"></em>';
   anchor?anchor.before(b):nav.append(b);
  }
  const n=$q('#pp171-ready-count')?.textContent.trim()||'';
  const rn=$q('#pp1741-ready-nav .pp1741-n');if(rn&&rn.textContent!==n)rn.textContent=n;
  const live=($q('#pp172-mode')?.dataset.state||'demo')!=='demo';
  const t=live?'LIVE · vaheta DEMO peale':'DEMO · vaheta LIVE peale';
  const mt=$q('#pp1741-mode-nav .pp1741-mt');if(mt&&mt.textContent!==t)mt.textContent=t;
  const mb=$q('#pp1741-mode-nav');if(mb)mb.dataset.state=live?'live':'demo';
 }

 window.addEventListener('click',e=>{
  const t=e.target instanceof Element&&e.target.closest('#pp1741-ready-nav,#pp1741-mode-nav');if(!t)return;
  e.preventDefault();e.stopPropagation();
  try{if(typeof closeMenu==='function')closeMenu();else $q('#closeDrawer')?.click();}catch(_){}
  if(t.id==='pp1741-ready-nav'){$q('#pp171-ready')?.click();}
  else{const live=($q('#pp172-mode')?.dataset.state||'demo')!=='demo';$q('#pp172-mode button[data-mode="'+(live?'demo':'live')+'"]')?.click();}
  setTimeout(tick,300);
 },true);

 function heads(){
  for(const[sel,txt]of[['.pp1723-col-new .section-head h2','Uued'],['.pp1723-col-work .section-head h2','Valmistamisel']]){
   const h=$q('#ordersPage '+sel);if(!h)continue;
   const tn=[...h.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
   if(tn&&tn.textContent.trim()!==txt)tn.textContent=txt+' ';
  }
 }

 function cards(){
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   // N pitsat
   let pz=0,all=0;
   for(const l of card.querySelectorAll('.carditems>.product-line:not(.pp1728-moved)')){
    const q=qn(l.querySelector('.product-qty')?.textContent);all+=q;if(l.querySelector('.pp119-code'))pz+=q;
   }
   for(const l of card.querySelectorAll('.carditems>.product-line.pp1728-moved'))all+=qn(l.querySelector('.product-qty')?.textContent);
   const line=card.querySelector('.pp117-identity-line');
   if(line){
    let c=line.querySelector(':scope>.pp1741-count');
    if(!c){c=document.createElement('span');c.className='pp1741-count';line.append(c);}
    const tx=pz?pz+(pz===1?' pitsa':' pitsat'):all+(all===1?' toode':' toodet');
    if(c.textContent!==tx)c.textContent=tx;
   }
   // Alusta valmistamist
   for(const b of card.querySelectorAll('button[data-action="accept"],button[data-kitchen-action="active"]')){
    if(b.textContent.trim()==='Võta vastu'){b.textContent='Alusta valmistamist';b.classList.add('pp1741-start');}
   }
   // ⓘ moves to the end of the KARBID row so the big button has the room (same button, same handlers)
   const det=card.querySelector('.cardfoot>button.details'),bx=card.querySelector('.pp177-boxes');
   if(det&&bx){det.classList.add('pp1741-det');bx.append(det);}
   for(const b of card.querySelectorAll('.cardfoot button[data-action="done"],.cardfoot button[data-kitchen-action="done"]'))b.classList.add('pp1741-done');
  }
 }

 function tick(){
  // 17.42: header(), menu(), heads() off — owner wanted only the cards changed
  try{cards()}catch(_){}
  document.documentElement.classList.add('pp1741-on');
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 window.addEventListener('pp145:orders',later);
 try{const r=document.getElementById('ordersPage');if(r)new MutationObserver(later).observe(r,{childList:true,subtree:true});}catch(_){}
 setInterval(tick,3000);setTimeout(tick,100);setTimeout(tick,800);
 window.PP1741={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1745.js == */
try{(function(){
/* Peetri Pizza v17.45 — order card (owner picked 1, 3, 6 on 12.11.2026).
 * 1: thin bar under the JÄÄNUD box that slowly shrinks to the deadline (no blinking).
 * 3: pre-orders (ETTETELLIMUS, more than an hour ahead) fold into one line at the bottom of "Uued";
 *    they open by themselves an hour before, or by a tap.
 * 6: a long customer name or product name gets a smaller font so it fits whole, instead of "…".
 * Screen only: order data, LIVE, printing and buttons are untouched. Off switch: <html class="pp1745-off">.
 */
(function(){
 'use strict';
 if(window.PP1745)return;
 const root=document.documentElement;
 const OPEN_KEY='pp1745-open';
 let open;try{open=new Set(JSON.parse(sessionStorage.getItem(OPEN_KEY)||'[]'))}catch(_){open=new Set()}
 const saveOpen=()=>{try{sessionStorage.setItem(OPEN_KEY,JSON.stringify([...open].slice(-50)))}catch(_){}};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 function deadline(o){try{if(typeof orderDeadline==='function')return orderDeadline(o)}catch(_){}const d=Number(o.deadline);return d>0?d:(Number(o.created)||0)+(Number(o.minutes)||20)*60000;}

 // 1: time bar
 function bar(card,o,now){
  const due=card.querySelector('.pp1728-due');if(!due)return;
  let b=due.querySelector(':scope>.pp1745-bar');
  if(!b){b=document.createElement('span');b.className='pp1745-bar';b.setAttribute('aria-hidden','true');b.innerHTML='<span></span>';due.append(b);}
  const dl=deadline(o),st=Number(o.created)||0;
  const total=dl-st,left=dl-now;
  const p=total>0?Math.max(0,Math.min(1,left/total)):0;
  const w=(Math.round(p*1000)/10)+'%';
  if(b.firstChild.style.width!==w)b.firstChild.style.width=w;
 }

 // 3: pre-orders folded
 function fold(card,o){
  const id=String(o.id);
  const due=card.querySelector('.pp1728-due');
  const pre=!!(due&&due.dataset.s==='pre'&&card.closest('#newOrders'));
  const want=pre&&!open.has(id);
  let line=card.querySelector(':scope>.pp1745-foldline');
  if(want){
   if(!line){line=document.createElement('button');line.type='button';line.className='pp1745-foldline';line.innerHTML='<b>ETTETELLIMUS</b><span class="pp1745-fn"></span><span class="pp1745-ft"></span><span class="pp1745-fs"></span><span class="pp1745-fc"></span><i aria-hidden="true">▾</i>';card.prepend(line);}
   // v17.51 (owner): when to start = deadline minus the kitchen's prep time
   if(!line.querySelector('.pp1745-fs')){const fs=document.createElement('span');fs.className='pp1745-fs';line.querySelector('.pp1745-ft')?.after(fs);}
   let prep=0;try{if(typeof minutes!=='undefined')prep=Number(minutes);}catch(_){} // Seaded → Valmistamisaeg
   if(!(prep>0))prep=Number(o.minutes);
   if(!(prep>0))prep=20;
   const st=new Date(deadline(o)-prep*60000),hm=String(st.getHours()).padStart(2,'0')+':'+String(st.getMinutes()).padStart(2,'0');
   const name=(card.querySelector('.pp1733-name')||card.querySelector('.pp92-customer'))?.textContent?.trim()||'';
   const [L,B]=[due.children[0]?.textContent||'',due.children[1]?.textContent||''];
   const t=(L+' '+B).trim();
   const c=card.querySelector('.pp1741-count')?.textContent?.trim()||'';
   const set=(sel,v)=>{const e=line.querySelector(sel);if(e&&e.textContent!==v)e.textContent=v;};
   set('.pp1745-fn',name);set('.pp1745-ft',t);set('.pp1745-fs','Alusta '+hm);set('.pp1745-fc',c);
   card.classList.add('pp1745-fold');
  }else{
   card.classList.remove('pp1745-fold');
   if(line)line.remove();
  }
  card.classList.toggle('pp1745-pre',pre);
 }
 window.addEventListener('click',e=>{
  const t=e.target instanceof Element&&e.target.closest('.pp1745-foldline');if(!t)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const card=t.closest('.ordercard');const id=card&&card.dataset.orderId;if(!id)return;
  open.add(String(id));saveOpen();
  card.classList.remove('pp1745-fold');t.remove();
  setTimeout(()=>{try{card.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(_){}},30);
 },true);

 // 6: long names fit whole
 function fit(card){
  const w=card.clientWidth;
  for(const el of card.querySelectorAll('.pp1733-name,.product-name .pp177-name')){
   const key=w+'|'+el.textContent;
   if(el.dataset.pp1745===key)continue;
   el.style.removeProperty('font-size');el.classList.remove('pp1745-wrap');
   if(el.scrollWidth<=el.clientWidth+1){el.dataset.pp1745=key;continue;}
   const base=parseFloat(getComputedStyle(el).fontSize)||28,min=Math.max(14,base*0.62);
   let fs=base;
   while(el.scrollWidth>el.clientWidth+1&&fs>min){fs=Math.max(min,fs-2);el.style.setProperty('font-size',fs+'px','important');}
   // still too long even at the smallest size: two lines at a medium size instead of "…"
   if(el.scrollWidth>el.clientWidth+1){el.classList.add('pp1745-wrap');el.style.setProperty('font-size',Math.round(base*0.72)+'px','important');}
   el.dataset.pp1745=key;
  }
 }

 function tick(){
  if(root.classList.contains('pp1745-off'))return;
  const now=Date.now();
  const byId=new Map(orders().map(o=>[String(o.id),o]));
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const o=byId.get(card.dataset.orderId);if(!o)continue;
   try{bar(card,o,now)}catch(_){}
   try{fold(card,o)}catch(_){}
   try{if(!card.classList.contains('pp1745-fold'))fit(card)}catch(_){}
  }
  root.classList.add('pp1745-on');
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 window.addEventListener('pp145:orders',()=>setTimeout(later,60));
 window.addEventListener('resize',later);
 setInterval(tick,5000);setTimeout(tick,300);setTimeout(tick,1200);
 window.PP1745={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1746.js == */
try{(function(){
/* Peetri Pizza v17.46 — owner picked 1 and 4 (12.11.2026).
 * 1: "Ahju: 3× SÕ · 2× VÕ" in the "Valmistamisel" column head = pizzas by size code in all orders being made.
 * 4: icons in the "Lisaks" row: a cup for drinks, a dip bowl for sauces.
 * Screen only: data, LIVE, printing and buttons untouched. Off switch: <html class="pp1746-off">.
 */
(function(){
 'use strict';
 if(window.PP1746)return;
 const root=document.documentElement;
 const ORDER=['SÕ','SP','S','VÕ','VP','V','KÕ','KP','K','Pere Õ','Pere P','Pere'];
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}

 // 1
 function oven(byId){
  const head=document.querySelector('#ordersPage .pp1723-col-work .section-head');if(!head)return;
  const count=new Map();
  for(const card of document.querySelectorAll('#activeOrders .ordercard[data-order-id]')){
   const o=byId.get(card.dataset.orderId);if(!o)continue;
   for(const it of (Array.isArray(o.items)?o.items:[])){
    const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];let p=null;try{p=window.PPOrderInfo?.parse(raw)}catch(_){}
    if(!p||!(p.code||p.size))continue;
    const c=p.code||({large:'S',small:'V',family:'Pere',medium:'K'}[p.size]||'pitsa');
    count.set(c,(count.get(c)||0)+qty(q));
   }
  }
  const rank=c=>{const i=ORDER.indexOf(c);return i<0?99:i;};
  const parts=[...count].sort((a,b)=>rank(a[0])-rank(b[0]));
  let el=head.querySelector(':scope>.pp1746-oven');
  if(!parts.length){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.className='pp1746-oven';head.firstElementChild?head.firstElementChild.after(el):head.append(el);}
  const html='<b>Ahju</b>'+parts.map(([c,n])=>'<span><strong>'+n+'×</strong> '+c.replace(/[&<>]/g,'')+'</span>').join('');
  if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}
 }

 // 4
 const DRINK=/cola|pepsi|7\s*up|mirinda|fanta|sprite|vesi|water|mahl|juice|jäätee|lipton|red\s*bull|limonaad|õlu|kali|\(?\d+[.,]\d+\s*l\)?|\b0[.,]\d+l\b/i;
 const SAUCE=/kaste|dip|sauce|ketšup|ketchup|majonees|aioli|salsa/i;
 const CUP='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.4 13.2a1 1 0 0 1-1 .8H8.4a1 1 0 0 1-1-.8z"/><path d="M5 7h14"/><path d="M12 7l2-4h3"/></svg>';
 const DIP='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1.5-1.5 1.5-3M13 7c0-1.5 1.5-1.5 1.5-3"/></svg>';
 function icons(){
  for(const s of document.querySelectorAll('#ordersPage .pp1728-lisaks>span:not([data-pp1746])')){
   s.dataset.pp1746='1';
   const t=s.textContent||'';
   const k=SAUCE.test(t)?'dip':DRINK.test(t)?'cup':'';
   if(!k)continue;
   const i=document.createElement('i');i.className='pp1746-ic pp1746-'+k;i.innerHTML=k==='cup'?CUP:DIP;s.prepend(i);
  }
 }

 function tick(){
  if(root.classList.contains('pp1746-off'))return;
  const byId=new Map(orders().map(o=>[String(o.id),o]));
  try{oven(byId)}catch(_){}
  try{icons()}catch(_){}
  root.classList.add('pp1746-on');
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 window.addEventListener('pp145:orders',()=>setTimeout(later,80));
 try{const r=document.getElementById('ordersPage');if(r)new MutationObserver(later).observe(r,{childList:true,subtree:true});}catch(_){}
 setInterval(tick,5000);setTimeout(tick,300);setTimeout(tick,1200);
 window.PP1746={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1747.js == */
try{(function(){
/* Peetri Pizza v17.47 — owner picked 1, 2, 3, 4 (12.11.2026).
 * 1: "Valmis" on a card is one tap: no "Kas on valmis?" sheet. Undo stays: LIVE has the 10 s "↶ Tagasi" bar (ops-v1711),
 *    DEMO its own undo bar (app-core). Same trick as ops-v1711 used for LIVE since 17.11: confirm() answers yes for this one click.
 * 2: "Ära unusta" (drinks, sauces, boxes) is now a big panel at the bottom for 10 s after Valmis, with icons. Tap closes it.
 * 3: "Ootel: 2× SÕ · 1× VP" in the "Uued" head (folded pre-orders not counted).
 * 4: a new order has a calm green frame for its first 3 minutes. Nothing blinks.
 * Screen only; order data and LIVE untouched. Off switch: <html class="pp1747-off">.
 */
(function(){
 'use strict';
 if(window.PP1747)return;
 const root=document.documentElement;
 const off=()=>root.classList.contains('pp1747-off');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const qty=q=>{const n=Number(q);return Number.isFinite(n)&&n>0?n:1;};
 function orders(){try{return typeof shownOrders==='function'?shownOrders():[]}catch(_){return []}}
 const byIdNow=id=>orders().find(o=>String(o.id)===String(id));
 const parse=raw=>{try{return window.PPOrderInfo?.parse(raw)||null}catch(_){return null}};
 const DONE='#ordersPage .ordercard button[data-action="done"],#ordersPage .ordercard button[data-kitchen-action="done"]';

 // 1 + 2
 const DRINK=/cola|pepsi|7\s*up|mirinda|fanta|sprite|vesi|water|mahl|juice|jäätee|lipton|red\s*bull|limonaad|õlu|kali|\d+[.,]\d+\s*l\b/i;
 const SAUCE=/kaste|dip|sauce|ketšup|ketchup|majonees|aioli|salsa/i;
 const IC={
  cup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.4 13.2a1 1 0 0 1-1 .8H8.4a1 1 0 0 1-1-.8z"/><path d="M5 7h14"/><path d="M12 7l2-4h3"/></svg>',
  dip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1.5-1.5 1.5-3M13 7c0-1.5 1.5-1.5 1.5-3"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
  other:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/></svg>'
 };
 function forgetList(o){
  const out=[];
  for(const it of (Array.isArray(o.items)?o.items:[])){
   const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];const p=parse(raw);
   if(p&&(p.size||p.code))continue;
   const name=String((p&&p.name)||raw||'').split(' — ')[0].trim();if(!name)continue;
   out.push([SAUCE.test(name)?'dip':DRINK.test(name)?'cup':'other',qty(q)+'× '+name]);
  }
  let boxes=null;try{boxes=window.PPOrderInfo?.boxes(o)}catch(_){}
  if(Array.isArray(boxes)&&boxes.length)out.push(['box',boxes.map(([k,n])=>n+'× '+k).join(' · ')]);
  return out;
 }
 const panel=document.createElement('div');panel.id='pp1747-forget';panel.hidden=true;panel.setAttribute('role','status');
 document.body.append(panel);
 let hideT=0;
 function hidePanel(){clearTimeout(hideT);panel.hidden=true;}
 function showForget(o){
  const list=forgetList(o);if(!list.length)return;
  panel.innerHTML='<div class="pp1747-fh"><b>ÄRA UNUSTA</b><span>#'+esc(o.number||'')+'</span><i aria-hidden="true">✕</i></div><div class="pp1747-fl">'+
   list.map(([k,t])=>'<span class="pp1747-f-'+k+'"><em>'+IC[k]+'</em>'+esc(t)+'</span>').join('')+'</div>';
  panel.hidden=false;clearTimeout(hideT);hideT=setTimeout(hidePanel,10000);
 }
 panel.addEventListener('click',hidePanel);
 window.addEventListener('click',e=>{
  if(off())return;
  const b=e.target instanceof Element&&e.target.closest(DONE);if(!b||b.disabled)return;
  const id=b.closest('.ordercard')?.dataset.orderId||b.dataset.id;const o=id&&byIdNow(id);
  // one tap: this click's confirm() says yes, then the previous confirm() is back.
  // ops-v1711 does the same for LIVE in an earlier listener, so restore only our own stand-in.
  const prev=window.confirm,yes=()=>true;window.confirm=yes;setTimeout(()=>{if(window.confirm===yes)window.confirm=prev;},0);
  if(o&&o.status!=='done')showForget(o);
 },true);

 // 3
 const ORDER=['SÕ','SP','S','VÕ','VP','V','KÕ','KP','K','Pere Õ','Pere P','Pere'];
 function waiting(byId){
  const head=document.querySelector('#ordersPage .pp1723-col-new .section-head');if(!head)return;
  const count=new Map();
  for(const card of document.querySelectorAll('#newOrders .ordercard[data-order-id]:not(.pp1745-fold)')){
   const o=byId.get(card.dataset.orderId);if(!o)continue;
   for(const it of (Array.isArray(o.items)?o.items:[])){
    const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];const p=parse(raw);
    if(!p||!(p.code||p.size))continue;
    const c=p.code||({large:'S',small:'V',family:'Pere',medium:'K'}[p.size]||'pitsa');
    count.set(c,(count.get(c)||0)+qty(q));
   }
  }
  const rank=c=>{const i=ORDER.indexOf(c);return i<0?99:i;};
  const parts=[...count].sort((a,b)=>rank(a[0])-rank(b[0]));
  let el=head.querySelector(':scope>.pp1747-wait');
  if(!parts.length){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.className='pp1746-oven pp1747-wait';head.firstElementChild?head.firstElementChild.after(el):head.append(el);}
  const html='<b>Ootel</b>'+parts.map(([c,n])=>'<span><strong>'+n+'×</strong> '+esc(c)+'</span>').join('');
  if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}
 }

 // 4
 function fresh(byId,now){
  for(const card of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const o=byId.get(card.dataset.orderId);
   const c=o&&Number(o.created);
   const on=!!(o&&o.status==='new'&&c>0&&now-c>=0&&now-c<3*60000&&card.closest('#newOrders'));
   if(card.classList.contains('pp1747-fresh')!==on)card.classList.toggle('pp1747-fresh',on);
  }
 }

 function tick(){
  if(off()){document.querySelectorAll('.pp1747-wait').forEach(e=>e.remove());return;}
  const now=Date.now();const byId=new Map(orders().map(o=>[String(o.id),o]));
  try{waiting(byId)}catch(_){}
  try{fresh(byId,now)}catch(_){}
  root.classList.add('pp1747-on');
 }
 let q=false;
 const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 window.addEventListener('pp145:orders',()=>setTimeout(later,80));
 try{const r=document.getElementById('ordersPage');if(r)new MutationObserver(later).observe(r,{childList:true,subtree:true});}catch(_){}
 setInterval(tick,5000);setTimeout(tick,300);setTimeout(tick,1200);
 window.PP1747={tick,showForget,hidePanel};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1748.js == */
try{(function(){
/* Peetri Pizza v17.48 — Väljastus (ready orders waiting for the customer) in the look of the order cards.
 * Adds a KARBID row from the card's own data-boxes, so the person handing over sees which boxes. Screen only.
 * Off switch: <html class="pp1748-off">. */
(function(){
 'use strict';
 if(window.PP1748)return;
 const root=document.documentElement;
 const BOX='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>';
 function tick(){
  if(root.classList.contains('pp1748-off'))return;
  for(const c of document.querySelectorAll('#pp1711-pickup .pp1711-copy,#pp155-station-list .pp155-station-order')){
   const raw=c.dataset.boxes||c.closest('[data-boxes]')?.dataset.boxes||'';
   let row=c.querySelector(':scope .pp1748-boxes');
   if(!raw||raw==='KOHAPEAL'||c.classList.contains('pp155-station-order')){if(row)row.remove();continue;}
   const html='<i>'+BOX+'</i><b>KARBID</b>'+raw.split(' · ').map(s=>'<span>'+s.replace(/[&<>"']/g,'')+'</span>').join('');
   if(!row){row=document.createElement('div');row.className='pp1748-boxes';const f=c.querySelector('.pp112-card-footer');f?f.before(row):c.append(row);}
   if(row.dataset.h!==html){row.dataset.h=html;row.innerHTML=html;}
  }
  root.classList.add('pp1748-on');
 }
 let q=false;const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 try{new MutationObserver(later).observe(document.body,{childList:true,subtree:true});}catch(_){}
 setInterval(tick,4000);setTimeout(tick,400);
 window.PP1748={tick};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1749.js == */
try{(function(){
/* Peetri Pizza v17.49 — owner picked 2, 3, 5, 6 (12.11.2026).
 * 5: heartbeat once a minute to api/heartbeat.php (device id, version, DEMO/LIVE, when LIVE data last came) for check.php.
 * 2: Seaded: rarely used switches move into "Veel seadeid" (folded) at the bottom of Köök. Same switches, same handlers, nothing removed.
 * 3: Statistika: one big line on top ("4 tellimust · 8 pitsat · 89,50 €"); the three tiles it repeats are only hidden.
 * Off switch: <html class="pp1749-off">.
 */
(function(){
 'use strict';
 if(window.PP1749)return;
 const root=document.documentElement;
 const off=()=>root.classList.contains('pp1749-off');
 const meta=n=>document.querySelector('meta[name="'+n+'"]')?.content||'';

 // 5
 let dev='';try{dev=localStorage.getItem('pp1749-device')||'';if(!/^[a-f0-9]{16}$/.test(dev)){const a=new Uint8Array(8);crypto.getRandomValues(a);dev=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('pp1749-device',dev);}}catch(_){dev=''}
 let liveAt=0;
 const mode=()=>(document.getElementById('pp172-mode')?.dataset.state||'demo')==='live'?'live':'demo';
 window.addEventListener('pp145:orders',()=>{if(mode()==='live')liveAt=Date.now();});
 async function beat(){
  if(!dev)return;
  try{
   await fetch('api/heartbeat.php',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':meta('pp-wait-csrf')},
    body:JSON.stringify({device:dev,version:meta('peetri-release'),mode:mode(),live_at:liveAt,page:(document.querySelector('.page.active')?.id||'').replace(/Page$/,''),screen:innerWidth+'x'+innerHeight})});
  }catch(_){}
 }
 setTimeout(beat,5000);setInterval(beat,60000);

 // 2
 const RARE=['Tahvli kiirrežiim','Suur köögiekraan','Kompaktne töölaud','Ülikompaktsed tellimused','Keri uue tellimuseni'];
 function settings(){
  const page=document.getElementById('settingsPage');if(!page||!page.classList.contains('active'))return;
  const rows=[...page.querySelectorAll('.settingsrow,.pp163-setting-row,.pp164-flow-option')].filter(r=>{const t=r.querySelector('strong')?.textContent?.trim();return t&&RARE.includes(t)&&!r.closest('#pp1749-more');});
  if(!rows.length)return;
  const group=rows[0].closest('.pp163-pref-group');if(!group)return;
  let more=page.querySelector('#pp1749-more');
  if(!more){more=document.createElement('details');more.id='pp1749-more';more.innerHTML='<summary>Veel seadeid <small>harva vaja</small></summary><div class="pp1749-more-body"></div>';group.append(more);}
  const body=more.querySelector('.pp1749-more-body');
  for(const r of rows)body.append(r);
 }

 // 3
 function stats(){
  const rep=document.getElementById('pp1719-report');if(!rep)return;
  const tiles=[...rep.querySelectorAll('.pp1719-tiles>.pp1719-tile')];if(tiles.length<4)return;
  const val=i=>tiles[i]?.querySelector('strong')?.textContent?.trim()||'';
  const n=val(0),money=val(1),pz=val(3);
  const word=(v,one,many)=>v+' '+(String(v)==='1'?one:many);
  let hero=rep.querySelector(':scope>.pp1749-hero');
  if(!hero){hero=document.createElement('div');hero.className='pp1749-hero';rep.querySelector('.pp1719-tiles')?.before(hero);}
  const html='<span><b>'+esc(n)+'</b> '+(n==='1'?'tellimus':'tellimust')+'</span><span><b>'+esc(pz)+'</b> '+(pz==='1'?'pitsa':'pitsat')+'</span><span><b>'+esc(money)+'</b> käive</span>';
  if(hero.dataset.h!==html){hero.dataset.h=html;hero.innerHTML=html;}
  for(const i of [0,1,3])tiles[i].classList.add('pp1749-in-hero');
 }
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 function tick(){if(off())return;try{settings()}catch(_){}try{stats()}catch(_){}root.classList.add('pp1749-on');}
 let q=false;const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 try{const m=document.querySelector('main')||document.body;new MutationObserver(later).observe(m,{childList:true,subtree:true});}catch(_){}
 window.addEventListener('click',()=>setTimeout(later,200),true);
 setInterval(tick,4000);setTimeout(tick,500);
 window.PP1749={tick,beat};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1750.js == */
try{(function(){
/* Peetri Pizza v17.50 — night screen in the new look (owner picked 6; 5 = repeat sound, in features-v145).
 * Adds "Peetri Pizza", the pizzeria name and "Täna: N tellimust · N pitsat" to the existing night screen (ops-v1718).
 * Numbers: LIVE from api/kitchen-analytics.php?period=today (our server), DEMO from the orders on screen. Nothing blinks. */
(function(){
 'use strict';
 if(window.PP1750)return;
 const root=document.documentElement;
 let day=null,dayAt=0;
 const live=()=>(document.getElementById('pp172-mode')?.dataset.state||'demo')!=='demo';
 async function numbers(){
  if(live()){
   if(Date.now()-dayAt<5*60000&&day)return day;
   try{const r=await fetch('api/kitchen-analytics.php?period=today',{credentials:'same-origin',cache:'no-store'});const j=await r.json();
    const rep=j&&j.report;if(rep){day={orders:Number(rep.orders)||0,pizzas:Number(rep.pizzas)||0};dayAt=Date.now();}}catch(_){}
   return day;
  }
  try{
   const list=typeof shownOrders==='function'?shownOrders():[];
   const t=new Date();t.setHours(0,0,0,0);
   const done=list.filter(o=>o.status==='done'&&Number(o.completed||o.created)>=t.getTime());
   let pz=0;for(const o of done)for(const it of (o.items||[])){const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];let p=null;try{p=window.PPOrderInfo?.parse(raw)}catch(_){}if(p&&(p.code||p.size))pz+=Number(q)||1;}
   return {orders:done.length,pizzas:pz};
  }catch(_){return null}
 }
 async function paint(){
  const scr=document.getElementById('pp1718-night');if(!scr||scr.hidden||root.classList.contains('pp1750-off'))return;
  const box=scr.querySelector('.pp1718-night-box');if(!box)return;
  if(!box.querySelector('.pp1750-logo')){
   const logo=document.createElement('div');logo.className='pp1750-logo';
   const name=(document.querySelector('.pp114-location')?.textContent||'').trim();
   logo.innerHTML='<b>Peetri Pizza</b><span></span>';logo.lastChild.textContent=name;
   box.prepend(logo);
   const s=document.createElement('div');s.className='pp1750-day';s.hidden=true;box.querySelector('#pp1718-night-text')?.after(s);
  }
  const s=box.querySelector('.pp1750-day');const n=await numbers();
  if(s&&n){const tx='Täna '+n.orders+(n.orders===1?' tellimus':' tellimust')+' · '+n.pizzas+(n.pizzas===1?' pitsa':' pitsat');if(s.textContent!==tx)s.textContent=tx;s.hidden=!n.orders;}
  root.classList.add('pp1750-on');
 }
 // the night screen is made by ops-v1718, which loads after the page is shown: watch it once it exists
 let watched=false;
 function attach(){if(watched)return;const scr=document.getElementById('pp1718-night');if(!scr)return;watched=true;try{new MutationObserver(paint).observe(scr,{attributes:true,attributeFilter:['hidden']});}catch(_){}paint();}
 const t=setInterval(()=>{attach();if(watched)clearInterval(t);},2000);
 setInterval(paint,30000);
 window.PP1750={paint};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1751.js == */
try{(function(){
/* Peetri Pizza v17.51 — Statistika "⬇ CSV": orders, pizzas and takings per day (owner picked 5).
 * Data from api/kitchen-analytics.php (our server, LIVE days only). No customer data. Period = the selected tab;
 * "Täna"/"Eile" export this month. Excel-friendly: UTF-8 BOM, ";" and decimal comma. */
(function(){
 'use strict';
 if(window.PP1751)return;
 const say=m=>{try{(window.toast||console.log)(m)}catch(_){}};
 function period(){const b=document.querySelector('#pp1719-stats .pp1719-tabs button[aria-pressed="true"]');const p=b?.dataset.pp1719||'month';return ['month','lastmonth','all'].includes(p)?p:'month';}
 const label={month:'see kuu',lastmonth:'eelmine kuu',all:'kogu aeg'};
 function button(){
  const head=document.querySelector('#pp1719-report .pp1719-report-head');if(!head)return;
  let b=head.querySelector('#pp1751-csv');
  if(!b){b=document.createElement('button');b.type='button';b.id='pp1751-csv';b.className='secondary';const pr=head.querySelector('#pp1719-print');pr?pr.before(b):head.append(b);}
  const t='⬇ CSV · '+label[period()];if(b.textContent!==t)b.textContent=t;
 }
 async function download(){
  const p=period();
  let j;try{const r=await fetch('api/kitchen-analytics.php?period='+p,{credentials:'same-origin',cache:'no-store'});j=await r.json();if(!r.ok||!j.ok)throw 0;}catch(_){say('CSV: serveriga ühendus puudub');return;}
  const days=j.report&&j.report.days?j.report.days:{};const keys=Object.keys(days).sort();
  if(!keys.length){say('CSV: selle perioodi kohta andmeid pole (andmed kogutakse LIVE režiimis)');return;}
  const eur=c=>(Math.round(Number(c)||0)/100).toFixed(2).replace('.',',');
  const rows=[['Kuupäev','Tellimusi','Pitsasid','Käive (€)']];let n=0,pz=0,m=0;
  for(const d of keys){const x=days[d]||{};n+=x.n||0;pz+=x.p||0;m+=x.m||0;const [Y,M,D]=d.split('-');rows.push([D+'.'+M+'.'+Y,x.n||0,x.p||0,eur(x.m)]);}
  rows.push(['Kokku',n,pz,eur(m)]);
  const csv='﻿'+rows.map(r=>r.join(';')).join('\r\n')+'\r\n';
  const loc=(document.querySelector('.pp114-location')?.textContent||'pizzeria').trim().toLowerCase().replace(/[^a-z0-9õäöü]+/g,'-');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download='peetri-'+loc+'-'+(j.from||'')+'-'+(j.to||'')+'.csv';document.body.append(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);
 }
 window.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('#pp1751-csv');if(!b)return;e.preventDefault();e.stopPropagation();download();},true);
 let q=false;const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;try{button()}catch(_){}});};
 try{const s=document.getElementById('statisticsPage');if(s)new MutationObserver(later).observe(s,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});}catch(_){}
 setInterval(later,4000);setTimeout(later,800);
 // phone: real header height for the sticky bars below it (ops-v1751.css)
 const hh=()=>{const h=document.querySelector('header.topbar');if(h)document.documentElement.style.setProperty('--pp1751-hh',h.offsetHeight+'px');};
 try{const h=document.querySelector('header.topbar');if(h&&window.ResizeObserver)new ResizeObserver(hh).observe(h);}catch(_){}
 window.addEventListener('resize',hh);setTimeout(hh,500);
 window.PP1751={download};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1754.js == */
try{(function(){
/* Peetri Pizza v17.54 — owner, 12.11.2026:
 * 1) toppings: not wanted = red "−", added = green "+" (ops-v1728 already sorts chips into pp1728-minus / pp1728-plus;
 *    17.41 CSS had hidden the signs). Here: "Ilma: sibul" (from api/live-normalize) → "SIBUL" in a red "−" chip, "ILMA JUUSTUTA" → "JUUST".
 * 2) Ooteaeg in the header: "−" and "+" step through the same select (pp158-wait-select) that ops-v1722 uses. */
(function(){
 'use strict';
 if(window.PP1754)return;
 const $=id=>document.getElementById(id);
 function extras(root){
  // "+ LISA" extras sat in their own grid cell (squeezed under the qty); put them next to the other chips as green "+".
  for(const x of (root||document).querySelectorAll('#ordersPage .pp177-extras:not(.pp1754-moved)')){
   const host=x.parentElement;if(!host)continue;
   let mods=host.querySelector(':scope>.pp177-mods');
   if(!mods){mods=document.createElement('span');mods.className='pp94-specs pp177-mods';x.before(mods);}
   for(const e of x.querySelectorAll('em')){const c=document.createElement('em');c.className='pp177-mod pp1728-plus';c.dataset.pp1754='1';c.textContent=(e.textContent||'').trim();if(c.textContent)mods.append(c);}
   x.classList.add('pp1754-moved');
  }
 }
 function chips(root){
  try{extras(root)}catch(_){}
  for(const m of (root||document).querySelectorAll('.pp177-mod:not([data-pp1754])')){
   const t=(m.textContent||'').trim();
   let x=t.match(/^(ilma|without)\s*:\s*(.+)$/i);
   if(x){m.textContent=x[2].trim();m.classList.add('pp1728-minus');m.classList.remove('pp1728-plus');}
   else if(/^ilma juustuta$/i.test(t)){m.textContent='Juust';m.classList.add('pp1728-minus');m.classList.remove('pp1728-plus');}
   else if((x=t.match(/^(lisa|extra)\s*:\s*(.+)$/i))){m.textContent=x[2].trim();m.classList.add('pp1728-plus');m.classList.remove('pp1728-minus');}
   m.dataset.pp1754='1';
  }
 }
 // Ooteaeg − / +
 const sel=()=>$('pp158-wait-select')||$('pp114-wait-select');
 function mountWait(){
  // − and + sit right next to the Ooteaeg button (ops-v1722 may move that button, so re-place them when needed)
  const w=$('pp1722-wait');if(!w||!w.parentNode)return;
  const mk=(id,t,l)=>{let b=$(id);if(!b){b=document.createElement('button');b.type='button';b.id=id;b.className='pp1754-wstep';b.textContent=t;b.setAttribute('aria-label',l);}return b;};
  const mi=mk('pp1754-wminus','−','Ooteaeg vähem'),pl=mk('pp1754-wplus','+','Ooteaeg rohkem');
  if(w.previousElementSibling!==mi)w.before(mi);
  if(w.nextElementSibling!==pl)w.after(pl);
  w.classList.add('pp1754-wmid');
 }
 function step(d){
  const s=sel();if(!s)return;const i=s.selectedIndex+d;if(i<0||i>=s.options.length)return;
  s.selectedIndex=i;s.dispatchEvent(new Event('change',{bubbles:true}));
  const o=s.options[i];const v=$('pp1722-wait-v');if(v&&o)v.textContent=o.textContent.trim();
  try{window.toast?.('Ooteaeg '+s.value+' min')}catch(_){}
 }
 window.addEventListener('click',e=>{
  const b=e.target instanceof Element&&e.target.closest('#pp1754-wminus,#pp1754-wplus');if(!b)return;
  e.preventDefault();e.stopPropagation();step(b.id==='pp1754-wplus'?1:-1);
 },true);
 // Väljastus block on the main screen: only when something waits
 function pickup(){
  const q=$('pp158-pickup-quick');if(!q)return;
  const n=document.querySelectorAll('#pp1711-pickup article').length;
  q.classList.toggle('pp1754-empty',n===0);
 }
 let queued=false;const later=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{chips()}catch(_){}try{mountWait()}catch(_){}try{pickup()}catch(_){}});};
 const go=()=>{later();try{new MutationObserver(later).observe(document.body,{childList:true,subtree:true});}catch(_){}};
 window.addEventListener('pp145:orders',later);
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
 window.PP1754={chips,step};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1755.js == */
try{(function(){
/* Peetri Pizza v17.55 — owner: "Valmis" out of the header. The header button (#pp171-ready, ops-v171) stays hidden in place;
 * the menu gets "Valmis" that presses it, so the finished-orders view is still one tap away. */
(function(){
 'use strict';
 if(window.PP1755)return;
 const $=id=>document.getElementById(id);
 function mount(){
  const nav=document.querySelector('#drawer nav');if(!nav||$('pp1755-ready-nav')||!$('pp171-ready'))return;
  const b=document.createElement('button');b.type='button';b.id='pp1755-ready-nav';b.className='navitem';b.innerHTML='<span aria-hidden="true">✓</span> Valmis';
  const st=nav.querySelector('[data-page="statistics"]');st?st.after(b):nav.append(b);
 }
 window.addEventListener('click',e=>{
  if(!(e.target instanceof Element)||!e.target.closest('#pp1755-ready-nav'))return;
  e.preventDefault();e.stopPropagation();$('closeDrawer')?.click();setTimeout(()=>$('pp171-ready')?.click(),60);
 },true);
 const go=()=>{mount();let n=0;const t=setInterval(()=>{mount();if(++n>20||$('pp1755-ready-nav'))clearInterval(t);},500);};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
 window.PP1755={mount};
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1758.js == */
try{(function(){
/* Peetri Pizza v17.58 — owner: «сделай все красиво строго и интуитивно».
   2) the "Uus tellimus" strip hides itself after 10 s (shows again when another new order arrives);
   5) the ⓘ button is hidden, so tapping the customer name or order number opens the details instead. */
(()=>{
 'use strict';
 if(window.pp1758)return;window.pp1758=true;
 /* ---------- 2: strip goes away by itself ---------- */
 let lastKey='',timer=0;
 function watchStrip(box){
  const check=()=>{
   if(box.hidden){lastKey='';clearTimeout(timer);box.classList.remove('pp1758-gone');return;}
   const key=[...box.querySelectorAll('strong,small')].map(e=>e.textContent).join('|');
   if(key===lastKey)return;
   lastKey=key;box.classList.remove('pp1758-gone');clearTimeout(timer);
   timer=setTimeout(()=>box.classList.add('pp1758-gone'),10000);
  };
  new MutationObserver(check).observe(box,{childList:true,attributes:true,attributeFilter:['hidden']});check();
 }
 const findStrip=()=>{const b=document.getElementById('pp179-new');if(b){watchStrip(b);return true}return false};
 if(!findStrip()){let n=0;const t=setInterval(()=>{if(findStrip()||++n>40)clearInterval(t)},500);}

 /* ---------- 5: name / number opens details ---------- */
 window.addEventListener('click',e=>{
  const hit=e.target.closest&&e.target.closest('#ordersPage .ordercard .pp1733-name, #ordersPage .ordercard .order-number');
  if(!hit)return;
  const btn=hit.closest('.ordercard').querySelector('.pp1741-det,[data-action="details"]');
  if(!btn)return;
  e.preventDefault();e.stopPropagation();btn.click();
 },true);
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1763.js == */
try{(function(){
/* Peetri Pizza v17.63 (+17.65 tablet paging: two columns visible, swipe or edge button for Valmis) — owner: ready orders (Valmis / Väljastus) in two ways, chosen in Seaded → Köök:
   "All" (as before, block under the columns) or "Veerg" (third column next to Uued / Valmistamisel;
   on a phone a third tab "Valmis" next to the Uued / Valmistamisel switch).
   Moves the existing #pp157-ready-section node only; its own scripts keep working on it. Per tablet (localStorage). */
(()=>{
 'use strict';
 if(window.pp1763)return;window.pp1763=true;
 const KEY='pp1763-valmis';
 const read=()=>{try{return localStorage.getItem(KEY)==='col'?'col':'bottom'}catch(_){return 'bottom'}};
 const save=v=>{try{localStorage.setItem(KEY,v)}catch(_){}};
 let mode=read(),col=null,home=null;
 const page=document.getElementById('ordersPage');

 function place(){
  const ready=document.getElementById('pp157-ready-section');
  const cols=page&&page.querySelector('.columns');
  if(!ready||!cols)return false;
  if(!home){home=document.createComment('pp1763-home');ready.before(home);}
  if(mode==='col'){
   if(!col){col=document.createElement('div');col.className='ordercol pp1763-col-ready';}
   if(col.parentElement!==cols)cols.append(col);
   if(ready.parentElement!==col)col.append(ready);
  }else{
   if(home.parentNode&&ready.previousSibling!==home)home.after(ready);
   col?.remove();
   if(page.dataset.pp109Tab==='ready')page.querySelector('[data-pp109-tab="new"]')?.click();
  }
  document.documentElement.classList.toggle('pp1763-col',mode==='col');
  if(mode!=='col'&&typeof setPage==='function')setPage(false);
  tabs();if(typeof edge==='function')edge();
  return true;
 }

 /* phone: third tab next to Uued / Valmistamisel */
 function tabs(){
  const bar=page&&page.querySelector('.pp109-mobile-tabs');if(!bar)return;
  let b=bar.querySelector('.pp1763-tab');
  if(mode!=='col'){b?.remove();bar.classList.remove('pp1763-3');return;}
  if(!b){b=document.createElement('button');b.type='button';b.className='pp1763-tab';b.setAttribute('aria-pressed','false');b.innerHTML='Valmis <b id="pp1763-tab-n">0</b>';bar.append(b);}
  bar.classList.add('pp1763-3');
  const n=document.getElementById('pp158-pickup-count');const t=document.getElementById('pp1763-tab-n');
  if(t){const v=document.querySelectorAll('#pp158-pickup-rows .pp158-pickup-row').length||Number(n?.textContent)||0;if(t.textContent!==String(v))t.textContent=String(v);}
 }
 window.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('.pp1763-tab');
  if(b){e.preventDefault();e.stopPropagation();page.dataset.pp109Tab='ready';
   page.querySelectorAll('.pp109-mobile-tabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));return;}
  if(e.target.closest&&e.target.closest('[data-pp109-tab]'))page.querySelector('.pp1763-tab')?.setAttribute('aria-pressed','false');
 },true);

 /* Seaded → Köök: the switch */
 function settingsRow(){
  if(document.getElementById('pp1763-row'))return;
  const anchor=document.getElementById('pp1738-row');if(!anchor)return;
  const d=document.createElement('div');d.className='settingsrow';d.id='pp1763-row';
  d.innerHTML='<div><strong>Valmis tellimused</strong></div><div class="pp1763-seg" role="group" aria-label="Valmis tellimused"><button type="button" data-v="bottom">All</button><button type="button" data-v="col">Kolmas veerg</button></div>';
  anchor.after(d);paint();
  d.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b)return;mode=b.dataset.v;save(mode);paint();place();});
 }
 function paint(){document.querySelectorAll('#pp1763-row [data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===mode)));}

 /* v17.65 tablet: only two columns fit; the third (Valmis) slides in by swipe or the edge button */
 const wide=()=>window.matchMedia('(min-width:761px)').matches;
 let p2=false;
 function setPage(v){p2=!!v&&mode==='col'&&wide();document.documentElement.classList.toggle('pp1763-p2',p2);edge();}
 function edge(){
  let b=document.getElementById('pp1763-edge');
  const on=mode==='col'&&wide()&&page&&page.classList.contains('active');
  if(!on){if(b)b.hidden=true;return;}
  if(!b){b=document.createElement('button');b.type='button';b.id='pp1763-edge';document.body.append(b);
   b.addEventListener('click',e=>{e.preventDefault();setPage(!p2);});}
  b.hidden=false;
  const n=document.querySelectorAll('#pp158-pickup-rows .pp158-pickup-row').length;
  const html=p2?'‹ <span>Uued</span>':'<span>Valmis</span> <b>'+n+'</b> ›';
  if(b.innerHTML!==html)b.innerHTML=html;b.classList.toggle('pp1763-back',p2);
 }
 let sx=0,sy=0,st=0;
 window.addEventListener('touchstart',e=>{const m=e.target.closest&&e.target.closest('#pp157-columns-mount');if(!m||mode!=='col'||!wide()){st=0;return;}const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();},{capture:true,passive:true});
 window.addEventListener('touchend',e=>{if(!st)return;const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy;st=0;
  if(Math.abs(dx)>70&&Math.abs(dx)>2*Math.abs(dy)){if(dx<0&&!p2)setPage(true);else if(dx>0&&p2)setPage(false);}},{capture:true,passive:true});
 window.addEventListener('resize',()=>{if(!wide())setPage(false);edge();});
 setInterval(edge,1500);
 let n=0;const t=setInterval(()=>{settingsRow();if(place()&&document.getElementById('pp1763-row')||++n>40)clearInterval(t);},500);
 setInterval(()=>{if(mode==='col')place();},2000); // ready block may be re-created; keep it in the column and the tab count fresh
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/ops-v1766.js == */
try{(function(){
/* Peetri Pizza v17.66 — 5: "N pitsat" chip on Valmis / Väljastus cards (main cards already have it from app-core).
   Counts quantities of lines that have a size code (= pizzas); drinks and sauces are not counted. */
(()=>{
 'use strict';
 if(window.pp1766)return;window.pp1766=true;
 function tag(){
  for(const c of document.querySelectorAll('.pp112-done-card')){
   let n=0;
   for(const li of c.querySelectorAll('.pp112-product')){if(!li.querySelector('.pp177-code'))continue;n+=parseInt(li.querySelector('.pp112-qty')?.textContent,10)||1;}
   let chip=c.querySelector('.pp1766-pz');
   if(!n){chip?.remove();continue;}
   const txt=n+(n===1?' pitsa':' pitsat');
   if(!chip){const box=c.querySelector('.pp112-card-identity>div');if(!box)continue;chip=document.createElement('span');chip.className='pp1766-pz';box.append(chip);} // at the end: keeps .pp1730-chips+.pp1730-chips hiding intact
   if(chip.textContent!==txt)chip.textContent=txt;
  }
 }
 setInterval(tag,1200);setTimeout(tag,400);
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
/* == assets/boot-v170.js == */
try{(function(){
/* Peetri Pizza v17.0 — stable navigation and first-paint gate.
 * Does not poll LIVE, touch kitchen statuses, or create UI overlays.
 */
(()=>{'use strict';
const doc=document, root=doc.documentElement;
let finished=false;
function reveal(){if(finished)return;finished=true;root.classList.remove('pp170-booting');}
// Never leave a kitchen screen hidden indefinitely, even after a failed script.
const watchdog=setTimeout(reveal,3000);
function ready(){
 requestAnimationFrame(()=>requestAnimationFrame(()=>{clearTimeout(watchdog);reveal();}));
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.addEventListener('pageshow',()=>{clearTimeout(watchdog);reveal();},{once:true});
})();
}).call(window);}catch(e){setTimeout(function(){throw e},0);}
