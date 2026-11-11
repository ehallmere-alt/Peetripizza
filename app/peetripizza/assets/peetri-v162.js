/* Peetri Pizza v16.2 — progressive enhancement only. Native status and pickup handlers untouched. */
(()=>{'use strict';
 const root=document.querySelector('#ordersPage .pp157-home-shell');
 if(!root||root.dataset.pp162Ready)return;
 root.dataset.pp162Ready='1';document.body.classList.add('pp162-ui');
 // Keep the previous wait selector in the upper header; avoid any secondary visible controls.
 const wait=document.getElementById('pp158-wait-select');
 const native=document.getElementById('pp114-wait-select');
 if(wait&&native){
  const sync=()=>{if(wait.value!==native.value)wait.value=native.value};
  native.addEventListener('change',sync);sync();
 }
 // Replace decorative legacy symbols with consistent SVG icons; do not touch navigation listeners.
 const icons={
  orders:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  products:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M9 10v10"/>',
  stats:'<path d="M4 20V12M10 20V4M16 20v-9M22 20v-5"/>',
  dough:'<path d="M4 17c2-9 14-9 16 0l-2 3H6zM8 13l-1-3M16 13l1-3"/>',
  bonus:'<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m10 2-.5 2.3-2.2.9-2-1.3-2.4 2.4 1.3 2-.9 2.2L1 11v3l2.3.5.9 2.2-1.3 2 2.4 2.4 2-1.3 2.2.9L10 23h4l.5-2.3 2.2-.9 2 1.3 2.4-2.4-1.3-2 .9-2.2L23 14v-3l-2.3-.5-.9-2.2 1.3-2-2.4-2.4-2 1.3-2.2-.9L14 2z"/>'
 };
 const nav=document.querySelectorAll('#drawer nav .navitem');
 [...nav].forEach((item,i)=>{
  const current=item.querySelector(':scope > span:first-child');
  const paths=Object.values(icons)[i];if(!current||!paths)return;
  current.className='pp162-nav-icon';current.setAttribute('aria-hidden','true');
  current.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
 });
 // Brief tactile response, but no fake completion state: core handlers remain authoritative.
 const cards=document.getElementById('pp157-columns-mount');
 if(cards)cards.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action],button[data-kitchen-action],button.accept,button.done');
  if(!button||button.disabled)return;
  const card=button.closest('.ordercard');if(!card)return;
  card.classList.add('pp162-processing');
  setTimeout(()=>{if(card.isConnected)card.classList.remove('pp162-processing')},650);
 },true);
 // Keep the drawer accessible for keyboard navigation.
 const menu=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
 const close=document.getElementById('closeDrawer');
 if(menu&&drawer&&close){
  drawer.addEventListener('keydown',e=>{if(e.key==='Escape'){close.click();menu.focus()}});
 }
})();
