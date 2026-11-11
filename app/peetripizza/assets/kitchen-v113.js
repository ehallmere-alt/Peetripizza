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
