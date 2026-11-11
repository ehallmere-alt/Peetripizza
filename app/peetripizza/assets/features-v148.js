/* v14.8: five selected improvements. Read-only LIVE. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const clean=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const ordersPage=$('ordersPage');let snapshot=[],origin='DEMO';
/* 1+2: operational urgency panel, derived from order-specific time limits */
const panel=document.createElement('section');panel.className='pp148-urgency-panel';
panel.innerHTML='<div class="pp148-urgency-head"><strong>Tellimuste tähtajad</strong><span id="pp148-overdue-count">0 hilinenud</span></div><div id="pp148-urgency-list" class="pp148-urgency-list"><span class="pp148-ok">Kõik graafikus</span></div>';
ordersPage?.querySelector('.pp147-deadlines')?.after(panel);
const remaining=o=>{const c=Number(o.created),m=Number(o.minutes);return c>0&&m>0?Math.ceil(((Number(o.deadline)>0?Number(o.deadline):c+m*60000)-Date.now())/60000):null};
function refresh(){const active=snapshot.filter(o=>['new','active'].includes(o.status));const urgent=active.map(o=>({...o,left:remaining(o)})).filter(o=>o.left!==null&&o.left<=5).sort((a,b)=>a.left-b.left);
$('pp148-overdue-count').textContent=urgent.filter(o=>o.left<=0).length+' hilinenud';
$('pp148-urgency-list').innerHTML=urgent.length?urgent.slice(0,8).map(o=>'<span class="'+(o.left<=0?'pp148-overdue':'pp148-soon')+'">#'+clean(o.id)+' · '+(o.left<=0?'Hilinenud '+Math.abs(o.left)+' min':'Jäänud '+o.left+' min')+'</span>').join(''):'<span class="pp148-ok">Kiireloomulisi tellimusi pole</span>';
}
window.addEventListener('pp145:orders',e=>{snapshot=Array.isArray(e.detail?.orders)?e.detail.orders:[];origin=e.detail?.source||'DEMO';refresh()});setInterval(refresh,30000);
/* 3: sound studio preview. Does not replace or modify live notification logic. */
const sound=document.querySelector('.pp141-sound-settings');
if(sound){
const box=document.createElement('div');box.className='pp148-sound-studio';
box.innerHTML='<div><strong>Helistuudio · kiire tellimus</strong><small>Vali hoiatusheli tugevus ja kuula näidist. Olemasolevad LIVE-teavitused jäävad samaks.</small></div><div class="pp148-sound-controls"><label>Hoiatuse tugevus <input id="pp148-urgent-volume" type="range" min="0" max="100" step="5"><output id="pp148-urgent-volume-label"></output></label><button id="pp148-preview-urgent" type="button">♫ Kuula hoiatust</button></div>';
sound.appendChild(box);
const slider=$('pp148-urgent-volume');slider.value=load('pp148-urgent-volume',65);
const show=()=>{$('pp148-urgent-volume-label').textContent=slider.value+'%'};show();
slider.addEventListener('input',()=>{save('pp148-urgent-volume',Number(slider.value));show()});
$('pp148-preview-urgent').addEventListener('click',async()=>{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const ctx=new Audio();try{await ctx.resume();const now=ctx.currentTime;[0,.17,.34].forEach((delay,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=i===1?950:750;g.gain.setValueAtTime(.0001,now+delay);g.gain.exponentialRampToValueAtTime(Math.max(.0001,Number(slider.value)/100*.12),now+delay+.015);g.gain.exponentialRampToValueAtTime(.0001,now+delay+.14);o.connect(g).connect(ctx.destination);o.start(now+delay);o.stop(now+delay+.15)});setTimeout(()=>ctx.close().catch(()=>{}),900)}catch{ctx.close().catch(()=>{})}});
}
/* 4: order details via click, display only fields supplied by order data */
const modal=document.createElement('dialog');modal.className='pp148-details';modal.innerHTML='<div class="pp148-dialog-head"><h3 id="pp148-dialog-title">Tellimuse andmed</h3><button id="pp148-close" type="button" aria-label="Sulge">✕</button></div><div id="pp148-dialog-content"></div>';
document.body.appendChild(modal);$('pp148-close').addEventListener('click',()=>modal.close());
const detailsBtn=document.createElement('button');detailsBtn.type='button';detailsBtn.className='pp148-details-button';detailsBtn.textContent='Tellimuse detailid';
ordersPage?.querySelector('.pp148-urgency-head')?.appendChild(detailsBtn);
detailsBtn.addEventListener('click',()=>{const rows=snapshot.slice(0,30).map((o,i)=>'<button class="pp148-order-row" type="button" data-pp148-index="'+i+'">#'+clean(o.id)+' · '+clean(o.status)+'</button>').join('');$('pp148-dialog-title').textContent='Tellimuste detailid';$('pp148-dialog-content').innerHTML=rows||'<p>Tellimusi pole laaditud.</p>';modal.showModal()});
modal.addEventListener('click',e=>{const b=e.target.closest('[data-pp148-index]');if(!b)return;const o=snapshot[Number(b.dataset.pp148Index)];if(!o)return;$('pp148-dialog-title').textContent='Tellimus #'+String(o.id);
const items=(o.items||[]).map(x=>'<li>'+clean(Array.isArray(x)?x[0]:x.name||x.title)+' · '+clean(Array.isArray(x)?x[1]:x.quantity||1)+'</li>').join('');
const comment=o.comment||o.notes||o.customerComment||'Kommentaar puudub';$('pp148-dialog-content').innerHTML='<p><b>Staatus:</b> '+clean(o.status)+'</p><p><b>Allikas:</b> '+clean(origin)+'</p><p><b>Kommentaar:</b> '+clean(comment)+'</p><ul>'+items+'</ul><button id="pp148-back" type="button">← Tagasi nimekirja</button>';$('pp148-back').addEventListener('click',()=>detailsBtn.click())});
/* 6: deliberate tablet lock; blocks menu/settings only, never order cards or controls */
let locked=!!load('pp148-tablet-lock',false);
const lock=document.createElement('button');lock.id='pp148-tablet-lock';lock.type='button';lock.className='pp148-lock';lock.setAttribute('aria-pressed',String(locked));
document.querySelector('.pp146-kitchen-strip')?.appendChild(lock);
const draw=()=>{lock.textContent=locked?'🔒 Ava menüü':'🔓 Lukusta menüü';lock.setAttribute('aria-pressed',String(locked));document.body.classList.toggle('pp148-locked',locked)};draw();
lock.addEventListener('click',()=>{locked=!locked;save('pp148-tablet-lock',locked);draw()});
document.addEventListener('click',e=>{if(!locked)return;const b=e.target.closest('#menuBtn,#pp146-open-settings,[data-page="settings"]');if(b){e.preventDefault();e.stopImmediatePropagation()}},true);
})();
