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
