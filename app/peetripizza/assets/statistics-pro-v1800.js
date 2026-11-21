
(()=>{
'use strict';

function init(){
 const page=document.getElementById('statisticsPage');
 const panel=page?.querySelector('.panel');
 if(!panel || document.getElementById('pp1800-dashboard'))return;

 const root=document.createElement('section');
 root.id='pp1800-dashboard';
 root.setAttribute('aria-label','Serveri statistika');

 root.innerHTML=`
  <div class="sp-hero">
   <div>
    <span class="sp-eyebrow">PEETRI PIZZA · ANALYTICS</span>
    <h3>Statistika ülevaade</h3>
    <p>Valitud pizzeria kogutud andmed</p>
   </div>
   <div class="sp-periods" role="group" aria-label="Periood">
    <button type="button" data-period="today" aria-pressed="true">Täna</button>
    <button type="button" data-period="yesterday" aria-pressed="false">Eile</button>
    <button type="button" data-period="7d" aria-pressed="false">7 päeva</button>
    <button type="button" data-period="month" aria-pressed="false">Kuu</button>
   </div>
  </div>
  <div class="sp-kpis">
   <article class="sp-kpi"><small>Tellimusi</small><strong id="sp-orders">—</strong></article>
   <article class="sp-kpi"><small>Pitsasid</small><strong id="sp-pizzas">—</strong></article>
   <article class="sp-kpi"><small>Käive*</small><strong id="sp-revenue">—</strong></article>
   <article class="sp-kpi"><small>Keskmine ost*</small><strong id="sp-average">—</strong></article>
  </div>
  <div class="sp-grid">
   <section class="sp-panel">
    <h4 id="sp-chart-title">Tellimused tundide järgi</h4>
    <div id="sp-chart" class="sp-bars" role="img" aria-label="Tellimuste graafik"></div>
   </section>
   <section class="sp-panel">
    <h4>Populaarsemad pitsad</h4>
    <div id="sp-rank" class="sp-rank"></div>
   </section>
  </div>
  <p id="sp-state" class="sp-message" role="status" aria-live="polite"></p>
  <p class="sp-note">* Käive ja keskmine ost põhinevad ainult tellimustel, mille summad on salvestatud. Varasemad andmed võivad olla puudulikud.</p>
 `;

 panel.prepend(root);

 const $=id=>root.querySelector('#'+id);
 const euro=c=>(Number(c)/100).toLocaleString(
  'et-EE',{style:'currency',currency:'EUR'}
 );
 const integer=v=>Math.max(0,Math.floor(Number(v)||0));
 const number=v=>integer(v).toLocaleString('et-EE');

 let revision=0;
 let controller=null;

 function bars(values,labels){
  const box=$('sp-chart');
  box.replaceChildren();
  const max=Math.max(1,...values);
  values.forEach((raw,index)=>{
   const v=integer(raw);
   const item=document.createElement('div');
   item.className='sp-bar';
   item.title=labels[index]+' · '+v+' tellimust';

   const bar=document.createElement('i');
   bar.style.height=(v?Math.max(3,Math.round(v/max*145)):2)+'px';

   const label=document.createElement('b');
   label.textContent=labels[index];

   item.append(bar,label);
   box.append(item);
  });
  box.setAttribute('aria-label',
    'Tellimusi kokku '+number(values.reduce((a,b)=>a+integer(b),0))
  );
 }

 function ranking(data){
  const box=$('sp-rank');
  box.replaceChildren();
  const entries=Object.entries(
   data && typeof data==='object' ? data : {}
  ).filter(([name,value])=>name && integer(value)>0)
   .sort((a,b)=>integer(b[1])-integer(a[1])).slice(0,5);

  if(!entries.length){
   box.textContent='Pitsade andmed puuduvad.';
   return;
  }

  const max=integer(entries[0][1])||1;
  entries.forEach(([name,value])=>{
   const row=document.createElement('div');
   row.className='sp-rank-item';

   const title=document.createElement('span');
   title.textContent=name;

   const count=document.createElement('strong');
   count.textContent=number(value)+'×';

   const track=document.createElement('div');
   track.className='sp-track';

   const fill=document.createElement('i');
   fill.style.width=(integer(value)/max*100)+'%';
   track.append(fill);
   row.append(title,count,track);
   box.append(row);
  });
 }

 async function load(period){
  const seq=++revision;
  if(controller)controller.abort();
  controller=new AbortController();

  $('sp-state').textContent='Laadin andmeid…';

  try{
   const response=await fetch(
    'api/kitchen-analytics.php?period='+encodeURIComponent(period),
    {
     method:'GET',
     credentials:'same-origin',
     cache:'no-store',
     signal:controller.signal,
     headers:{Accept:'application/json'}
    }
   );

   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(!data || data.ok!==true || !data.report){
    throw Error('Andmed pole saadaval');
   }
   if(seq!==revision)return;

   const r=data.report;
   $('sp-orders').textContent=number(r.orders);
   $('sp-pizzas').textContent=number(r.pizzas);

   const moneyOrders=integer(r.amount_orders);
   $('sp-revenue').textContent=moneyOrders?euro(r.amount_cents):'—';
   $('sp-average').textContent=moneyOrders && r.avg_check_cents!=null
    ?euro(r.avg_check_cents):'—';

   if(period==='today' || period==='yesterday'){
    const hours=Array.isArray(r.hours)?r.hours:[];
    const values=Array.from({length:24},(_,i)=>integer(hours[i]));
    const label=Array.from({length:24},(_,i)=>String(i).padStart(2,'0'));
    $('sp-chart-title').textContent='Tellimused tundide järgi';
    bars(values,label);
   }else{
    const days=r.days && typeof r.days==='object'?r.days:{};
    const entries=Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0]));
    const recent=entries.slice(-31);

    $('sp-chart-title').textContent='Tellimused päevade järgi';
    if(recent.length){
     bars(
      recent.map(([,v])=>integer(v?.n)),
      recent.map(([date],i)=>(
       recent.length>14 && i%3!==0 ? '' : date.slice(5)
      ))
     );
    }else{
     $('sp-chart').replaceChildren();
     $('sp-chart').textContent='Andmed puuduvad.';
    }
   }

   ranking(r.top);
   $('sp-state').textContent=
    'Serveri andmed · '+number(r.orders)+' tellimust valitud perioodil';

  }catch(e){
   if(seq!==revision || e.name==='AbortError')return;
   for(const id of ['sp-orders','sp-pizzas','sp-revenue','sp-average']){
    $(id).textContent='—';
   }
   $('sp-chart').replaceChildren();
   $('sp-rank').replaceChildren();
   $('sp-state').textContent=
    'Serveri statistika pole saadaval ('+e.message+'). Alumine kohalik ülevaade jääb alles.';
  }
 }

 root.querySelectorAll('[data-period]').forEach(button=>{
  button.addEventListener('click',()=>{
   root.querySelectorAll('[data-period]').forEach(b=>{
    b.setAttribute('aria-pressed',
      String(b===button)
    );
   });
   load(button.dataset.period);
  });
 });

 load('today');
}

if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
 init();
}
})();
