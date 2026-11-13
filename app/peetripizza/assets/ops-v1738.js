/* Peetri Pizza v17.38 — owner: screen scale slider in Seaded → Köök ("кому-то побольше, кому-то поменьше").
 * Saved on this tablet only (localStorage pp1738-zoom), applied with CSS zoom on <html>. 100% = as before. */
(function(){
 'use strict';
 if(window.PP1738)return;
 const KEY='pp1738-zoom',MIN=80,MAX=130,STEP=5;
 const clamp=v=>Math.min(MAX,Math.max(MIN,Math.round(v/STEP)*STEP));
 let z=100;try{const v=Number(localStorage.getItem(KEY));if(v)z=clamp(v);}catch(_){}
 function apply(){document.documentElement.style.zoom=z===100?'':String(z/100);const o=document.getElementById('pp1738-val');if(o)o.textContent=z+'%';const r=document.getElementById('pp1738-range');if(r&&Number(r.value)!==z)r.value=String(z);}
 function set(v){z=clamp(v);try{z===100?localStorage.removeItem(KEY):localStorage.setItem(KEY,String(z));}catch(_){}apply();}
 apply();
 function row(){
  if(document.getElementById('pp1738-row'))return;
  const lite=document.getElementById('pp1714-lite-row');if(!lite)return;
  const rows=[...lite.parentElement.querySelectorAll(':scope>.settingsrow,:scope>.pp163-setting-row')];const anchor=rows[rows.length-1]||lite;
  const d=document.createElement('div');d.className='settingsrow';d.id='pp1738-row';
  d.innerHTML='<div><strong>Ekraani suurus</strong><small>Kõik tekst ja nupud suuremaks või väiksemaks. Kehtib ainult selles tahvlis.</small></div>'+
   '<div class="pp1738-ctl"><button type="button" data-z="-" aria-label="Väiksemaks">A−</button><input id="pp1738-range" type="range" min="'+MIN+'" max="'+MAX+'" step="'+STEP+'" value="'+z+'" aria-label="Ekraani suurus"><button type="button" data-z="+" aria-label="Suuremaks">A+</button><button type="button" data-z="0" id="pp1738-val" title="Tagasi 100%">'+z+'%</button></div>';
  anchor.after(d);
  const r=d.querySelector('#pp1738-range');
  r.addEventListener('change',()=>set(Number(r.value)));
  r.addEventListener('input',()=>{const o=document.getElementById('pp1738-val');if(o)o.textContent=r.value+'%';});
 }
 // live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const b=e.target instanceof Element&&e.target.closest('#pp1738-row [data-z]');if(!b)return;
  e.preventDefault();e.stopPropagation();
  const k=b.dataset.z;set(k==='0'?100:z+(k==='+'?STEP:-STEP));
 },true);
 setInterval(row,1500);setTimeout(row,400);
 window.PP1738={set,get:()=>z};
})();
