/* v15.5. A separate internal status layer, never an upstream Peetri Pizza write. */
(()=>{'use strict';
const endpoint='api/kitchen-status.php';
const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
let records={},connected=false, busy=false, outstanding=new Set(),lastError='';
const enabled=()=>document.body.classList.contains('live-active');
const writable=()=>enabled()&&!document.body.classList.contains('live-connection-error')&&Number(window.pp155LiveFreshAt)>0&&(Date.now()-Number(window.pp155LiveFreshAt)<30000);
const stateRank={new:0,active:1,done:2};
const hud=document.createElement('div');hud.className='pp153-hud';hud.innerHTML='<div><strong>🔒 Köögisisene olek</strong><span id="pp153-connection" role="status">Ühenduse kontroll…</span></div><p>Siin märgitud <b>Valmistamisel / Valmis</b> salvestuvad meie serverisse ja sünkroonitakse töötajate vahel. <b>KLIENT EI NÄE NEID MUUDATUSI</b> enne ametliku API kirjutusõiguse ühendamist.</p><button type="button" id="pp153-refresh">↻ Värskenda köögi olekuid</button>';
document.getElementById('ordersPage')?.querySelector('.sourcebar')?.after(hud);
const statusNode=document.getElementById('pp153-connection');
function status(message,error=false){lastError=error?message:'';statusNode.textContent=message;statusNode.dataset.error=error?'yes':'no';}
function overlay(o){
 const orig=o.status,rec=records[o.id],local=rec?.status;
 if(!local||!Object.hasOwn(stateRank,local)||!Object.hasOwn(stateRank,orig))return {...o,officialStatus:orig};
 const effective=stateRank[local]>stateRank[orig]?local:orig;
 const internal=effective!==orig;
 return {...o,officialStatus:orig,status:effective,internalStatus:internal,
  completed:internal&&effective==='done'&&rec.ready_at?Date.parse(rec.ready_at)||o.completed:o.completed};
}
window.PPKitchenStatus={overlay, ready:()=>connected&&writable(), revision:id=>records[id]?.revision||0, get:id=>records[id], pull};
async function pull(updateView=true){if(busy)return false;busy=true;
 try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('HTTP '+response.status);const data=await response.json();
  if(!data.ok||!data.records||typeof data.records!=='object'||Array.isArray(data.records))throw new Error('Vigane vastus');
  const before=JSON.stringify(records);records=data.records;connected=true;
  status('● Serveriga ühendatud · töötajate vahel sünkroonis');
  if(updateView&&before!==JSON.stringify(records)&&enabled())window.pp153UpdateKitchenUI?.();
  return true;
 }catch(e){connected=false;status('⚠ Köögi olekusünkroon ei tööta ('+e.message+')',true);return false}
 finally{busy=false;}}
const refreshBtn=document.getElementById('pp153-refresh');refreshBtn?.addEventListener('click',()=>pull());
document.addEventListener('click',async e=>{
 const button=e.target.closest('button[data-kitchen-action]');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(!writable()){status('⚠ LIVE pole aktiivne või tellimuste andmed on aegunud. Muudatust ei salvestatud.',true);return;}
 const id=button.dataset.id,next=button.dataset.kitchenAction;
 if(!id||!/^live-[a-f0-9]{24}$/.test(id)||!['active','done'].includes(next))return;
 if(!connected){status('⚠ Ühendus puudub: muudatust ei salvestatud',true);return;}
 if(outstanding.has(id))return;
 if(next==='done'&&!confirm('Kas tellimus on valmis? See muudab ainult KÖÖGI olekut, mitte kliendi tellimust.'))return;
 if(next==='active'&&records[id]?.status==='done'&&!confirm('Tühistada valmis märge? Ainult köögi olek muutub.'))return;
 const raw=window.pp153RawLiveOrders?.find(o=>o.id===id);
 if(!raw){status('⚠ Tellimust ei leitud',true);return;}
 outstanding.add(id);button.disabled=true;button.dataset.pp155Saving='yes';button.textContent='⌛ Salvestan…';
 try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({id,status:next,official_status:raw.status,expected_revision:records[id]?.revision||0})});
  const data=await response.json();
  if(!response.ok){if(response.status===409&&data.records){records=data.records;window.pp153UpdateKitchenUI?.();throw new Error('Teine töötaja muutis tellimust. Andmed värskendatud.')}throw new Error(data.error||'HTTP '+response.status);}
  records=data.records;status('● Salvestatud köögi serverisse · kliendile EI SAADETA');window.pp153UpdateKitchenUI?.();window.dispatchEvent(new CustomEvent('pp155:status-saved',{detail:{id,status:next}}));
 }catch(error){await pull(false);status('⚠ Muudatuse vastus puudub või ebaõnnestus: '+error.message+'. Serveri olek kontrollitud; vajadusel vaata uuesti.',true);button.disabled=false;}
 finally{outstanding.delete(id);delete button.dataset.pp155Saving;window.pp153UpdateKitchenUI?.();}
},true);
window.addEventListener('pp150:live-stopped',()=>{hud.hidden=true});
window.addEventListener('pp150:live-synced',()=>{hud.hidden=false});
setInterval(()=>{if(enabled()&&!document.hidden)pull(true)},5000);
window.addEventListener('focus',()=>{if(enabled())pull(true)});
hud.hidden=true;
})();
