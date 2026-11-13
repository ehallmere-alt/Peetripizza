/* Peetri Pizza v17.49 — owner picked 2, 3, 5, 6 (12.11.2026).
 * 5: heartbeat once a minute to api/heartbeat.php (device id, version, DEMO/LIVE, when LIVE data last came) for check.php.
 * 2: Seaded: rarely used switches move into "Veel seadeid" (folded) at the bottom of Köök. Same switches, same handlers, nothing removed.
 * 3: Statistika: one big line on top ("4 tellimust · 8 pitsat · 89,50 €"); the three tiles it repeats are only hidden.
 * Off switch: <html class="pp1749-off">.
 */
(function(){
 'use strict';
 if(window.PP1749)return;
 const root=document.documentElement;
 const off=()=>root.classList.contains('pp1749-off');
 const meta=n=>document.querySelector('meta[name="'+n+'"]')?.content||'';

 // 5
 let dev='';try{dev=localStorage.getItem('pp1749-device')||'';if(!/^[a-f0-9]{16}$/.test(dev)){const a=new Uint8Array(8);crypto.getRandomValues(a);dev=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('pp1749-device',dev);}}catch(_){dev=''}
 let liveAt=0;
 const mode=()=>(document.getElementById('pp172-mode')?.dataset.state||'demo')==='live'?'live':'demo';
 window.addEventListener('pp145:orders',()=>{if(mode()==='live')liveAt=Date.now();});
 async function beat(){
  if(!dev)return;
  try{
   await fetch('api/heartbeat.php',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':meta('pp-wait-csrf')},
    body:JSON.stringify({device:dev,version:meta('peetri-release'),mode:mode(),live_at:liveAt,page:(document.querySelector('.page.active')?.id||'').replace(/Page$/,''),screen:innerWidth+'x'+innerHeight})});
  }catch(_){}
 }
 setTimeout(beat,5000);setInterval(beat,60000);

 // 2
 const RARE=['Tahvli kiirrežiim','Suur köögiekraan','Kompaktne töölaud','Ülikompaktsed tellimused','Keri uue tellimuseni'];
 function settings(){
  const page=document.getElementById('settingsPage');if(!page||!page.classList.contains('active'))return;
  const rows=[...page.querySelectorAll('.settingsrow,.pp163-setting-row,.pp164-flow-option')].filter(r=>{const t=r.querySelector('strong')?.textContent?.trim();return t&&RARE.includes(t)&&!r.closest('#pp1749-more');});
  if(!rows.length)return;
  const group=rows[0].closest('.pp163-pref-group');if(!group)return;
  let more=page.querySelector('#pp1749-more');
  if(!more){more=document.createElement('details');more.id='pp1749-more';more.innerHTML='<summary>Veel seadeid <small>harva vaja</small></summary><div class="pp1749-more-body"></div>';group.append(more);}
  const body=more.querySelector('.pp1749-more-body');
  for(const r of rows)body.append(r);
 }

 // 3
 function stats(){
  const rep=document.getElementById('pp1719-report');if(!rep)return;
  const tiles=[...rep.querySelectorAll('.pp1719-tiles>.pp1719-tile')];if(tiles.length<4)return;
  const val=i=>tiles[i]?.querySelector('strong')?.textContent?.trim()||'';
  const n=val(0),money=val(1),pz=val(3);
  const word=(v,one,many)=>v+' '+(String(v)==='1'?one:many);
  let hero=rep.querySelector(':scope>.pp1749-hero');
  if(!hero){hero=document.createElement('div');hero.className='pp1749-hero';rep.querySelector('.pp1719-tiles')?.before(hero);}
  const html='<span><b>'+esc(n)+'</b> '+(n==='1'?'tellimus':'tellimust')+'</span><span><b>'+esc(pz)+'</b> '+(pz==='1'?'pitsa':'pitsat')+'</span><span><b>'+esc(money)+'</b> käive</span>';
  if(hero.dataset.h!==html){hero.dataset.h=html;hero.innerHTML=html;}
  for(const i of [0,1,3])tiles[i].classList.add('pp1749-in-hero');
 }
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 function tick(){if(off())return;try{settings()}catch(_){}try{stats()}catch(_){}root.classList.add('pp1749-on');}
 let q=false;const later=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;tick();});};
 try{const m=document.querySelector('main')||document.body;new MutationObserver(later).observe(m,{childList:true,subtree:true});}catch(_){}
 window.addEventListener('click',()=>setTimeout(later,200),true);
 setInterval(tick,4000);setTimeout(tick,500);
 window.PP1749={tick,beat};
})();
