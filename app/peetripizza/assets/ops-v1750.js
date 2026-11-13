/* Peetri Pizza v17.50 — night screen in the new look (owner picked 6; 5 = repeat sound, in features-v145).
 * Adds "Peetri Pizza", the pizzeria name and "Täna: N tellimust · N pitsat" to the existing night screen (ops-v1718).
 * Numbers: LIVE from api/kitchen-analytics.php?period=today (our server), DEMO from the orders on screen. Nothing blinks. */
(function(){
 'use strict';
 if(window.PP1750)return;
 const root=document.documentElement;
 let day=null,dayAt=0;
 const live=()=>(document.getElementById('pp172-mode')?.dataset.state||'demo')!=='demo';
 async function numbers(){
  if(live()){
   if(Date.now()-dayAt<5*60000&&day)return day;
   try{const r=await fetch('api/kitchen-analytics.php?period=today',{credentials:'same-origin',cache:'no-store'});const j=await r.json();
    const rep=j&&j.report;if(rep){day={orders:Number(rep.orders)||0,pizzas:Number(rep.pizzas)||0};dayAt=Date.now();}}catch(_){}
   return day;
  }
  try{
   const list=typeof shownOrders==='function'?shownOrders():[];
   const t=new Date();t.setHours(0,0,0,0);
   const done=list.filter(o=>o.status==='done'&&Number(o.completed||o.created)>=t.getTime());
   let pz=0;for(const o of done)for(const it of (o.items||[])){const [raw,q]=Array.isArray(it)?it:[it?.name,it?.quantity];let p=null;try{p=window.PPOrderInfo?.parse(raw)}catch(_){}if(p&&(p.code||p.size))pz+=Number(q)||1;}
   return {orders:done.length,pizzas:pz};
  }catch(_){return null}
 }
 async function paint(){
  const scr=document.getElementById('pp1718-night');if(!scr||scr.hidden||root.classList.contains('pp1750-off'))return;
  const box=scr.querySelector('.pp1718-night-box');if(!box)return;
  if(!box.querySelector('.pp1750-logo')){
   const logo=document.createElement('div');logo.className='pp1750-logo';
   const name=(document.querySelector('.pp114-location')?.textContent||'').trim();
   logo.innerHTML='<b>Peetri Pizza</b><span></span>';logo.lastChild.textContent=name;
   box.prepend(logo);
   const s=document.createElement('div');s.className='pp1750-day';s.hidden=true;box.querySelector('#pp1718-night-text')?.after(s);
  }
  const s=box.querySelector('.pp1750-day');const n=await numbers();
  if(s&&n){const tx='Täna '+n.orders+(n.orders===1?' tellimus':' tellimust')+' · '+n.pizzas+(n.pizzas===1?' pitsa':' pitsat');if(s.textContent!==tx)s.textContent=tx;s.hidden=!n.orders;}
  root.classList.add('pp1750-on');
 }
 // the night screen is made by ops-v1718, which loads after the page is shown: watch it once it exists
 let watched=false;
 function attach(){if(watched)return;const scr=document.getElementById('pp1718-night');if(!scr)return;watched=true;try{new MutationObserver(paint).observe(scr,{attributes:true,attributeFilter:['hidden']});}catch(_){}paint();}
 const t=setInterval(()=>{attach();if(watched)clearInterval(t);},2000);
 setInterval(paint,30000);
 window.PP1750={paint};
})();
