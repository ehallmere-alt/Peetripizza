/* Peetri Pizza v17.24 — design pack 3, owner said "Давай" to all six.
 * 1: late card: red pulsing frame (CSS only, ops-v1724.css).
 * 2: order type as a coloured strip on the left of the card: Kulleriga / Kaasa / Kohapeal.
 * 3: smooth move: after "Võta vastu" / "Valmis" the cards glide to their new place instead of jumping.
 * 4: one toast for the whole app: big, top centre, colour by meaning, hides itself.
 * 5: dialogs as a sheet from the bottom; the browser confirm() windows become a sheet too
 *    (the browser window froze timers and LIVE while it was open).
 * 6: Statistika in the card style (CSS only).
 * Nothing here talks to the server or to peetripizza.ee.
 */
(function(){
 'use strict';
 if(window.PP1724)return;
 const $=id=>document.getElementById(id);
 const root=document.documentElement;
 const calm=()=>root.classList.contains('pp1714-lite')||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

 /* 2: order type */
 function typeOf(card){
  const s=card.querySelector('.pp118-serving');if(!s)return '';
  if(/KOHAPEAL/i.test(s.textContent||''))return 'kohapeal';
  return s.classList.contains('pp118-delivery')?'kuller':'kaasa';
 }
 function tag(){
  for(const c of document.querySelectorAll('#ordersPage .ordercard')){
   const t=typeOf(c);if(!t||c.dataset.pp1724t===t)continue;
   c.classList.remove('pp1724-t-kuller','pp1724-t-kaasa','pp1724-t-kohapeal');
   c.classList.add('pp1724-t-'+t);c.dataset.pp1724t=t;
  }
 }

 /* 3: smooth move (FLIP). A tap on a card button remembers where every card was;
  * after the next render each card slides from the old place to the new one. */
 let snap=null;
 function rects(){const m=new Map();for(const c of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){const r=c.getBoundingClientRect();if(r.width)m.set(c.dataset.orderId,r);}return m;}
 window.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  const card=t.closest('#ordersPage .ordercard[data-order-id]');
  if(!card||!t.closest('button'))return;
  if(t.closest('[data-action="details"],.details,.pp155-share-btn'))return;
  const r=card.getBoundingClientRect();
  snap={at:Date.now(),pos:rects(),id:card.dataset.orderId,ghost:card.cloneNode(true),r};
 },true);
 function flip(){
  if(!snap||Date.now()-snap.at>8000){snap=null;return;}
  const s=snap,now=rects();
  // nothing moved yet (the click was cancelled, or the server has not answered): keep waiting
  const moved=[...now].some(([id,r])=>{const o=s.pos.get(id);return !o||Math.abs(o.top-r.top)>2||Math.abs(o.left-r.left)>2;})||!now.has(s.id);
  if(!moved)return;
  snap=null;if(calm())return;
  for(const c of document.querySelectorAll('#ordersPage .ordercard[data-order-id]')){
   const o=s.pos.get(c.dataset.orderId),n=now.get(c.dataset.orderId);if(!o||!n)continue;
   const dx=o.left-n.left,dy=o.top-n.top;if(Math.abs(dx)<2&&Math.abs(dy)<2)continue;
   try{c.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:dx?420:300,easing:'cubic-bezier(.2,.8,.2,1)'});}catch(_){}
  }
  if(!now.has(s.id)&&s.ghost){ // the card left the screen (Valmis): let it fade out where it stood
   const g=s.ghost;g.classList.add('pp1724-ghost');g.removeAttribute('data-order-id');
   g.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
   Object.assign(g.style,{position:'fixed',left:s.r.left+'px',top:s.r.top+'px',width:s.r.width+'px',height:s.r.height+'px',margin:'0',zIndex:'50',pointerEvents:'none'});
   const host=$('ordersPage')||document.body;host.append(g);
   let a=null;try{a=g.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX(60px) scale(.96)'}],{duration:380,easing:'ease-in',fill:'forwards'});}catch(_){}
   if(a)a.onfinish=()=>g.remove();setTimeout(()=>g.remove(),900);
  }
 }

 window.addEventListener('pp145:orders',()=>{queueMicrotask(()=>{try{flip()}catch(_){};try{tag()}catch(_){}});});
 setInterval(tag,2000);setTimeout(tag,300);

 /* 4: one toast */
 function tone(t){
  t=String(t||'');
  if(/ebaõnnestus|ei õnnestunud|ei saanud|viga|error|katkes|puudub|ei tööta|ühendus puudub/i.test(t))return 'bad';
  if(/tühist|tagasi|hoiatus|⚠|ainult lugemiseks|oota|kontrolli|offline|vaikne/i.test(t))return 'warn';
  return 'ok';
 }
 const ICON={ok:'✓',warn:'!',bad:'✕'};
 let toastTimer=0;
 function toast(text){
  const el=$('toast');if(!el)return;
  const k=tone(text);
  el.classList.add('pp1724-toast');el.classList.remove('pp1724-ok','pp1724-warn','pp1724-bad');el.classList.add('pp1724-'+k);
  el.innerHTML='';const i=document.createElement('b');i.textContent=ICON[k];const s=document.createElement('span');s.textContent=String(text??'');el.append(i,s);
  el.classList.add('show');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),k==='bad'?5000:3000);
 }
 try{window.toast=toast;}catch(_){}
 document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('#toast.pp1724-toast')){clearTimeout(toastTimer);$('toast').classList.remove('show');}});

 /* 5: confirm() as a sheet. When a button click asks confirm(), we answer "no" for now, show the sheet,
  * and on "Jah" click the same button again with every confirm() answering "yes". */
 const nativeConfirm=window.confirm.bind(window);
 let lastClick=null,allow=false,sheet=null,askedAt=0;
 window.addEventListener('click',e=>{lastClick=e;},true);
 function findAgain(el){
  if(el.isConnected)return el;
  const sel=['data-kitchen-action','data-action','data-id','data-order-id','data-product','data-pp155-key'].filter(a=>el.hasAttribute(a)).map(a=>'['+a+'="'+CSS.escape(el.getAttribute(a))+'"]').join('');
  if(sel)return document.querySelector(el.tagName.toLowerCase()+sel);
  return null;
 }
 function closeSheet(){if(!sheet)return;const s=sheet;sheet=null;s.classList.remove('open');setTimeout(()=>s.remove(),220);}
 function openSheet(msg,target){
  closeSheet();
  const valmis=/valmis/i.test(msg)&&!/tühist/i.test(msg);
  const risky=/tühist|tühjend|taasta|kustuta/i.test(msg);
  const w=document.createElement('div');w.className='pp1724-sheet-wrap';
  w.innerHTML='<div class="pp1724-sheet" role="dialog" aria-modal="true"><i class="pp1724-grip"></i><p></p><div class="pp1724-sheet-btns"><button type="button" class="pp1724-no">Tagasi</button><button type="button" class="pp1724-yes"></button></div></div>';
  w.querySelector('p').textContent=msg;
  const yes=w.querySelector('.pp1724-yes');yes.textContent=valmis?'✓ Jah, valmis':'Jah';if(risky)yes.classList.add('risky');
  w.addEventListener('click',e=>{
   if(e.target===w||e.target.closest('.pp1724-no')){e.stopPropagation();closeSheet();return;}
   if(e.target.closest('.pp1724-yes')){
    e.stopPropagation();closeSheet();
    const el=findAgain(target);if(!el){toast('Tellimus muutus vahepeal, proovi uuesti');return;}
    // peetri-v163 ignores a second tap on the same order button within 1.4 s (double-tap guard);
    // the "Jah" tap is a confirmed repeat, so during this one click its clock runs 1.5 s ahead.
    const pn=performance.now,shift=Math.max(0,1500-(Date.now()-askedAt));
    allow=true;try{if(shift)performance.now=()=>pn.call(performance)+shift;el.click();}finally{allow=false;if(shift)performance.now=pn;}
   }
  });
  document.body.append(w);sheet=w;requestAnimationFrame(()=>w.classList.add('open'));
  setTimeout(()=>yes.focus({preventScroll:true}),50);
 }
 document.addEventListener('keydown',e=>{if(sheet&&e.key==='Escape')closeSheet();});
 window.confirm=function(msg){
  if(allow)return true;
  const ev=window.event;
  const t=ev&&ev===lastClick&&ev.type==='click'&&ev.target instanceof Element?ev.target:null;
  const btn=t&&!t.closest('input,select,textarea,label')?t.closest('button,a,[role="button"],.pp140-card'):null;
  if(!btn||root.classList.contains('pp1724-native-confirm'))return nativeConfirm(msg);
  askedAt=Date.now();openSheet(String(msg??''),btn);
  return false;
 };

 /* 5: Ooteaeg tiles as a sheet: the popup is placed by ops-v1722 under the button; CSS moves it down. */

 window.PP1724={tag,flip,toast,tone,closeSheet};
})();
