/* Peetri Pizza v17.21 — owner picked design #6: Seaded in neat cards by section, big switches.
 * Only the layout changes. Every existing settings block stays in the page (other scripts look for them);
 * blocks are sorted under four tabs: Köök · Heli · Printer · Süsteem. The chosen tab is remembered on this tablet.
 */
(function(){
 'use strict';
 if(window.PP1721)return;
 const TABS=[['kook','Köök','▣'],['heli','Heli','♫'],['print','Printer','⎙'],['sys','Süsteem','⚙']];
 const KEY='pp1721-tab';
 let tab='kook';try{const t=localStorage.getItem(KEY);if(TABS.some(x=>x[0]===t))tab=t;}catch(_){}
 const SKIP=new Set(['SPAN','H2','P']);
 function kind(el){
  if(el.id==='pp1721-tabs'||SKIP.has(el.tagName))return '';
  if(el.matches('.pp169-print-settings'))return 'print';
  if(el.querySelector('#soundToggle,.pp141-sound-settings,#pp141-test-sound'))return 'heli';
  if(el.querySelector('#minusMinutes,#pp1714-lite-row,#pp163-ultra-toggle'))return 'kook';
  return 'sys';
 }
 function bar(panel){
  let b=document.getElementById('pp1721-tabs');
  if(!b){
   b=document.createElement('div');b.id='pp1721-tabs';b.setAttribute('role','tablist');b.setAttribute('aria-label','Seadete jaotised');
   b.innerHTML=TABS.map(([k,l,i])=>'<button type="button" role="tab" data-tab="'+k+'"><span aria-hidden="true">'+i+'</span>'+l+'</button>').join('');
   b.addEventListener('click',e=>{const x=e.target.closest('[data-tab]');if(!x)return;e.stopPropagation();tab=x.dataset.tab;try{localStorage.setItem(KEY,tab)}catch(_){}apply();window.scrollTo({top:0});});
  }
  const intro=panel.querySelector(':scope>.pp163-settings-intro')||panel.querySelector(':scope>h2');
  if(b.parentElement!==panel)(intro?intro.after(b):panel.prepend(b));
  return b;
 }
 let busy=false;
 function apply(){
  const panel=document.querySelector('#settingsPage>.panel');if(!panel)return;
  busy=true;
  panel.classList.add('pp1721');
  const b=bar(panel);
  for(const el of panel.children){const k=kind(el);if(!k)continue;el.dataset.pp1721=k;el.classList.toggle('pp1721-off',k!==tab);}
  for(const x of b.querySelectorAll('[data-tab]')){const on=x.dataset.tab===tab;x.classList.toggle('on',on);x.setAttribute('aria-selected',on?'true':'false');}
  setTimeout(()=>{busy=false},0);
 }
 // Late modules add their blocks after load; sort them as they appear.
 let t=0;
 const mo=new MutationObserver(()=>{if(busy)return;clearTimeout(t);t=setTimeout(apply,120);});
 function start(){const p=document.querySelector('#settingsPage>.panel');if(!p){setTimeout(start,500);return;}apply();mo.observe(p,{childList:true});}
 start();
 window.PP1721={apply,kind,get tab(){return tab},set tab(v){tab=v;apply();}};
})();
