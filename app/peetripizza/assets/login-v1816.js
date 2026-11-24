/* Peetri Pizza v18.16 — login: the pizzeria used last on this device goes to the top of the list and is chosen. */
(function(){
 'use strict';
 const list=document.getElementById('pl-places');if(!list)return;
 let last='';try{last=localStorage.getItem('pp-login-place-v175')||''}catch(_){}
 if(!last)return;
 const input=[...list.querySelectorAll('input[name="pizzeria_id"]')].find(r=>r.value===last);
 const label=input&&input.closest('.pl-place');
 if(!label)return;
 // An error answer keeps the pizzeria the cook just tried; otherwise the device's last choice wins.
 if(!document.querySelector('.pl-msg-error'))input.checked=true;
 if(label!==list.firstElementChild){list.insertBefore(label,list.firstElementChild);list.scrollTop=0;}
})();
