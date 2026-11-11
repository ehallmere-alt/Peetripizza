/* Peetri Pizza v16.8: Settings-only internal action history + modal-only 80mm ticket. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=null;
window.addEventListener('pp168:details-opened',e=>{const d=e.detail;if(d&&typeof d.id==='string')current=d;});
$('pp168-print-order')?.addEventListener('click',()=>{
 if(!current||!Array.isArray(current.items)){alert('Tellimuse andmed pole saadaval.');return;}
 if(window.PPPrint169&&typeof window.PPPrint169.printManual==='function'){window.PPPrint169.printManual(current);return;}
 const w=window.open('','_blank','width=440,height=700');
 if(!w){alert('Luba printimiseks hüpikaknad.');return;}
 const when=Number.isFinite(current.created)&&current.created>0?new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Tallinn'}).format(new Date(current.created)):'—';
 const status={new:'Uus',active:'Valmistamisel',done:'Valmis'}[current.status]||'—';
 const items=current.items.slice(0,80).map(item=>`<div class="line"><b>${esc(Number(item[1])||0)} ×</b><span>${esc(item[0])}</span></div>`).join('')||'<p>Tooted puuduvad — kontrolli originaali.</p>';
 const title='PEETRI PIZZA · KÖÖGI TELLIMUS';
 const html=`<!doctype html><html lang="et"><head><meta charset="utf-8"><title>${title}</title><style>@page{size:80mm auto;margin:3mm}html,body{margin:0;padding:0;background:white;color:#111;font:12px/1.35 Arial,sans-serif}main{max-width:74mm;margin:0 auto;padding:2mm 0}h1{font-size:16px;text-align:center;margin:0}h2{font-size:22px;text-align:center;margin:6px 0}p{margin:4px 0}.rule{border-top:1px dashed #222;margin:9px 0}.line{display:flex;gap:8px;margin:7px 0;overflow-wrap:anywhere}.line b{min-width:32px}.note{font-size:13px;font-weight:bold;white-space:pre-wrap;overflow-wrap:anywhere}small{color:#555}button{display:none}@media screen{body{padding:14px}main{border:1px dashed #aaa;padding:10px}}</style></head><body><main><h1>${title}</h1><h2>#${esc(current.number)}</h2><p>${esc(when)}</p><p><b>Klient:</b> ${esc(current.customer||'—')}</p><p><b>Olek:</b> ${esc(status)}</p><p><b>Teenindus:</b> ${current.serving==='delivery'?'Kohaletoimetamine':'Kaasa'}</p><div class="rule"></div>${items}<div class="rule"></div>${current.note?`<p><b>KLIENDI MÄRKUS</b></p><p class="note">${esc(current.note)}</p><div class="rule"></div>`:''}<small>Köögi sisemine väljatrükk · ei saada kliendile ega Peetri Pizza API-le.</small></main></body></html>`;
 w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(_){}},300);
});
$('pp168-load-history')?.addEventListener('click',async()=>{
 const btn=$('pp168-load-history'),msg=$('pp168-history-message'),list=$('pp168-history');if(!btn||!msg||!list)return;
 btn.disabled=true;msg.textContent='Laadin köögitoiminguid…';list.replaceChildren();
 try{
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),10000);let response;
  try{response=await fetch('api/kitchen-history.php?limit=60',{cache:'no-store',credentials:'same-origin',signal:c.signal,headers:{Accept:'application/json'}});}finally{clearTimeout(timer);}
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();if(!data.ok||!Array.isArray(data.events))throw Error('Vigane vastus');
  if(!data.events.length){msg.textContent='Selle pizzeria sisemiste olekute muudatusi veel ei ole.';return;}
  const names={new:'Uus',active:'Valmistamisel',done:'Valmis'};
  const group=document.createElement('div');group.style.marginTop='10px';group.style.display='grid';group.style.gap='8px';
  for(const ev of data.events){
   const row=document.createElement('div');row.style.cssText='padding:10px 12px;border:1px solid #e5eae6;border-radius:9px;font-size:13px';
   const date=document.createElement('small');date.textContent=ev.at?new Date(ev.at).toLocaleString('et-EE',{timeZone:'Europe/Tallinn'}):'—';
   const line=document.createElement('div');line.style.fontWeight='600';line.textContent=(ev.order||'Tellimus')+' · '+(names[ev.from]||ev.from)+' → '+(names[ev.to]||ev.to);
   const actor=document.createElement('small');actor.textContent='Märkis: '+(ev.actor||'Köök')+(ev.revision?' · rev '+ev.revision:'');
   row.append(date,line,actor);group.appendChild(row);
  }
  list.appendChild(group);msg.textContent='Viimased '+data.events.length+' sisemist köögitoimingut. Ei sisalda ametliku süsteemi toiminguid.';
 }catch(e){msg.textContent='Ajalugu ei õnnestunud laadida. Kontrolli sisselogimist ja serverit.';}
 finally{btn.disabled=false;}
});
})();
