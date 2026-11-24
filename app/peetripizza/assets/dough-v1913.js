/* Peetri Pizza 18.13 — dough page: "Eelmine: N (dd.mm)" under each product = packages in the last saved order before today. Read only. */
(function(){
 'use strict';
 if(window.PP1913D)return;window.PP1913D=1;
 let cache=null;
 // same read-only GET the page itself makes (api/dough.php); nothing is written
 async function load(){try{const r=await fetch('api/dough.php',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});const d=await r.json();if(r.ok&&d&&d.ok&&Array.isArray(d.orders)){cache=d.orders;prev();}}catch(_){}}
 const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime();};
 function prev(){
  const recs=cache;if(!recs)return;
  const last=recs.filter(o=>Date.parse(o.created_at)<today()&&!/t(ü|u)hist|cancel/i.test(String(o.status||''))).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];
  for(const it of document.querySelectorAll('#items .item')){
   const nm=it.querySelector('.itemname');if(!nm)continue;
   const name=[...nm.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim()||nm.firstElementChild?.textContent?.trim()||'';
   let el=nm.querySelector('.pp1913-prev');
   const row=last&&(last.items||[]).find(i=>String(i.name||'').trim()===name);
   if(!row||!(Number(row.packages)>0)){if(el)el.remove();continue;}
   const d=new Date(Date.parse(last.created_at));
   const txt='Eelmine: '+Number(row.packages)+' ('+d.getDate()+'.'+(d.getMonth()+1)+')';
   if(!el){el=document.createElement('span');el.className='pp1913-prev';nm.append(el);}
   if(el.textContent!==txt)el.textContent=txt;
  }
 }
 new MutationObserver(()=>{try{prev()}catch(_){}}).observe(document.getElementById('items')||document.body,{childList:true});
 setInterval(load,60000);setTimeout(load,800);
})();
