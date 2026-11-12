/* Peetri Pizza v17.40 — clock in the Taigna tellimine header, same format as the kitchen header. */
(function(){'use strict';
 const el=document.getElementById('pp1740-clock');if(!el)return;
 const t=new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Tallinn'});
 const d=new Intl.DateTimeFormat('et-EE',{weekday:'short',day:'numeric',month:'short',timeZone:'Europe/Tallinn'});
 function tick(){const n=new Date();el.innerHTML=t.format(n)+'<small>'+d.format(n)+'</small>';}
 tick();setInterval(tick,10000);
})();
