/* Peetri Pizza v17.18 — owner picked 4 + 6.
 * 4: night screen. After closing time (today's hours from api/site-status.php, read-only) and with no order in work,
 *    the tablet shows a dark screen with a big clock. A new order wakes it at once; a tap hides it for 15 min.
 *    A web page cannot change the backlight, so the screen is only made dark (less glare, no burn-in).
 * 6: Ooteaeg hint. With 6+ orders in work the Ooteaeg box in the header turns orange and offers "Tõsta 30 min?"
 *    (10+ orders: 45 min). Nothing changes until someone taps; then the normal Ooteaeg save is used.
 * Nothing is sent to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1718)return;
 const $=id=>document.getElementById(id);
 const tallinn=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const nowMin=d=>{const p=Object.fromEntries(tallinn.formatToParts(d||new Date()).map(x=>[x.type,x.value]));return Number(p.hour)*60+Number(p.minute)};
 const working=()=>document.querySelectorAll('#newOrders .ordercard,#activeOrders .ordercard').length;

 /* ---------- 4: night screen ---------- */
 let hours=null;            // {from,to} in minutes, or 'closed' for a closed day, or null = unknown
 const GRACE=30;            // stay awake 30 min after closing
 async function loadHours(){
  try{const r=await fetch('api/site-status.php',{cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});
   const j=await r.json();if(!j||!j.ok)return;
   const t=String(j.today_hours||'');const m=t.match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/);
   hours=m?{from:Number(m[1])*60+Number(m[2]),to:Number(m[3])*60+Number(m[4])}:(/suletud/i.test(t)?'closed':null);}catch(_){}
  tick();
 }
 // Closed now? Hours like 11–22, also 11–02 (past midnight) and 24 = midnight.
 function isClosed(min,h){
  h=h===undefined?hours:h;
  if(!h)return false;if(h==='closed')return true;
  let from=h.from,to=h.to;if(to===0)to=1440;
  if(to>from)return !(min>=from-30&&min<to+GRACE);
  return !(min>=from-30||min<to+GRACE);
 }
 const scr=document.createElement('div');scr.id='pp1718-night';scr.hidden=true;scr.setAttribute('role','dialog');scr.setAttribute('aria-label','Öörežiim');
 scr.innerHTML='<div class="pp1718-night-box"><strong id="pp1718-night-clock">--:--</strong><span id="pp1718-night-date"></span><em id="pp1718-night-text">Pizzeria on suletud</em><small>Uus tellimus äratab ekraani kohe · puuduta, et näha töölauda</small></div>';
 document.body.appendChild(scr);
 let snoozeUntil=0,forced=false;
 const dateFmt=new Intl.DateTimeFormat('et-EE',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Tallinn'});
 const clockFmt=new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Tallinn'});
 function paint(){
  $('pp1718-night-clock').textContent=clockFmt.format(new Date());
  $('pp1718-night-date').textContent=dateFmt.format(new Date());
  const open=hours&&hours!=='closed'?String(Math.floor(hours.from/60)).padStart(2,'0')+':'+String(hours.from%60).padStart(2,'0'):'';
  $('pp1718-night-text').textContent=open?'Suletud · avame kell '+open:'Pizzeria on suletud';
 }
 function tick(at){
  const want=forced||(isClosed(nowMin(at))&&!working()&&Date.now()>=snoozeUntil&&!document.querySelector('dialog[open]'));
  if(want&&working())forced=false;
  const show=want&&!working();
  if(show)paint();
  if(scr.hidden===show){scr.hidden=!show;document.documentElement.classList.toggle('pp1718-night-on',show);}
  return show;
 }
 scr.addEventListener('click',()=>{snoozeUntil=Date.now()+15*60000;forced=false;tick();});
 // pp145:orders fires just before the cards are drawn, so look one moment later.
 window.addEventListener('pp145:orders',()=>setTimeout(()=>{if(!scr.hidden&&working()){forced=false;tick();}},0));
 setInterval(()=>tick(),30000);
 setTimeout(loadHours,5000);setInterval(loadHours,10*60000);

 /* ---------- 6: Ooteaeg hint ---------- */
 const waitSel=()=>$('pp158-wait-select')||$('pp114-wait-select');
 let hintSnooze=0;
 const hint=document.createElement('div');hint.id='pp1718-wait-hint';hint.hidden=true;hint.setAttribute('role','status');
 hint.innerHTML='<span id="pp1718-wait-text"></span><button type="button" id="pp1718-wait-yes"></button><button type="button" id="pp1718-wait-no" aria-label="Mitte praegu">✕</button>';
 function place(){const s=waitSel();const box=s&&(s.closest('.pp158-wait')||s.parentElement);if(box&&hint.parentElement!==box){box.style.position=box.style.position||'relative';box.appendChild(hint);}return box;}
 function suggestion(n,current){if(n>=10&&current<45)return 45;if(n>=6&&current<30)return 30;return 0;}
 function waitTick(){
  const s=waitSel();const box=place();if(!s||!box)return 0;
  const n=working(),cur=Number(s.value)||0,want=Date.now()>=hintSnooze?suggestion(n,cur):0;
  box.classList.toggle('pp1718-wait-hot',!!want);
  hint.hidden=!want;
  if(want){$('pp1718-wait-text').textContent=n+' tellimust töös';$('pp1718-wait-yes').textContent='Tõsta '+want+' min?';hint.dataset.want=String(want);}
  return want;
 }
 hint.addEventListener('click',e=>{
  e.stopPropagation();
  if(e.target.closest('#pp1718-wait-no')){hintSnooze=Date.now()+20*60000;waitTick();return;}
  if(!e.target.closest('#pp1718-wait-yes'))return;
  const s=waitSel(),v=hint.dataset.want;if(!s||![...s.options].some(o=>o.value===v))return;
  s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));window.toast?.('Ooteaeg '+v+' min');
  hintSnooze=Date.now()+10*60000;waitTick();
 });
 window.addEventListener('pp145:orders',()=>setTimeout(waitTick,0));
 document.addEventListener('peetri:wait-time-change',()=>setTimeout(waitTick,50));
 setInterval(waitTick,15000);setTimeout(waitTick,1500);

 window.PP1718={isClosed,tick,waitTick,suggestion,_test:{setHours:h=>{hours=h},force:v=>{forced=!!v;snoozeUntil=0},snooze:()=>{hintSnooze=0}}};
})();
