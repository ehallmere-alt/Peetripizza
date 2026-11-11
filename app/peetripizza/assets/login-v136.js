(()=>{'use strict';
const form=document.getElementById('pp78-login-form');if(!form)return;
const input=document.getElementById('pp78-search');
const clear=document.getElementById('pp78-search-clear');
const reset=document.getElementById('pp78-reset');
const filters=Array.from(document.querySelectorAll('.pp78-city'));
const branches=Array.from(document.querySelectorAll('.pp78-branch'));
const select=document.getElementById('pizzeria_id');
const native=document.getElementById('pp78-native');
const count=document.getElementById('pp78-list-count');
const empty=document.getElementById('pp78-empty');
const feedback=document.getElementById('pp78-feedback');
const current=document.getElementById('pp78-current');
const currentName=document.getElementById('pp78-current-name');
const currentHint=document.getElementById('pp78-current-hint');
const submit=document.getElementById('pp78-submit');
const password=document.getElementById('password');
const toggle=document.getElementById('pp78-toggle');
const access=document.querySelector('.pp78-access');
const directory=document.getElementById('pp136-directory');
const dirToggle=document.getElementById('pp136-directory-toggle');
const dirBody=document.getElementById('pp136-directory-body');
function setDirectoryOpen(open){
 if(!directory||!dirBody||!dirToggle)return;
 directory.classList.toggle('pp136-open',open);
 dirBody.hidden=!open;
 dirToggle.setAttribute('aria-expanded',String(open));
 dirToggle.innerHTML=open?'Sulge kataloog <span aria-hidden="true">⌃</span>':'Sirvi kõiki asukohti <span aria-hidden="true">⌄</span>';
}
if(dirToggle)dirToggle.addEventListener('click',()=>setDirectoryOpen(!directory.classList.contains('pp136-open')));

let city='', selected=null;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('et').replace(/\s+/g,' ').trim();
const emitStatus=(message,kind='')=>{feedback.textContent=message;feedback.classList.toggle('is-notice',kind==='notice');feedback.classList.toggle('is-ok',kind==='ok');};
function filterList(){
 const term=norm(input.value);let visible=0;
 branches.forEach(row=>{
  const name=norm(row.dataset.name),place=norm(row.dataset.city);
  const match=(!city||city===row.dataset.city)&&(!term||name.includes(term)||place.includes(term));
  row.hidden=!match;if(match)visible++;
 });
 count.textContent=`${visible} / ${branches.length} pitseeriat`;
 empty.hidden=visible!==0;
 clear.hidden=!term;
 reset.hidden=!city && !term;
 filters.forEach(btn=>{let active=btn.dataset.city===city;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',active?'true':'false');});
}
function choose(row){
 selected=row;
 branches.forEach(b=>{let active=b===row;b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',active?'true':'false');});
 const id=row.dataset.locationId;
 const name=row.dataset.name;
 const place=row.dataset.city;
 currentName.textContent=name;
 current.classList.toggle('is-ready',!!id);
 current.classList.toggle('is-pending',!id);
 if(id){
  // Select only a server-configured ID supplied in the original login options.
  const option=Array.from(select.options).find(o=>o.value===id);
  if(!option){select.value='';submit.disabled=true;currentHint.textContent='Vajab ühendamist';emitStatus('Selle pitseeria ligipääs ei ole seadistatud.','notice');return;}
  select.value=id;submit.disabled=false;
  currentHint.textContent=place+' · Sisselogimine seadistatud';
  emitStatus('Sisesta oma pitseeria parool, et avada töölaud.','ok');
  if(window.innerWidth<=730)access.scrollIntoView({behavior:'auto',block:'start'});
  password.focus({preventScroll:true});
 }else{
  select.value='';submit.disabled=true;
  currentHint.textContent=place+' · Vajab ühendamist';
  emitStatus('Pitseeria on ametlikus kataloogis, kuid selle sisemine ID pole Service Appis kinnitatud. Sisselogimine pole veel saadaval.','notice');
  if(window.innerWidth<=730)access.scrollIntoView({behavior:'smooth',block:'start'});
 }
}
filters.forEach(btn=>btn.addEventListener('click',()=>{city=btn.dataset.city||'';filterList();}));
branches.forEach(row=>row.addEventListener('click',()=>choose(row)));
input.addEventListener('input',filterList);
clear.addEventListener('click',()=>{input.value='';filterList();input.focus();});
reset.addEventListener('click',()=>{input.value='';city='';filterList();});
if(toggle){toggle.addEventListener('click',()=>{const reveal=password.type==='password';password.type=reveal?'text':'password';toggle.textContent=reveal?'Peida':'Näita';toggle.setAttribute('aria-pressed',String(reveal));toggle.setAttribute('aria-label',reveal?'Peida parool':'Näita parooli');});}
// Keep the native select for browsers with JavaScript disabled. Enhanced UI uses it as the exact form value.
select.required=true;
native.hidden=false;
submit.disabled=true;
select.addEventListener('change',()=>{
 const id=select.value;
 const option=select.options[select.selectedIndex];
 const row=branches.find(b=>b.dataset.locationId===id && id!=='');
 branches.forEach(b=>{const active=b===row;b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active));});
 selected=row||null;
 currentName.textContent=id?(option?.textContent||'Valitud töökoht'):'Pole valitud';
 currentHint.textContent=id?'Sisselogimine seadistatud':'Vali töökoht nimekirjast';
 current.classList.toggle('is-ready',!!id);
 current.classList.remove('is-pending');
 submit.disabled=!id;
 emitStatus(id?'Sisesta parool, et avada töölaud.':'Vali töökoht ja sisesta parool.',id?'ok':'');
});
setDirectoryOpen(false);
form.addEventListener('submit',event=>{if(!select.value){event.preventDefault();emitStatus('Vali sisselogimiseks seadistatud pitseeria.','notice');}});
filterList();
})();
