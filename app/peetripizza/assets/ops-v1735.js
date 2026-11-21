/* Peetri Pizza v17.35 — owner: fullscreen button in the header where the sound button was; sound on/off moves to the side menu;
 * "Lõpeta vahetus" hidden from the menu (only hidden, the module stays). */
(function(){
 'use strict';
 if(window.PP1735)return;
 const $id=id=>document.getElementById(id);
 function soundLabel(){
  const d=window.PPSound?.diagnostics?.();
  let enabled=false;
  try {
    enabled=typeof d?.enabled==='boolean'
      ? d.enabled
      : JSON.parse(localStorage.getItem('pp-sound-v1'))===true;
  } catch (_) {
    enabled=$id('soundBtn')?.getAttribute('aria-pressed')==='true';
  }
  if(!enabled)return 'Heli: väljas';
  if(d?.state==='running' && Number(d.volume)>0)
    return 'Heli: aktiivne';
  return 'Heli: sees · aktiveeri';
}
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
