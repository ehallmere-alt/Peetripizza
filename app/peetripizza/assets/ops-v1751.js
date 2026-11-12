/* Peetri Pizza v17.51 — Statistika "⬇ CSV": orders, pizzas and takings per day (owner picked 5).
 * Data from api/kitchen-analytics.php (our server, LIVE days only). No customer data. Period = the selected tab;
 * "Täna"/"Eile" export this month. Excel-friendly: UTF-8 BOM, ";" and decimal comma. */
(function(){
 'use strict';
 if(window.PP1751)return;
 const say=m=>{try{(window.toast||console.log)(m)}catch(_){}};
 function period(){const b=document.querySelector('#pp1719-stats .pp1719-tabs button[aria-pressed="true"]');const p=b?.dataset.pp1719||'month';return ['month','lastmonth','all'].includes(p)?p:'month';}
 const label={month:'see kuu',lastmonth:'eelmine kuu',all:'kogu aeg'};
 function button(){
  const head=document.querySelector('#pp1719-report .pp1719-report-head');if(!head)return;
  let b=head.querySelector('#pp1751-csv');
  if(!b){b=document.createElement('button');b.type='button';b.id='pp1751-csv';b.className='secondary';const pr=head.querySelector('#pp1719-print');pr?pr.before(b):head.append(b);}
  const t='⬇ CSV · '+label[period()];if(b.textContent!==t)b.textContent=t;
 }
 async function download(){
  const p=period();
  let j;try{const r=await fetch('api/kitchen-analytics.php?period='+p,{credentials:'same-origin',cache:'no-store'});j=await r.json();if(!r.ok||!j.ok)throw 0;}catch(_){say('CSV: serveriga ühendus puudub');return;}
  const days=j.report&&j.report.days?j.report.days:{};const keys=Object.keys(days).sort();
  if(!keys.length){say('CSV: selle perioodi kohta andmeid pole (andmed kogutakse LIVE režiimis)');return;}
  const eur=c=>(Math.round(Number(c)||0)/100).toFixed(2).replace('.',',');
  const rows=[['Kuupäev','Tellimusi','Pitsasid','Käive (€)']];let n=0,pz=0,m=0;
  for(const d of keys){const x=days[d]||{};n+=x.n||0;pz+=x.p||0;m+=x.m||0;const [Y,M,D]=d.split('-');rows.push([D+'.'+M+'.'+Y,x.n||0,x.p||0,eur(x.m)]);}
  rows.push(['Kokku',n,pz,eur(m)]);
  const csv='﻿'+rows.map(r=>r.join(';')).join('\r\n')+'\r\n';
  const loc=(document.querySelector('.pp114-location')?.textContent||'pizzeria').trim().toLowerCase().replace(/[^a-z0-9õäöü]+/g,'-');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download='peetri-'+loc+'-'+(j.from||'')+'-'+(j.to||'')+'.csv';document.body.append(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);
 }
 window.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('#pp1751-csv');if(!b)return;e.preventDefault();e.stopPropagation();download();},true);
 let q=false;const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;try{button()}catch(_){}});};
 try{const s=document.getElementById('statisticsPage');if(s)new MutationObserver(later).observe(s,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});}catch(_){}
 setInterval(later,4000);setTimeout(later,800);
 // phone: real header height for the sticky bars below it (ops-v1751.css)
 const hh=()=>{const h=document.querySelector('header.topbar');if(h)document.documentElement.style.setProperty('--pp1751-hh',h.offsetHeight+'px');};
 try{const h=document.querySelector('header.topbar');if(h&&window.ResizeObserver)new ResizeObserver(hh).observe(h);}catch(_){}
 window.addEventListener('resize',hh);setTimeout(hh,500);
 window.PP1751={download};
})();
