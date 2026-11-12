/* Peetri Pizza v17.55 — owner: "Valmis" out of the header. The header button (#pp171-ready, ops-v171) stays hidden in place;
 * the menu gets "Valmis" that presses it, so the finished-orders view is still one tap away. */
(function(){
 'use strict';
 if(window.PP1755)return;
 const $=id=>document.getElementById(id);
 function mount(){
  const nav=document.querySelector('#drawer nav');if(!nav||$('pp1755-ready-nav')||!$('pp171-ready'))return;
  const b=document.createElement('button');b.type='button';b.id='pp1755-ready-nav';b.className='navitem';b.innerHTML='<span aria-hidden="true">✓</span> Valmis';
  const st=nav.querySelector('[data-page="statistics"]');st?st.after(b):nav.append(b);
 }
 window.addEventListener('click',e=>{
  if(!(e.target instanceof Element)||!e.target.closest('#pp1755-ready-nav'))return;
  e.preventDefault();e.stopPropagation();$('closeDrawer')?.click();setTimeout(()=>$('pp171-ready')?.click(),60);
 },true);
 const go=()=>{mount();let n=0;const t=setInterval(()=>{mount();if(++n>20||$('pp1755-ready-nav'))clearInterval(t);},500);};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
 window.PP1755={mount};
})();
