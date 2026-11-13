/* Peetri Pizza v17.39 — owner: one calm style everywhere.
 * Tooted: "Kodulehel otsas" moves to the bottom of the page and is folded (tap the title to open).
 * Drawer footer shows the real installed version. Layout only; data, LIVE and printing untouched. */
(function(){
 'use strict';
 if(window.PP1739)return;
 const ver=(document.querySelector('meta[name="peetri-release"]')?.content||'').replace(/\.0$/,'');
 function tick(){
  const page=document.getElementById('productsPage'),box=document.getElementById('pp176-missing');
  if(page&&box){
   const foot=page.querySelector(':scope>.pp-footer,:scope>footer');
   if(foot?(box.nextElementSibling!==foot):(page.lastElementChild!==box))foot?foot.before(box):page.append(box);
   const n=box.querySelectorAll('.pp176-chip').length;const c=String(n);
   box.classList.toggle('pp1739-has',n>0);
   const h=box.querySelector('.pp176-missing-head');if(h&&h.dataset.n!==c+' otsas')h.dataset.n=c+' otsas';
  }
  const db=document.querySelector('#drawer .drawer-bottom');
  if(db&&ver){for(const t of db.childNodes){if(t.nodeType===3&&/v\d+\.\d+/.test(t.nodeValue)&&!t.nodeValue.includes('v'+ver))t.nodeValue=t.nodeValue.replace(/v\d+(\.\d+)+/,'v'+ver);}}
 }
 // live-status-v155 stops document-capture clicks, so listen on window in capture.
 window.addEventListener('click',e=>{
  const h=e.target instanceof Element&&e.target.closest('#pp176-missing.pp1739-has .pp176-missing-head');if(!h)return;
  e.preventDefault();e.stopPropagation();h.parentElement.classList.toggle('pp1739-open');
 },true);
 setInterval(tick,1500);setTimeout(tick,300);
 window.PP1739={tick};
})();
