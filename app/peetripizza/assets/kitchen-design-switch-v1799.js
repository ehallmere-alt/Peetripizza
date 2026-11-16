
(()=>{
'use strict';
const KEY='pp-kitchen-appearance-v1799';

function selected(){
 try{return localStorage.getItem(KEY)==='2'?'2':'1'}
 catch{return '1'}
}

function apply(value){
 document.body.classList.toggle('pp-design-two',value==='2');
}

function init(){
 apply(selected());

 const page=document.getElementById('settingsPage');
 if(!page || document.getElementById('pp1799-themes'))return;

 const section=document.createElement('section');
 section.id='pp1799-themes';
 section.innerHTML=`
  <h3>Kujundus</h3>
  <p>Vali köögi kujundus. Seade kehtib ainult selles seadmes.</p>
  <label>
   <input type="radio" name="pp1799-theme" value="1">
   Kujundus 1 · Klassikaline
  </label>
  <label>
   <input type="radio" name="pp1799-theme" value="2">
   Kujundus 2 · Premium Clean
  </label>`;

 const title=page.querySelector('h2');
 if(title)title.insertAdjacentElement('afterend',section);
 else page.prepend(section);

 const input=section.querySelector(
  'input[value="'+selected()+'"]'
 );
 if(input)input.checked=true;

 section.addEventListener('change',event=>{
  if(event.target.name!=='pp1799-theme')return;
  const value=event.target.value;
  try{localStorage.setItem(KEY,value)}catch{}
  apply(value);
 });

}

if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
 init();
}
})();
