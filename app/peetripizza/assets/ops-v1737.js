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
