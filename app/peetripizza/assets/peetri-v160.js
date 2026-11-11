/* Peetri Pizza Service App v16.0 — presentation/accessibility layer.
   Retains native order status, pickup, staff and LIVE request handlers; no vendor API writes. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const home=$('ordersPage')?.querySelector('.pp157-home-shell');
 if(!home || home.dataset.pp160Ready==='1')return;
 home.dataset.pp160Ready='1';document.body.classList.add('pp160-ui');
 const icon={
  chef:'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17V9a4 4 0 0 1 1.1-7.8 5 5 0 0 1 9.8 0A4 4 0 0 1 18 9v8"/><path d="M6 17h12v4H6z"/></svg>',
  live:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 8-8m8 8a8 8 0 0 1-8 8M7.5 12a4.5 4.5 0 0 1 4.5-4.5m4.5 4.5a4.5 4.5 0 0 1-4.5 4.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
  clock:'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  box:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4m-9 4v11m-4-13 9-4"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>',
  menu:'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
 };
 // Topbar: read-only state chips and a shortcut to the EXISTING operator dialog.
 const bar=document.querySelector('.topbar'), brand=bar?.querySelector('.brandgroup'), right=bar?.querySelector('.top-right');
 if(brand){
  const sub=document.createElement('div');sub.className='pp160-brand-sub';sub.innerHTML='<strong>TEENINDUS</strong><small>KÖÖGI TÖÖLAUD · v16</small>';
  brand.append(sub);
 }
 if(right){
  const live=document.createElement('span');live.className='pp160-live-chip';live.id='pp160-live-chip';live.dataset.state='demo';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.innerHTML='<i aria-hidden="true"></i><span>DEMO</span>';
  right.prepend(live);
  const totals=document.createElement('span');totals.className='pp160-top-totals';totals.title='Uued ja valmistamisel tellimused';
  totals.innerHTML='<span>Uued <b id="pp160-header-new">0</b></span><span>Töös <b id="pp160-header-active">0</b></span>';
  live.after(totals);
 }
 // Status is only labelled LIVE after a successful sync (not just an attempted connection).
 let liveConfirmed=false,liveError=false;
 function updateLive(){const chip=$('pp160-live-chip');if(!chip)return;
  const live=document.body.classList.contains('live-active');
  const state=liveError&&live?'error':live&&liveConfirmed?'live':live?'pending':'demo';
  if(chip.dataset.state===state&&chip.dataset.pp171Painted)return;chip.dataset.pp171Painted='1';
  chip.dataset.state=state;
  chip.querySelector('span').textContent=({live:'LIVE',pending:'ÜHENDAN',error:'ÜHENDUSE VIGA',demo:'DEMO'})[state];
  chip.setAttribute('aria-label',({live:'LIVE tellimused on sünkroonitud',pending:'LIVE tellimustega ühendamine',error:'LIVE ühendus katkes',demo:'Demorežiim'})[state]);
 }
 window.addEventListener('pp150:live-synced',()=>{liveConfirmed=true;liveError=false;updateLive()});
 window.addEventListener('pp150:live-failed',()=>{liveError=true;updateLive()});
 window.addEventListener('pp150:live-stopped',()=>{liveConfirmed=false;liveError=false;updateLive()});
 // Explicitly show that the original server is not written to by kitchen actions.
 const tagline=home.querySelector('.pp157-heading-left p');if(tagline)tagline.textContent='Uued tellimused · valmistamine · väljastamine';
 const kicker=home.querySelector('.pp157-heading-left .pp157-kicker');if(kicker)kicker.textContent='PEETRI PIZZA / SERVICE OS 16';
 const heading=home.querySelector('.pp157-heading-left h1');if(heading)heading.childNodes[0].textContent='Köögi töölaud ';
 const summary=document.createElement('p');summary.className='pp160-queue-note';summary.innerHTML=icon.clock+'<span id="pp160-queue-message">Tellimuste ülevaade on valmis</span>';
 home.querySelector('.pp157-list-header')?.append(summary);
 // Existing pickup-quick UI: show an actionable waiting summary, preserve delegated native POST.
 const pickup=$('pp158-pickup-quick');if(pickup){
  pickup.classList.add('pp160-pickup');
  const head=pickup.querySelector('.pp158-pickup-head>div:first-child');
  if(head){head.querySelector('.pp158-pickup-kicker').textContent='VÄLJASTUSKESKUS / 03';
   const title=head.querySelector('strong');if(title&&title.firstChild)title.firstChild.textContent='Klienti ootavad tellimused ';
  }
  const badge=document.createElement('span');badge.className='pp160-pickup-wait';badge.id='pp160-pickup-wait';badge.setAttribute('role','status');badge.textContent='Ootel: 0';
  pickup.querySelector('.pp158-pickup-actions')?.prepend(badge);
  const open=$('pp158-open-station');if(open){open.textContent='';open.insertAdjacentHTML('afterbegin',icon.box+'<span>Väljastus</span>');}
  const all=$('pp158-view-ready');if(all)all.textContent='Kõik valmis';
 }
 // Improve keyboard focus and semantics for the current native kitchen actions.
 const newOrders=$('newOrders'),activeOrders=$('activeOrders');
 let scheduled=false;
 const number=id=>{const text=$(id)?.textContent||'0';return Math.max(0,Number(text.match(/\d+/)?.[0]||0))};
 function paint(){scheduled=false;
  const n=number('pp157-total-new'),a=number('pp157-total-active'),urgent=number('pp157-total-urgent');
  if($('pp160-header-new')&&$('pp160-header-new').textContent!==String(n))$('pp160-header-new').textContent=String(n);
  if($('pp160-header-active')&&$('pp160-header-active').textContent!==String(a))$('pp160-header-active').textContent=String(a);
  const message=urgent?`${urgent} kiireloomulist · ${n} uut · ${a} töös`:`${n} uut · ${a} valmistamisel`;
  const status=$('pp160-queue-message');if(status&&status.textContent!==message)status.textContent=message;
  for(const col of [newOrders,activeOrders]){
   if(!col)continue;
   for(const card of col.querySelectorAll('.ordercard')){
    const timer=card.querySelector('.pp117-countdown');if(timer){
     const critical=card.classList.contains('urgency-late')?'late':card.classList.contains('urgency-soon')?'soon':'normal';
     if(timer.dataset.level!==critical)timer.dataset.level=critical;
     if(timer.getAttribute('role')!=='timer')timer.setAttribute('role','timer');
    }
    const action=card.querySelector('.cardfoot button[data-action],.cardfoot button[data-kitchen-action]');
    if(action&&!action.dataset.pp160Label){action.dataset.pp160Label='1';
     const orderNo=card.querySelector('.order-number')?.textContent||'';
     const label=(action.textContent||'').trim();action.setAttribute('aria-label',`${label} · tellimus ${orderNo}`.trim());
    }
   }
  }
  if(pickup){
   const waiting=number('pp158-pickup-count'),late=pickup.querySelectorAll('.pp158-pickup-row.pp158-pickup-late').length;
   const badge=$('pp160-pickup-wait');if(badge){const label=late?`Ootel: ${waiting} · ${late} kaua oodanud`:`Ootel: ${waiting}`;if(badge.textContent!==label)badge.textContent=label;badge.classList.toggle('is-late',late>0)}
   for(const row of pickup.querySelectorAll('.pp158-pickup-row')){
    const btn=row.querySelector('.pp158-handover');if(btn){btn.setAttribute('aria-label','Kinnita üleandmine · '+(row.querySelector('.pp158-pickup-person strong')?.textContent||'tellimus'));
     if(!btn.dataset.pp160Button){btn.dataset.pp160Button='1';btn.innerHTML=icon.check+'<span>Üle antud</span>';}
    }
   }
  }
  updateLive();
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint)}
 const pp171Tick='[data-timer],.prep-label,[data-pp110-priority],.pp117-countdown';
 // v17.1: the 1s countdown rewrites timer text only; skip those records, react to real list changes and urgency class changes.
 const pp171Meaningful=records=>records.some(r=>{const t=r.target&&r.target.nodeType===1?r.target:r.target?.parentElement;if(r.type==='attributes')return !!t&&t.classList.contains('ordercard');return !(t&&t.closest&&t.closest(pp171Tick));});
 [newOrders,activeOrders].filter(Boolean).forEach(el=>new MutationObserver(records=>{if(pp171Meaningful(records))schedule()}).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:['class']}));
 {const rows=$('pp158-pickup-rows');if(rows)new MutationObserver(schedule).observe(rows,{childList:true,subtree:true});}
 for(const id of ['pp157-total-new','pp157-total-active','pp157-total-urgent','pp158-pickup-count']){
  const el=$(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,characterData:true,subtree:true});
 }
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('pp145:orders',schedule);
 window.addEventListener('pp155:pickup-state',schedule);
 for(const event of ['pp150:live-synced','pp150:live-stopped','pp150:live-failed','pp155:status-saved'])window.addEventListener(event,schedule);
 // Pickup ages / urgency may change without an order list re-render.
 setInterval(()=>{if(!document.hidden)schedule()},10000);
 schedule();
})();
