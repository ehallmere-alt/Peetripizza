/* Peetri Pizza v17.10 — Seaded: which version runs on this tablet, on the server, and the newest one in GitHub.
 * Read-only: api/version.php (own server; it also asks public GitHub for the newest release). No order data is involved.
 */
(function(){
 'use strict';
 if(window.pp1710Version)return;window.pp1710Version=true;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pageVersion=()=>document.querySelector('meta[name="peetri-release"]')?.content||'';
 const clean=v=>{const m=String(v||'').match(/(\d+(?:\.\d+){1,3})/);return m?m[1]:''};
 function cmp(a,b){const x=clean(a).split('.').map(Number),y=clean(b).split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1;}return 0;}
 window.pp1710Compare=cmp;

 async function info(force){
  const r=await fetch('api/version.php?github=1'+(force?'&force=1':'')+'&t='+Date.now(),{cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});
  if(!r.ok){const e=new Error('http_'+r.status);e.status=r.status;throw e;}
  return r.json();
 }

 function mount(){
  if($('pp1710-version'))return $('pp1710-version');
  const panel=document.querySelector('#settingsPage .panel');if(!panel)return null;
  const box=document.createElement('div');box.id='pp1710-version';box.className='pp1710-card';
  box.innerHTML='<div class="pp1710-head"><div><strong>Versioon</strong><small>Mis versioon on planšetis, serveris ja GitHubis</small></div><button type="button" class="secondary" id="pp1710-refresh">↻ Kontrolli</button></div><div class="pp1710-rows" id="pp1710-rows"></div><p class="pp1710-verdict" id="pp1710-verdict" role="status" aria-live="polite"></p>';
  const after=panel.querySelector('.pp141-sound-main');
  (after&&after.parentNode===panel)?after.insertAdjacentElement('afterend',box):panel.appendChild(box);
  $('pp1710-refresh').addEventListener('click',()=>check(true));
  return box;
 }
 function row(label,value,state,extra){return '<div class="pp1710-row" data-state="'+state+'"><span>'+esc(label)+'</span><b>'+value+'</b>'+(extra||'')+'</div>';}

 let busy=false;
 async function check(force){
  const box=mount();if(!box||busy)return;busy=true;
  const rows=$('pp1710-rows'),verdict=$('pp1710-verdict'),btn=$('pp1710-refresh');
  btn.disabled=true;verdict.dataset.state='wait';verdict.textContent='Kontrollin…';
  const page=pageVersion();
  let s=null,errStatus=0;try{const j=await info(force);if(j&&j.ok)s=j;}catch(e){errStatus=e.status||0;}
  const g=s&&s.github&&s.github.version?s.github:null;
  let html=row('Selles planšetis',esc(page||'?'),'ok');
  let files='';
  if(s){
   const f=s.files||{};
   if(f.checked){
    const bad=(f.missingCount||0)+(f.changedCount||0);
    files=bad?'<small class="pp1710-bad">⚠ '+bad+' faili ei klapi: '+esc([].concat(f.missing||[],f.changed||[]).slice(0,4).join(', '))+(bad>4?'…':'')+'</small>':'<small>✓ Failid korras '+esc(f.ok)+'/'+esc(f.total)+'</small>';
   }
   html+=row('Serveris',esc(s.version||'?'),f.checked&&((f.missingCount||0)+(f.changedCount||0))?'bad':'ok',files);
  }else{
   html+=row('Serveris',errStatus===401?'logi uuesti sisse':'ei vastanud','bad');
  }
  html+=g?row('GitHubis uusim',esc(g.version),'ok',g.from==='main'?'<small>main-harus, Release veel puudub</small>':(g.stale?'<small>vana teave, GitHub ei vastanud</small>':'')):row('GitHubis uusim','ei õnnestunud kontrollida','unknown','<small>serveril pole internetti või repo on privaatne</small>');
  rows.innerHTML=html;

  const srvV=s&&s.version;let state='ok',msg='',action='';
  if(srvV&&page&&cmp(srvV,page)>0){state='warn';msg='Serveris on uuem versioon ('+srvV+'), planšet näitab vana lehte.';action='<button type="button" id="pp1710-reload">⟳ Värskenda leht</button>';}
  else if(s&&s.files&&s.files.checked&&((s.files.missingCount||0)+(s.files.changedCount||0))){state='bad';msg='Paigaldus pole täielik. Käivita SSH-käsk uuesti või taasta varukoopiast.';}
  else if(srvV&&g&&cmp(g.version,srvV)>0){state='warn';msg='Uus versioon '+g.version+' on olemas. Paigalda SSH-käsuga.';action='<a href="'+esc(/^https:\/\/github\.com\//.test(g.url)?g.url:'https://github.com/')+'" target="_blank" rel="noopener noreferrer">Ava GitHub Releases ↗</a>';}
  else if(srvV&&g){msg='✓ Kõik on uusim ('+srvV+').';}
  else if(srvV){state='unknown';msg='Serveris on '+srvV+'. GitHubi ei saanud kontrollida.';}
  else{state='bad';msg='Serverit ei saanud kontrollida.';}
  verdict.dataset.state=state;verdict.innerHTML=esc(msg)+(action?' '+action:'');
  $('pp1710-reload')?.addEventListener('click',()=>{try{navigator.serviceWorker?.controller?.postMessage('pp-clear-shell')}catch(_){}setTimeout(()=>location.reload(),150);});
  btn.disabled=false;busy=false;
 }
 window.pp1710Check=check;

 function onSettings(){const p=$('settingsPage');return p&&p.classList.contains('active');}
 function maybe(){if(onSettings())check(false);}
 const start=()=>{mount();
  const p=$('settingsPage');if(p)new MutationObserver(maybe).observe(p,{attributes:true,attributeFilter:['class','hidden','style']});
  maybe();
 };
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
