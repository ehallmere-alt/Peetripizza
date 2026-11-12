/* Peetri Pizza v17.22 — header, owner said "Давай" to all six:
 * 1 LIVE dot (green / orange / red) + "uuendatud N s tagasi"   2 counters Uued · Töös (+ Valmis button in green)
 * 3 bigger clock with date   4 Ooteaeg as one big button -> 15/20/30/45/60 tiles (same select + change event as before)
 * 5 cleaner: brand subtitle hidden, fullscreen button moved to the side menu   6 phone: header in two rows.
 * Old header elements stay in the page (hidden by CSS only), other scripts still use them. Nothing is sent to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1722)return;
 const $=id=>document.getElementById(id);
 const right=document.querySelector('.topbar .top-right');
 if(!right)return;
 const isLive=()=>document.body.classList.contains('live-active');
 const put=(id,v)=>{const e=$(id);if(e&&e.textContent!==String(v))e.textContent=v;};
 const el=(tag,id,cls,html)=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
 document.documentElement.classList.add('pp1722');

 /* 1: LIVE dot */
 let lastOk=0;
 const live=el('div','pp1722-live','pp1722-live','<i></i><span><b id="pp1722-live-t">DEMO</b><small id="pp1722-live-s"></small></span>');
 live.setAttribute('role','status');
 window.addEventListener('pp150:live-synced',()=>{lastOk=Date.now();liveTick();});
 window.addEventListener('pp150:live-stopped',()=>{lastOk=0;liveTick();});
 window.addEventListener('online',()=>liveTick());window.addEventListener('offline',()=>liveTick());
 function ago(s){if(s<60)return s+' s tagasi';const m=Math.floor(s/60);return m+' min tagasi';}
 function liveTick(){
  let state='demo',t='DEMO',s='näidisandmed';
  if(!navigator.onLine){state='bad';t='Internet puudub';s=lastOk?'viimati '+ago(Math.round((Date.now()-lastOk)/1000)):'';}
  else if(isLive()){
   if(!lastOk){state='wait';t='LIVE';s='ühendan…';}
   else{const sec=Math.max(0,Math.round((Date.now()-lastOk)/1000));state=sec>=180?'bad':sec>=45?'wait':'ok';t=state==='bad'?'LIVE ei vasta':'LIVE';s=ago(sec);}
  }
  if(live.dataset.state!==state)live.dataset.state=state;if(live.classList.contains('pp1722-off')===navigator.onLine)live.classList.toggle('pp1722-off',!navigator.onLine);put('pp1722-live-t',t);put('pp1722-live-s',s);
  return state;
 }

 /* 2: counters */
 const cnt=el('div','pp1722-counts','pp1722-counts','<span class="pp1722-c-new"><b id="pp1722-n-new">0</b>Uued</span><span class="pp1722-c-work"><b id="pp1722-n-work">0</b>Töös</span>');
 cnt.setAttribute('aria-label','Tellimused');
 function countTick(){
  const n=document.querySelectorAll('#newOrders .ordercard').length,w=document.querySelectorAll('#activeOrders .ordercard').length;
  put('pp1722-n-new',n);put('pp1722-n-work',w);
  if(cnt.classList.contains('pp1722-has-new')!==n>0)cnt.classList.toggle('pp1722-has-new',n>0);
  return [n,w];
 }

 /* 3: clock + date */
 const clk=el('div','pp1722-clock','pp1722-clock','<b id="pp1722-time">--:--</b><small id="pp1722-date"></small>');
 const tf=new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Tallinn'});
 const df=new Intl.DateTimeFormat('et-EE',{weekday:'short',day:'numeric',month:'short',timeZone:'Europe/Tallinn'});
 function clockTick(){const d=new Date();put('pp1722-time',tf.format(d));put('pp1722-date',df.format(d).replace(/\.$/,''));}

 /* 4: Ooteaeg button + tiles */
 const sel=()=>$('pp158-wait-select')||$('pp114-wait-select');
 const wbtn=el('button','pp1722-wait','pp1722-wait','<small>Ooteaeg</small><b id="pp1722-wait-v">–</b>');wbtn.type='button';
 const pop=el('div','pp1722-wait-pop','pp1722-wait-pop');pop.hidden=true;pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Vali ooteaeg');
 function waitTick(){const s=sel();if(!s)return;const o=s.options[s.selectedIndex];put('pp1722-wait-v',o?o.textContent.trim():'–');
  const box=s.closest('.pp158-wait');wbtn.classList.toggle('hot',!!(box&&box.classList.contains('pp1718-wait-hot')));}
 function openPop(){
  const s=sel();if(!s)return;
  pop.innerHTML='<strong>Ooteaeg</strong><div>'+[...s.options].map(o=>'<button type="button" data-v="'+o.value+'"'+(o.value===s.value?' class="on"':'')+'>'+o.textContent.trim().replace(' min','<small>min</small>')+'</button>').join('')+'</div>';
  const r=wbtn.getBoundingClientRect();pop.style.top=Math.round(r.bottom+8)+'px';pop.style.left=Math.max(8,Math.min(window.innerWidth-pop.offsetWidth-8,Math.round(r.left)))+'px';
  pop.hidden=false;
  const w=pop.offsetWidth;pop.style.left=Math.max(8,Math.min(window.innerWidth-w-8,Math.round(r.left+r.width/2-w/2)))+'px';
 }
 function closePop(){pop.hidden=true;}
 function choose(v){const s=sel();if(!s||![...s.options].some(o=>o.value===v))return;
  if(s.value!==v){s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));window.toast?.('Ooteaeg '+v+' min');}
  closePop();waitTick();}

 /* 5: fullscreen into the side menu */
 function addFsNav(){
  const nav=document.querySelector('#drawer nav');if(!nav||$('pp1722-fs-nav')||!$('pp173-fullscreen'))return;
  const b=el('button','pp1722-fs-nav','navitem','<span>⛶</span> Täisekraan');b.type='button';
  const st=nav.querySelector('[data-page="settings"]');st?nav.insertBefore(b,st):nav.append(b);
 }

 // Clicks: live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  if(t.closest('#pp1722-wait')){e.preventDefault();e.stopPropagation();pop.hidden?openPop():closePop();return;}
  const v=t.closest('#pp1722-wait-pop [data-v]');if(v){e.preventDefault();e.stopPropagation();choose(v.dataset.v);return;}
  if(t.closest('#pp1722-fs-nav')){e.preventDefault();e.stopPropagation();$('pp173-fullscreen')?.click();$('closeDrawer')?.click();return;}
  if(!pop.hidden&&!t.closest('#pp1722-wait-pop'))closePop();
 },true);
 window.addEventListener('resize',closePop);window.addEventListener('scroll',closePop,{passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closePop();});

 /* place everything */
 function place(){
  const box=(sel()||{}).closest?.('.pp158-wait');
  if(box&&wbtn.parentElement!==right)right.insertBefore(wbtn,box);
  const stats=$('pp171-stats');
  if(cnt.parentElement!==right)right.insertBefore(cnt,stats||right.firstChild);
  const mode=$('pp172-mode');
  if(live.parentElement!==right)(mode?mode.after(live):right.append(live));
  const old=$('clock');if(clk.parentElement!==right)(old?old.after(clk):right.append(clk));
  if(!pop.parentElement)document.body.append(pop);
  addFsNav();
 }
 place();
 const s0=sel();if(s0)s0.addEventListener('change',()=>setTimeout(waitTick,0));
 document.addEventListener('peetri:wait-time-change',()=>setTimeout(waitTick,50));
 window.addEventListener('pp145:orders',()=>setTimeout(()=>{countTick();liveTick();},0));
 function all(){place();liveTick();countTick();clockTick();waitTick();}
 all();setInterval(all,5000);setInterval(()=>{liveTick();clockTick();},1000);
 window.PP1722={liveTick,countTick,clockTick,waitTick,openPop,choose,_test:{setLast:v=>{lastOk=v}}};
})();
