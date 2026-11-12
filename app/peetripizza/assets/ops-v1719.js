/* Peetri Pizza v17.19 — Statistika, owner's order: first the report (Täna / Eile / See kuu / Eelmine kuu / Kogu aeg),
 * then charts and statistics. LIVE numbers come from api/kitchen-analytics.php (daily totals kept on our server);
 * DEMO numbers are counted from the orders on screen. Nothing is sent to peetripizza.ee. No customer data, no staff.
 */
(function(){
 'use strict';
 if(window.PP1719)return;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const csrf=()=>document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
 const liveOn=()=>document.body.classList.contains('live-active');
 const read=(k,f)=>{try{const v=localStorage.getItem(k);return v==null?f:v}catch(_){return f}};
 const write=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};
 const eur=c=>c==null?'—':(c/100).toLocaleString('et-EE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
 const min=v=>v==null?'—':String(v).replace('.',',')+' min';
 const tz='Europe/Tallinn';
 const ymd=d=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const PERIODS=[['today','Täna'],['yesterday','Eile'],['month','See kuu'],['lastmonth','Eelmine kuu'],['all','Kogu aeg']];
 let period=read('pp1719-period','today');if(!PERIODS.some(p=>p[0]===period))period='today';
 let data=null,busy=false,at=0;

 /* ---------- what one order gives to the statistics (no customer data) ---------- */
 function facts(o){
  const parse=window.PPOrderInfo?.parse;const z={};let p=0;
  for(const it of (Array.isArray(o.items)?o.items:[])){
   const raw=String(it[0]||''),q=Math.max(0,Math.min(499,Math.round(Number(it[1])||0)));if(!q)continue;
   const main=raw.split(' — ')[0];const pizza=/\((large|small|family|medium)\)\s*$/i.test(main);
   const name=(parse?parse(raw).name:main).replace(/\s*\((large|small|family|medium)\)\s*$/i,'').trim().slice(0,60);
   if(pizza)p+=q;if(name)z[name]=(z[name]||0)+q;
  }
  const m=Number(o.amount);
  return {m:Number.isFinite(m)&&m>=0?Math.round(m*100):undefined,s:o.dineIn?'h':o.serving==='delivery'?'d':'k',p,z};
 }
 let lastSync=0;
 async function sync(force){
  if(!liveOn()||(!force&&Date.now()-lastSync<5*60000))return;lastSync=Date.now();
  const list=(window.pp153RawLiveOrders||[]).filter(o=>o&&/^live-[a-f0-9]{24}$/.test(o.id||'')).slice(0,200).map(o=>Object.assign({id:o.id,number:String(o.number||'').replace(/[^A-Za-z0-9-]/g,'').slice(0,20),created:Number(o.created)||undefined,deadline:Number(o.deadline)||undefined},facts(o)));
  if(!list.length)return;
  try{await fetch('api/kitchen-analytics.php',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf(),Accept:'application/json'},body:JSON.stringify({action:'sync',orders:list})});}catch(_){}
 }
 window.addEventListener('pp150:live-synced',()=>sync(false));

 /* ---------- DEMO: same report from the orders on screen (today only) ---------- */
 function demoReport(){
  const snap=window.pp145LatestSnapshot;const list=(snap&&snap.orders)||[];const today=ymd(new Date());
  const r={demo:true,orders:0,amount_cents:0,amount_orders:0,pizzas:0,late:0,with_deadline:0,service:{k:0,d:0,h:0},hours:Array(24).fill(0),top:{},days:{}};
  let ps=0,pn=0;
  for(const o of list){if(!o.created||ymd(new Date(o.created))!==today)continue;
   const f=facts(o);r.orders++;if(f.m!=null){r.amount_cents+=f.m;r.amount_orders++;}r.pizzas+=f.p;r.service[f.s]++;
   r.hours[Number(new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',hourCycle:'h23'}).format(new Date(o.created)))]++;
   for(const [k,v] of Object.entries(f.z))r.top[k]=(r.top[k]||0)+v;
   if(o.completed&&o.completed>o.created){ps+=(o.completed-o.created)/60000;pn++;}
   if(o.deadline&&o.completed){r.with_deadline++;if(o.completed>o.deadline+60000)r.late++;}}
  r.avg_check_cents=r.amount_orders?Math.round(r.amount_cents/r.amount_orders):null;r.prep_avg=pn?Math.round(ps/pn*10)/10:null;r.total_avg=r.prep_avg;
  r.top=Object.fromEntries(Object.entries(r.top).sort((a,b)=>b[1]-a[1]).slice(0,10));r.days[today]={n:r.orders,m:r.amount_cents};
  return {ok:true,period:'today',from:today,to:today,report:r};
 }
 async function load(force){
  if(!liveOn()){data=period==='today'?demoReport():{demoOnly:true};render();return;}
  if(busy)return;if(!force&&data&&data.period===period&&!data.demoOnly&&Date.now()-at<60000){render();return;}
  busy=true;
  try{await sync(true);const r=await fetch('api/kitchen-analytics.php?period='+encodeURIComponent(period)+'&t='+Date.now(),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
   const j=await r.json();if(!r.ok||!j.ok||!j.report)throw new Error(j.error||('HTTP '+r.status));data=j;at=Date.now();}
  catch(e){data={error:e.message};}
  finally{busy=false;render();}
 }

 /* ---------- page ---------- */
 const fmtDay=d=>{const [y,m,dd]=String(d).split('-');return dd+'.'+m+'.'+y;};
 const monthName=d=>new Intl.DateTimeFormat('et-EE',{month:'long',year:'numeric',timeZone:tz}).format(new Date(d+'T12:00:00Z'));
 function title(d){
  if(!d||!d.from)return 'Aruanne';
  if(period==='today'||period==='yesterday')return 'Päevaaruanne · '+fmtDay(d.from);
  if(period==='month'||period==='lastmonth')return 'Kuuaruanne · '+monthName(d.from);
  return 'Kogu aeg'+(d.report&&d.report.first_day?' · alates '+fmtDay(d.report.first_day):'');
 }
 function mount(){
  let box=$('pp1719-stats');if(box)return box;
  const panel=document.querySelector('#statisticsPage .panel');if(!panel)return null;
  box=document.createElement('section');box.id='pp1719-stats';box.setAttribute('aria-label','Aruanne ja statistika');
  const tag=panel.querySelector('.section-tag');tag?tag.insertAdjacentElement('afterend',box):panel.prepend(box);
  document.documentElement.classList.add('pp1719-on');
  return box;
 }
 const tile=(l,v,h,c)=>'<div class="pp1719-tile'+(c?' '+c:'')+'"><small>'+esc(l)+'</small><strong>'+esc(v)+'</strong>'+(h?'<span>'+esc(h)+'</span>':'')+'</div>';
 function bars(entries,opts){
  const max=Math.max(1,...entries.map(e=>e[1]));
  return '<div class="pp1719-bars'+(opts&&opts.dense?' dense':'')+'" role="img" aria-label="'+esc(opts.label)+'">'+entries.map(([k,n])=>'<div class="pp1719-col'+(n&&n===max?' peak':'')+'" title="'+esc(k)+' · '+n+'">'+(n&&!(opts&&opts.dense)?'<b>'+n+'</b>':'')+'<i style="height:'+Math.round(n/max*92)+'%"></i><span>'+esc(opts.short?opts.short(k):k)+'</span></div>').join('')+'</div>';
 }
 function render(){
  const box=mount();if(!box)return;
  const tabs='<div class="pp1719-tabs" role="group" aria-label="Periood">'+PERIODS.map(([k,l])=>'<button type="button" data-pp1719="'+k+'" aria-pressed="'+(period===k)+'">'+l+'</button>').join('')+'</div>';
  let html='<div class="pp1719-head">'+tabs+'</div>';
  const d=data;
  if(!d)html+='<p class="pp1719-note">Laadin…</p>';
  else if(d.demoOnly)html+='<div class="pp1719-report"><p class="pp1719-note">DEMO režiimis on ainult „Täna“. Kuu ja kogu aja aruanne tuleb LIVE andmetest selle serveri kaudu.</p></div>';
  else if(d.error)html+='<div class="pp1719-report"><p class="pp1719-note">Aruannet ei õnnestunud laadida: '+esc(d.error)+'</p></div>';
  else{
   const r=d.report,latePct=r.with_deadline?Math.round(r.late/r.with_deadline*100):null,sv=r.service||{};
   html+='<div class="pp1719-report" id="pp1719-report"><div class="pp1719-report-head"><div><small>'+(r.demo?'DEMO · ':'')+'ARUANNE</small><h3>'+esc(title(d))+'</h3></div><button type="button" class="secondary" id="pp1719-print">🖨 Prindi</button></div>'
    +'<div class="pp1719-tiles">'+tile('Tellimusi',r.orders,'')+tile('Käive',eur(r.amount_cents),r.amount_orders&&r.amount_orders<r.orders?r.amount_orders+' tellimuse summa teada':'')
    +tile('Keskmine tšekk',eur(r.avg_check_cents),'')+tile('Pitsasid',r.pizzas||0,'')
    +tile('Keskmine valmimisaeg',min(r.prep_avg),r.demo?'tellimusest valmis':'Võta vastu → Valmis')
    +tile('Hilinenud',r.late,latePct==null?'tähtaeg teadmata':latePct+'% tähtajaga tellimustest',r.late?'bad':'')+'</div>'
    +'<div class="pp1719-service"><span>🛍 Kaasa <b>'+(sv.k||0)+'</b></span><span>🚗 Kulleriga <b>'+(sv.d||0)+'</b></span><span>🍽 Kohapeal <b>'+(sv.h||0)+'</b></span></div></div>';
   // charts
   const hours=r.hours||[];const used=hours.map((n,h)=>n?h:null).filter(h=>h!==null);const lo=Math.min(10,...used),hi=Math.max(22,...used);
   const hourEntries=[];for(let h=lo;h<=hi;h++)hourEntries.push([String(h).padStart(2,'0')+':00',hours[h]||0]);
   html+='<div class="pp1719-charts"><div class="pp1719-chart"><h4>Tellimused tunni järgi</h4>'+bars(hourEntries,{label:'Tellimused tunni järgi',short:k=>k.slice(0,2)})+'</div>';
   const dayKeys=Object.keys(r.days||{}).sort();
   if(period!=='today'&&period!=='yesterday'&&dayKeys.length){
    let entries;
    if(dayKeys.length>62){const byM={};for(const k of dayKeys){const m=k.slice(0,7);byM[m]=(byM[m]||0)+r.days[k].n;}entries=Object.entries(byM).map(([m,n])=>[m,n]);
     html+='<div class="pp1719-chart"><h4>Tellimused kuu järgi</h4>'+bars(entries,{label:'Tellimused kuu järgi',short:k=>k.slice(5)+'/'+k.slice(2,4)})+'</div>';}
    else{entries=dayKeys.map(k=>[k,r.days[k].n]);
     html+='<div class="pp1719-chart"><h4>Tellimused päeva järgi</h4>'+bars(entries,{label:'Tellimused päeva järgi',short:k=>String(Number(k.slice(8))),dense:entries.length>16})+'</div>';}
   }
   const top=Object.entries(r.top||{});
   if(top.length){const mx=Math.max(...top.map(t=>t[1]));
    html+='<div class="pp1719-chart"><h4>Populaarsemad tooted</h4><ol class="pp1719-top">'+top.map(([n,q])=>'<li><span>'+esc(n)+'</span><i style="width:'+Math.max(4,Math.round(q/mx*100))+'%"></i><b>'+q+'</b></li>').join('')+'</ol></div>';}
   html+='</div><p class="pp1719-note">'+(r.demo?'DEMO: arvutatud ekraanil olevatest tellimustest.':'LIVE: tellimused, mida see rakendus on näinud, ja köögi märked (Võta vastu, Valmis). Andmed hakkavad kogunema alates paigaldamisest; tühistatud tellimused võivad sees olla.')+' Töötajate kaupa ei mõõdeta.</p>';
  }
  if(box.innerHTML!==html)box.innerHTML=html;
 }

 /* ---------- print the report (80 mm, same way as order tickets) ---------- */
 function printReport(){
  const d=data;if(!d||!d.report)return;const r=d.report,sv=r.service||{};
  const top=Object.entries(r.top||{}).slice(0,10).map(([n,q])=>'<tr><td>'+esc(n)+'</td><td>'+q+'</td></tr>').join('');
  const html='<!doctype html><html lang="et"><head><meta charset="utf-8"><title>'+esc(title(d))+'</title><style>@page{size:80mm auto;margin:3mm}body{margin:0;font:13px/1.35 Arial,sans-serif;color:#000}main{max-width:72mm;margin:0 auto}h1{font-size:17px;margin:4px 0 8px;text-align:center}table{width:100%;border-collapse:collapse}td{padding:2px 0;border-bottom:1px dotted #000}td:last-child{text-align:right;font-weight:bold}h2{font-size:14px;margin:10px 0 4px}small{display:block;margin-top:10px;font-size:10px}</style></head><body><main>'
   +'<h1>PEETRI PIZZA<br>'+esc(title(d))+'</h1><table>'
   +[['Tellimusi',r.orders],['Käive',eur(r.amount_cents)],['Keskmine tšekk',eur(r.avg_check_cents)],['Pitsasid',r.pizzas||0],['Keskmine valmimisaeg',min(r.prep_avg)],['Hilinenud',r.late],['Kaasa',sv.k||0],['Kulleriga',sv.d||0],['Kohapeal',sv.h||0]].map(([a,b])=>'<tr><td>'+esc(a)+'</td><td>'+esc(b)+'</td></tr>').join('')
   +'</table>'+(top?'<h2>Populaarsemad tooted</h2><table>'+top+'</table>':'')+'<small>Köögi sisemine aruanne · '+esc(new Date().toLocaleString('et-EE',{timeZone:tz}))+'</small></main></body></html>';
  const w=window.open('','_blank','width=420,height=640');if(!w){window.toast?.('Brauser blokeeris printimise akna');return;}
  w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(_){}},250);
 }

 window.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-pp1719]');
  if(b){period=b.dataset.pp1719;write('pp1719-period',period);data=null;render();load(true);return;}
  if(e.target.closest?.('#pp1719-print')){printReport();return;}
  if(e.target.closest?.('[data-page="statistics"],[data-go="statistics"],#pp171-stats'))setTimeout(()=>load(false),120);
 },true);
 const open=()=>$('statisticsPage')?.classList.contains('active');
 window.addEventListener('pp145:orders',()=>{if(open()&&!liveOn()&&period==='today')setTimeout(()=>{data=demoReport();render();},0);});
 window.addEventListener('pp155:status-saved',()=>{if(open())setTimeout(()=>load(true),800);});
 // Seaded: mark the two groups without own class (CSS :has() also covers it on new Chrome).
 for(const id of ['pp74-settings-mode','resetDemo'])document.getElementById(id)?.closest('section.pp163-pref-group')?.classList.add('pp1719-hide');
 mount();if(open())load(false);
 window.PP1719={load,facts,demoReport,printReport};
})();
