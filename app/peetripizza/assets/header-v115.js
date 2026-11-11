/* Shared kitchen waiting time for the signed-in pizzeria. Never writes upstream. */
(()=>{'use strict';
 const select=document.getElementById('pp114-wait-select');if(!select)return;
 const csrf=document.querySelector('meta[name="pp-wait-csrf"]')?.content||'';
 const values=['15','20','30','45','60'];let latest=null, saving=false;
 const label=document.createElement('span');label.id='pp115-wait-status';label.setAttribute('role','status');label.style.cssText='font-size:11px;color:#54715c;margin-left:4px';select.parentElement.appendChild(label);
 function update(value){if(!values.includes(String(value)))return;latest=String(value);if(!saving)select.value=latest;document.dispatchEvent(new CustomEvent('peetri:wait-time-change',{detail:{minutes:Number(latest),scope:'pizzeria'}}));}
 async function load(){if(saving)return;try{const r=await fetch('api/wait-time.php',{credentials:'same-origin',cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error('server');update(d.minutes);label.textContent='';}catch(_){label.textContent='Ühendus puudub';}}
 select.addEventListener('change',async()=>{if(!values.includes(select.value))return;const chosen=select.value;saving=true;select.disabled=true;label.textContent='Salvestan…';try{const r=await fetch('api/wait-time.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({minutes:Number(chosen)})});const d=await r.json();if(!r.ok||!d.ok)throw Error('save');update(d.minutes);label.textContent='✓';}catch(_){label.textContent='Ei salvestatud';if(latest)select.value=latest;}finally{saving=false;select.disabled=false;setTimeout(()=>{if(label.textContent==='✓')label.textContent='';},2500);}});
 load();setInterval(()=>{if(!document.hidden)load();},12000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
})();
