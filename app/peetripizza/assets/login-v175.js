/* Peetri Pizza v17.5 — login helpers. The form works without this script. Stores only the chosen pizzeria id. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const KEY='pp-login-place-v175';
 const read=()=>{try{return localStorage.getItem(KEY)||''}catch(_){return ''}};
 const save=v=>{try{localStorage.setItem(KEY,String(v))}catch(_){}};
 const form=$('pl-form');if(!form)return;
 const radios=[...form.querySelectorAll('input[name="pizzeria_id"]')];
 const pass=$('password'),submit=$('pl-submit');
 // Clock & date
 const clock=$('pl-clock'),date=$('pl-date');
 function tick(){const d=new Date();if(clock)clock.textContent=d.toLocaleTimeString('et-EE',{hour:'2-digit',minute:'2-digit'});if(date)date.textContent=d.toLocaleDateString('et-EE',{weekday:'long',day:'numeric',month:'long'});}
 tick();setInterval(tick,10000);
 // Remember last pizzeria
 const last=read();
 if(!radios.some(r=>r.checked)&&last){const r=radios.find(x=>x.value===last);if(r)r.checked=true;}
 const lastRadio=radios.find(x=>x.value===last);
 if(lastRadio)lastRadio.closest('.pl-place')?.querySelector('.pl-place-last')?.removeAttribute('hidden');
 const checked=radios.find(r=>r.checked);
 if(checked)checked.closest('.pl-place')?.scrollIntoView({block:'nearest'});
 // Focus where the cook has to act
 // v17.20: on a phone/touch screen do not focus on load (the keyboard jumped up and covered the page).
 const touch=matchMedia('(pointer:coarse)').matches||matchMedia('(max-width:600px)').matches;
 if(!touch)setTimeout(()=>{if(checked||!radios.length)pass?.focus();},60);
 radios.forEach(r=>r.addEventListener('change',()=>{if(!touch)pass?.focus();else pass?.scrollIntoView({block:'center',behavior:'smooth'});}));
 // Search (only rendered when there are many places)
 const search=$('pl-search');
 if(search){search.hidden=false;search.addEventListener('input',()=>{const q=search.value.trim().toLocaleLowerCase('et-EE');let n=0;
  form.querySelectorAll('.pl-place').forEach(p=>{const ok=!q||(p.dataset.name||'').includes(q);p.hidden=!ok;if(ok)n++;});$('pl-empty').hidden=n>0;});}
 // Show/hide password
 const eye=$('pl-eye');
 eye?.addEventListener('click',()=>{const show=pass.type==='password';pass.type=show?'text':'password';eye.textContent=show?'Peida':'Näita';eye.setAttribute('aria-pressed',String(show));eye.setAttribute('aria-label',show?'Peida parool':'Näita parooli');pass.focus();});
 // Caps Lock hint
 const caps=$('pl-caps');
 const capsCheck=e=>{if(caps&&e.getModifierState)caps.hidden=!e.getModifierState('CapsLock');};
 pass?.addEventListener('keydown',capsCheck);pass?.addEventListener('keyup',capsCheck);pass?.addEventListener('blur',()=>{if(caps)caps.hidden=true;});
 pass?.addEventListener('input',()=>pass.removeAttribute('aria-invalid'));
 // Offline hint
 const off=$('pl-offline');const net=()=>{if(off)off.hidden=navigator.onLine!==false;};
 window.addEventListener('online',net);window.addEventListener('offline',net);net();
 // Validate + no double submit
 function shake(el){el.classList.remove('pl-shake');void el.offsetWidth;el.classList.add('pl-shake');}
 let busy=false;
 form.addEventListener('submit',e=>{
  if(busy){e.preventDefault();return;}
  const place=radios.find(r=>r.checked);
  if(radios.length&&!place){e.preventDefault();shake($('pl-places'));radios[0].focus();return;}
  if(!pass.value){e.preventDefault();pass.setAttribute('aria-invalid','true');shake(pass);pass.focus();return;}
  if(place)save(place.value);
  busy=true;submit.classList.add('is-busy');submit.disabled=true;submit.querySelector('.pl-submit-text').textContent='Sisenen…';
 });
 // Back/forward cache: never leave the button stuck in "busy".
 window.addEventListener('pageshow',()=>{busy=false;submit.classList.remove('is-busy');submit.disabled=false;submit.querySelector('.pl-submit-text').textContent='Ava köögi töölaud';});
 if(document.querySelector('.pl-msg-error[data-kind="password"]')){pass.value='';shake(pass);}
})();
