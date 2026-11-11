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
