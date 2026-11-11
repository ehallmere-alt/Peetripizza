/* v11.3: optional per-order ingredients; no LIVE mutations. */
(()=>{'use strict';
 const list=document.getElementById('doneOrders'),tools=document.getElementById('historyTools');
 if(!list||!tools)return;
 const collapsed=new Set();let allCollapsed=false;let pending=false;
 const all=document.createElement('button');all.type='button';all.className='pp113-all-toggle';all.textContent='Peida lisandid';
 tools.appendChild(all);
 const cards=()=>Array.from(list.querySelectorAll('.pp112-done-card'));
 function decorate(){pending=false;for(const card of cards()){
   const key=card.getAttribute('aria-label')||'';
   const hasAdded=!!card.querySelector('.pp94-extras');
   const compact=collapsed.has(key)||allCollapsed;
   if(!hasAdded){card.classList.remove('pp113-compact');card.querySelector('.pp113-detail-toggle')?.remove();continue;}
   card.classList.toggle('pp113-compact',compact);
   let button=card.querySelector('.pp113-detail-toggle');
   if(!button){button=document.createElement('button');button.type='button';button.className='pp113-detail-toggle';
     button.dataset.key=key;card.querySelector('.pp112-card-footer')?.prepend(button);}
   button.textContent=compact?'+ Lisandid':'− Lisandid';button.setAttribute('aria-expanded',String(!compact));
 }
 const total=cards().filter(card=>card.querySelector('.pp94-extras')).length;
 all.hidden=total===0;
 all.textContent=allCollapsed?'Näita kõiki lisandeid':'Peida kõik lisandid';
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(decorate);}
 list.addEventListener('click',e=>{const b=e.target.closest('.pp113-detail-toggle');if(!b)return;
 const key=b.dataset.key;if(allCollapsed){allCollapsed=false;for(const card of cards())collapsed.add(card.getAttribute('aria-label')||'');}
 if(collapsed.has(key))collapsed.delete(key);else collapsed.add(key);decorate();});
 all.addEventListener('click',()=>{allCollapsed=!allCollapsed;collapsed.clear();decorate();});
 new MutationObserver(schedule).observe(list,{childList:true});decorate();
})();
