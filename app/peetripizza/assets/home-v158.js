/* Peetri Pizza v15.8 — One-screen kitchen, view-only enhancements. No vendor API writes. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const home=$('ordersPage')?.querySelector('.pp157-home-shell');if(!home||home.dataset.pp158Ready)return;
home.dataset.pp158Ready='1';document.body.classList.add('pp158-home');
const advanced=$('pp157-more-content'), fast=$('pp157-fast-actions')||home.querySelector('.pp157-fast-actions');
if(!advanced||!fast)return;
/* Top bar stays menu, original brand, LIVE dot, clock and native sound switch.
   A duplicate *display control* is used to preserve original wait-select bindings across other pages. */
const originalWait=$('pp114-wait-select');
if(originalWait){
 const label=document.createElement('label');label.className='pp158-wait';label.htmlFor='pp158-wait-select';
 const cap=document.createElement('span');cap.textContent='Ooteaeg';const select=document.createElement('select');select.id='pp158-wait-select';select.setAttribute('aria-label','Köögi ooteaeg');
 for(const option of originalWait.options){const x=document.createElement('option');x.value=option.value;x.textContent=option.textContent;select.append(x)}
 select.value=originalWait.value;label.append(cap,select);
 fast.querySelector('.pp157-live-action')?.insertAdjacentElement('afterend',label);
 select.addEventListener('change',()=>{originalWait.value=select.value;originalWait.dispatchEvent(new Event('change',{bubbles:true}))});
 originalWait.addEventListener('change',()=>{select.value=originalWait.value});
}
/* Preserve button instances and their listeners. Less-used controls live in expandable tools. */
const audio=home.querySelector('.pp155-audio');if(audio){const slot=document.createElement('div');slot.className='pp158-advanced-sounds';slot.append(audio);advanced.prepend(slot)}
/* Brief urgency state based on existing card urgency (already updated by core timer loop). */
const ops=home.querySelector('.pp157-ops');const urgent=document.createElement('div');urgent.className='pp158-timer-state';urgent.id='pp158-timer-state';urgent.setAttribute('role','status');
urgent.innerHTML='<span class="pp158-state-dot" aria-hidden="true"></span><span id="pp158-timer-message">Ajad kontrolli all</span>';
ops.querySelector('.pp157-metrics')?.insertAdjacentElement('afterend',urgent);
/* Inline pickup section uses existing DOM + native action handlers; no duplicated POST requests. */
const pickupTarget=$('pp157-ready-section'), done=$('doneOrders'), newList=$('newOrders'), activeList=$('activeOrders');
if(!pickupTarget||!done||!newList||!activeList)return;
const quick=document.createElement('section');quick.className='pp158-pickup-quick';quick.id='pp158-pickup-quick';quick.setAttribute('aria-label','Väljastamise kiirvaade');
quick.innerHTML=`<div class="pp158-pickup-head"><div><span class="pp158-pickup-kicker">03 / VÄLJASTUS</span><strong>Valmis · ootab klienti <span id="pp158-pickup-count">0</span></strong></div><div class="pp158-pickup-actions"><button type="button" id="pp158-view-ready">Vaata kõiki</button><button type="button" id="pp158-open-station">📦 Väljastus</button></div></div><div id="pp158-pickup-rows" class="pp158-pickup-rows" aria-live="polite"></div><small class="pp158-pickup-note">Üleandmine salvestub ainult meie köögisüsteemi, mitte Peetri Pizza ametlikku API-sse.</small>`;
pickupTarget.prepend(quick);
const nativeHistory=$('toggleHistory');const nativeStation=$('pp155-pickup-open');
$('pp158-view-ready').addEventListener('click',()=>{
 if(nativeHistory?.getAttribute('aria-expanded')!=='true')nativeHistory?.click();
 pickupTarget.scrollIntoView({behavior:'smooth',block:'start'});
});
$('pp158-open-station').addEventListener('click',()=>nativeStation?.click());
function historyView(){pickupTarget.classList.toggle('pp158-history-open',nativeHistory?.getAttribute('aria-expanded')==='true')}
if(nativeHistory){new MutationObserver(historyView).observe(nativeHistory,{attributes:true,attributeFilter:['aria-expanded']});historyView()}
const rowsEl=$('pp158-pickup-rows');
let currentRecords={},connected=false,scheduled=false,lastFingerprint='',waitingCount=0,autoRush=false;
const showWait=ms=>{const m=Math.floor(ms/60000);return Number.isFinite(m)&&m>=0?m+' min':'—'};
function pickupCards(){
 const live=document.body.classList.contains('live-active');
 return [...done.querySelectorAll('.pp112-done-card')].filter(card=>{
  const id=card.dataset.orderId||'';
  if(live&&!/^live-[a-f0-9]{24}$/.test(id))return false;
  if(!live&&!/^demo-[a-zA-Z0-9-]{1,80}$/.test(id))return false;
  const key=(live?'live:':'demo:')+id;
  return !currentRecords[key]?.handed_at;
 }).sort((a,b)=>{const aa=Number(a.dataset.readyAt),bb=Number(b.dataset.readyAt);
  return (aa>0?aa:Number.MAX_SAFE_INTEGER)-(bb>0?bb:Number.MAX_SAFE_INTEGER);
 });
}
function renderPickup(){
 const cards=pickupCards();waitingCount=cards.length;
 $('pp158-pickup-count').textContent=String(waitingCount);
 const top=cards.slice(0,3);
 const fingerprint=top.map(c=>[c.dataset.orderId,c.dataset.readyAt,c.querySelector('.pp154-handover')?.disabled].join(':')).join('|')+'#'+waitingCount+'#'+connected;
 const currentRows=[...rowsEl.querySelectorAll('.pp158-pickup-row')];
 if(fingerprint!==lastFingerprint||currentRows.length!==top.length){
  lastFingerprint=fingerprint;rowsEl.replaceChildren();
  if(!top.length){const empty=document.createElement('p');empty.className='pp158-empty';empty.textContent=connected?'Kõik valmis tellimused on väljastatud.':'Valmis tellimusi pole või serveri sünkroon puudub.';rowsEl.append(empty)}
  top.forEach(card=>{
   const id=card.dataset.orderId;const row=document.createElement('div');row.className='pp158-pickup-row';row.dataset.orderId=id;
   const name=card.querySelector('.pp112-customer')?.textContent||'';const number=card.querySelector('.pp112-number')?.textContent||'#—';
   const head=document.createElement('div');head.className='pp158-pickup-person';
   const strong=document.createElement('strong');strong.textContent=number;
   const small=document.createElement('small');small.textContent=name;head.append(strong,small);
   const ago=document.createElement('span');ago.className='pp158-pickup-age';
   const button=document.createElement('button');button.type='button';button.className='pp158-handover';button.textContent='✓ Üle antud';
   button.disabled=!connected||!card.querySelector('.pp154-handover')||card.querySelector('.pp154-handover').disabled;
   button.addEventListener('click',()=>{
    const native=[...done.querySelectorAll('.pp112-done-card')].find(c=>c.dataset.orderId===id)?.querySelector('.pp154-handover');
    if(!native||native.disabled||!connected)return;
    button.disabled=true;native.click();
   });
   row.append(head,ago,button);rowsEl.append(row);
  });
 }
 for(const card of top){const row=[...rowsEl.querySelectorAll('.pp158-pickup-row')].find(r=>r.dataset.orderId===card.dataset.orderId);if(!row)continue;
  const stamp=Number(card.dataset.readyAt),ago=stamp>0&&Number.isFinite(stamp)?Date.now()-stamp:null;
  const age=row.querySelector('.pp158-pickup-age');age.textContent=ago===null?'Aeg teadmata':'Ootab '+showWait(Math.max(0,ago));
  row.classList.toggle('pp158-pickup-late',ago!==null&&ago>=15*60000);
  const action=row.querySelector('button'),native=card.querySelector('.pp154-handover');action.disabled=!connected||!native||native.disabled;
 }
}
function renderUrgency(){const cards=[...newList.querySelectorAll('.ordercard'),...activeList.querySelectorAll('.ordercard')];
 let late=0,soon=0;for(const card of cards){if(card.classList.contains('urgency-late'))late++;else if(card.classList.contains('urgency-soon'))soon++;
  const timer=card.querySelector('.pp117-countdown');if(timer)timer.setAttribute('aria-label',card.classList.contains('urgency-late')?'Tähtaeg ületatud':card.classList.contains('urgency-soon')?'Vähem kui viis minutit jäänud':'Aega jäänud');
 }
 const total=cards.length;autoRush=total>=6;
 home.classList.toggle('pp158-rush',autoRush);
 home.dataset.urgency=late?'late':soon?'soon':'normal';
 const msg=late?late+' hilinenud'+(soon?' · '+soon+' kiiret':''):soon?soon+' kiiret · jälgi taimerit':total>=6?'Tihe töörežiim · '+total+' aktiivset tellimust':'Ajad kontrolli all';
 const el=$('pp158-timer-message');if(el.textContent!==msg)el.textContent=msg;
}
function paint(){scheduled=false;renderUrgency();renderPickup()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint)}
for(const el of [newList,activeList,done])new MutationObserver(schedule).observe(el,{childList:true});
window.addEventListener('pp155:pickup-state',e=>{currentRecords=e.detail?.records||{};connected=!!e.detail?.connected;schedule()});
for(const name of ['pp150:live-synced','pp150:live-stopped','pp155:status-saved'])window.addEventListener(name,schedule);
setInterval(()=>{if(!document.hidden)paint()},15000);
schedule();
})();
