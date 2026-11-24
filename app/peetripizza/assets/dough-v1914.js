/* Peetri Pizza 18.14 — dough page: "Tellimine sulgub X h Y min pärast" until the cut-off (read from the page's own "Enne HH:MM" line). Look only. */
(function(){
 'use strict';
 if(window.PP1914D)return;window.PP1914D=1;
 function tick(){
  const src=[...document.querySelectorAll('body *')].find(e=>!e.children.length&&/Enne\s+\d{1,2}:\d{2}\s+saab/i.test(e.textContent||''));
  let el=document.getElementById('pp1914-close');
  const m=src&&src.textContent.match(/Enne\s+(\d{1,2}):(\d{2})/i);
  if(!m){if(el)el.remove();return;}
  const now=new Date(),cut=new Date(now);cut.setHours(+m[1],+m[2],0,0);
  const left=Math.floor((cut-now)/60000);
  if(left<=0){if(el)el.remove();return;}
  const h=Math.floor(left/60),mm=left%60;
  const txt='Tellimine sulgub '+(h?h+' h ':'')+mm+' min pärast (kell '+m[1]+':'+m[2]+')';
  if(!el){el=document.createElement('div');el.id='pp1914-close';src.before(el);}
  el.classList.toggle('pp1914-soon',left<=30);
  if(el.textContent!==txt)el.textContent=txt;
 }
 setInterval(tick,30000);setTimeout(tick,600);
})();
