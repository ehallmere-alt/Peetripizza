/* Peetri Pizza v17.61 — owner picked 6: Taigna history starts collapsed, refreshes itself every 2 min
   (the "Värskenda" button is hidden), and an empty history is not shown at all.
   dough-v169 is a closed IIFE, so this drives its own buttons: #reload (load) and #pp144-history-toggle. */
(()=>{
 'use strict';
 if(window.pp1761)return;window.pp1761=true;
 const $=id=>document.getElementById(id);
 const toggle=$('pp144-history-toggle'),reload=$('reload'),hist=$('history'),sec=document.querySelector('.pp144-history');
 if(!toggle||!reload||!hist||!sec)return;
 const isOpen=()=>toggle.getAttribute('aria-expanded')==='true';
 // start collapsed
 if(isOpen())toggle.click();
 // empty history -> hide the whole block (load errors stay visible)
 const mark=()=>sec.classList.toggle('pp1761-empty',!!hist.querySelector(':scope>p.empty')&&!hist.querySelector('article'));
 new MutationObserver(mark).observe(hist,{childList:true});mark();
 // refresh every 2 min; #reload also opens the history, so put it back the way it was
 setInterval(()=>{
  if(document.hidden)return;
  const was=isOpen();reload.click();if(!was&&isOpen())toggle.click();
 },120000);
})();
