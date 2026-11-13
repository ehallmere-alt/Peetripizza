/* Peetri Pizza v17.48 — Taigna tellimine: what was already ordered TODAY in the official Peetri Pizza panel.
 * Read-only (api/dough-site.php). Shows nothing when the site does not answer. */
(function(){
 'use strict';
 if(window.PP1748Dough)return;
 const nice=p=>{const s=String(p||'').replace(/[_-]+/g,' ').trim();return s?s.charAt(0).toUpperCase()+s.slice(1):'';};
 const box=document.createElement('div');box.id='pp1748-site';box.hidden=true;box.setAttribute('role','status');
 const anchor=document.getElementById('cutoff');
 if(anchor)anchor.after(box);else document.querySelector('main')?.prepend(box);
 async function load(){
  try{
   const r=await fetch('api/dough-site.php',{credentials:'same-origin',cache:'no-store'});const j=await r.json();
   if(!r.ok||!j.ok||!Array.isArray(j.orders)){box.hidden=true;return;}
   box.replaceChildren();
   const h=document.createElement('b');h.textContent='Kodulehel tellitud täna';box.append(h);
   if(!j.orders.length){const s=document.createElement('span');s.className='pp1748-none';s.textContent='veel mitte midagi';box.append(s);box.dataset.state='none';}
   else{
    box.dataset.state='ok';
    for(const o of j.orders){
     const s=document.createElement('span');
     const t=document.createElement('strong');t.textContent=o.time||'';
     s.append(t,document.createTextNode(' '+(o.items||[]).map(i=>i.qty+'× '+nice(i.product)).join(', ')));
     box.append(s);
    }
   }
   box.hidden=false;
  }catch(_){box.hidden=true;}
 }
 load();setInterval(()=>{if(!document.hidden)load();},120000);
 window.PP1748Dough={load};
})();
