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
