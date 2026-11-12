/* Peetri Pizza v17.35 — owner: fullscreen button in the header where the sound button was; sound on/off moves to the side menu;
 * "Lõpeta vahetus" hidden from the menu (only hidden, the module stays). */
(function(){
 'use strict';
 if(window.PP1735)return;
 const $id=id=>document.getElementById(id);
 function soundLabel(){const s=$id('soundBtn');const off=!s||s.getAttribute('aria-pressed')==='false';return off?'Heli väljas · lülita sisse':'Heli sees · lülita välja';}
 function place(){
  const s=$id('soundBtn'),fs=$id('pp173-fullscreen');
  if(s&&fs&&s.previousElementSibling!==fs)s.before(fs);
  const nav=document.querySelector('#drawer nav');
  if(nav&&!$id('pp1735-sound-nav')){const b=document.createElement('button');b.type='button';b.id='pp1735-sound-nav';b.className='navitem';b.innerHTML='<span>♫</span> <em></em>';
   const st=nav.querySelector('[data-page="settings"]');st?nav.insertBefore(b,st):nav.append(b);}
  const t=$id('pp1735-sound-nav')?.querySelector('em');if(t){const l=soundLabel();if(t.textContent!==l)t.textContent=l;}
 }
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  if(t.closest('#pp1735-sound-nav')){e.preventDefault();e.stopPropagation();$id('soundBtn')?.click();setTimeout(place,50);}
 },true);
 setInterval(place,1500);setTimeout(place,200);
 window.PP1735={place};
})();
