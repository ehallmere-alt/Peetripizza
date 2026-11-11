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
   tile('Keskmine valmimisaeg',avg==null?'—':avg+' min',src==='LIVE'?'Võta vastu → Valmis':'arvutatakse LIVE režiimis')+tile('Hilinenud',late,'valmis pärast tähtaega')+'</div>';
  if(box.innerHTML!==html)box.innerHTML=html;
  return true;
 }
 window.addEventListener('pp145:orders',()=>{if($('statisticsPage')?.classList.contains('active'))summary();});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="statistics"],#pp171-stats'))setTimeout(summary,50);});

 /* ---------- start ---------- */
 function start(){lockRow();placeBadge();every(60000,loadSite)();every(60000,summary)();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
