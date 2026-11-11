'use strict';
const $ = id => document.getElementById(id);
const now = Date.now();
const DEFAULT_ORDERS = [
 {id:'demo-101',number:101,status:'new',customerName:'Mari (DEMO)',items:[['Pepperoni pizza',1],['Coca-Cola 0,5 l',1]],amount:14.90,created:now-3*60000,minutes:20,serving:'takeAway',payment:'online'},
 {id:'demo-102',number:102,status:'new',customerName:'Mari (DEMO)',items:[['Margherita pizza',2],['Küüslaugukaste',1]],amount:22.50,created:now-6*60000,minutes:20,serving:'takeAway',payment:'card'},
 {id:'demo-103',number:103,status:'active',customerName:'Jaan (DEMO)',items:[['BBQ kana pizza',1],['Friikartulid',1]],amount:19.40,created:now-11*60000,minutes:20,serving:'delivery',payment:'online'},
 {id:'demo-104',number:104,status:'active',customerName:'Jaan (DEMO)',items:[['Hawaii pizza',1],['Vesi',2]],amount:17.20,created:now-18*60000,minutes:20,serving:'takeAway',payment:'cash'},
 {id:'demo-105',number:105,status:'done',customerName:'Katrin (DEMO)',items:[['Margherita pizza',1],['Coca-Cola 0,5 l',1]],amount:13.50,created:now-27*60000,completed:now-8*60000,minutes:20,serving:'takeAway',payment:'online'}
];
const safeLoad=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch{return fallback}};
let filter='all';
let orderQuery='';
let orderSort='urgent';
let compact=!!safeLoad('pp-compact-v11',false);
let showHistory=false;
let urgentOnly=false;
let historyQuery='';
let historySort='newest';
let overviewExpanded=!!safeLoad('pp-overview-expanded-v22',false);
let focusMode=!!safeLoad('pp-focus-v15',false);
let orders=safeLoad('pp-demo-orders-v1',DEFAULT_ORDERS);
let previewOrders=null;
const shownOrders=()=>previewOrders===null?orders:previewOrders;
const isPreview=()=>previewOrders!==null;
let minutes=Math.max(5,Math.min(120,Number(safeLoad('pp-minutes-v1',20))||20));
let sound=!!safeLoad('pp-sound-v1',false);
let couriers=safeLoad('pp-couriers-v1',['Kuller 1','Kuller 2']);
// Toodete saadavus is local demo state; none of these entries update the upstream menu.
const PRODUCT_CATALOG=[
 ['Pitsad','Pepperoni'],['Pitsad','Margherita'],['Pitsad','Hawaii'],['Pitsad','BBQ kana'],['Pitsad','Bolognese'],['Pitsad','Topolino'],
 ['Lisandid','Juust'],['Lisandid','Mozzarella'],['Lisandid','Pepperoni lisand'],['Lisandid','Sink'],['Lisandid','Peekon'],['Lisandid','Seened'],['Lisandid','Jalapeño'],['Lisandid','Ananass'],['Lisandid','Sibul'],['Lisandid','Küüslaugukaste'],['Lisandid','Ranch kaste'],
 ['Joogid','Coca-Cola 0,5 l'],['Joogid','Coca-Cola Zero 0,5 l'],['Joogid','Fanta 0,5 l'],['Joogid','Sprite 0,5 l'],['Joogid','Vesi 0,5 l'],['Joogid','Mahl 0,33 l']
];
const oldProductState=safeLoad('pp-products-v1',[]);
const savedProducts=Array.isArray(oldProductState)?oldProductState:[];
let products=PRODUCT_CATALOG.map(([category,name])=>{
 const old=savedProducts.find(p=>p&&typeof p.name==='string'&&p.name===name);
 return {category,name,available:old?!!old.available:true};
});
let productCategory='Kõik';
let productQuery='';
let productStatus='Kõik';
let productUndo=null;
let productUndoTimer=null;
const saveProducts=()=>localStorage.setItem('pp-products-v1',JSON.stringify(products));
const save=()=>localStorage.setItem('pp-demo-orders-v1',JSON.stringify(orders));
// One-step reversible demo workflow. Never applies to imported JSON or a remote system.
let lastDemoChange=null;
let undoTimeout=null;
function clearUndo(){lastDemoChange=null;clearTimeout(undoTimeout);const bar=$('undoBar');if(bar)bar.hidden=true;}
function offerUndo(order,before,label){
 clearUndo();
 lastDemoChange={id:order.id,before:{...before},afterStatus:order.status};
 $('undoText').textContent=label+' · 15 sek jooksul saab tagasi võtta';
 $('undoBar').hidden=false;
 undoTimeout=setTimeout(clearUndo,15000);
}
function undoDemoChange(){
 if(!lastDemoChange||isPreview())return clearUndo();
 const record=lastDemoChange;
 const current=orders.find(o=>o.id===record.id);
 if(!current||current.status!==record.afterStatus)return clearUndo();
 Object.assign(current,record.before);save();clearUndo();renderOrders();renderAux();toast('Viimane muudatus tühistatud');
}

const pad=n=>String(n).padStart(2,'0');
const timeString=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const money=n=>new Intl.NumberFormat('et-EE',{style:'currency',currency:'EUR'}).format(n);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2500)}
function beep(){if(!sound)return;window.PPSound?.play('new')}
function updateSourceUI(){if(document.body.classList.contains('live-active')){$('returnDemo').hidden=false;$('demoAdd').style.display='none';$('kitchenTip').textContent='LIVE: tellimused pärinevad API-st. Köögis muudetud olekud EI JÕUA kliendini ega ametlikku süsteemi.';return;}const p=isPreview();if(p&&lastDemoChange)clearUndo();$('modePill').textContent=p?'JSON EELVAADE':'DEMO';$('connectionText').textContent=p?'JSON eelvaade':'Demorežiim';$('dataSourceLabel').textContent=p?'● KOHALIK JSON · AINULT LUGEMISEKS':'● DEMOANDMED';$('returnDemo').hidden=!p;$('demoAdd').style.display=p?'none':'';$('bottomMessage').textContent=p?'Kohalik JSON eelvaade, mitte reaalajas API':'Demorežiim aktiivne';$('kitchenTip').textContent=p?'Kohalik JSON-fail: üksnes vaatamiseks. Algset süsteemi ei muudeta.':'Demo: tellimuste olek muutub ainult selles brauseris.';document.querySelector('#statisticsPage .help').textContent=p?'Statistika põhineb ainult imporditud JSON-andmetel, mitte reaalajas API-l.':'Statistika põhineb demoandmetel ning selle brauseri tegevusel.';}
const filtered=list=>list.filter(o=>(filter==='all'||o.serving===filter)&&(!urgentOnly||remaining(o).late||orderDeadline(o)-Date.now()<5*60000)&&(!orderQuery||String(o.number).toLocaleLowerCase('et-EE').includes(orderQuery)||o.items.some(i=>String(i[0]).toLocaleLowerCase('et-EE').includes(orderQuery))));
function sortedOrders(list){return [...list].sort((a,b)=>orderSort==='newest'?b.created-a.created:orderSort==='oldest'?a.created-b.created:(a.created+a.minutes*60000)-(b.created+b.minutes*60000));}
function updateLateNotice(){const late=shownOrders().filter(o=>(o.status==='new'||o.status==='active')&&remaining(o).late).length;const el=$('lateNotice');if(!el)return;el.textContent=late?`${late} hilinenud tellimust`:'Kõik graafikus';el.classList.toggle('has-late',late>0);}

const pending=()=>shownOrders().filter(o=>o.status==='new');const active=()=>shownOrders().filter(o=>o.status==='active');
function countMetrics(){const n=pending().length,a=active().length,done=shownOrders().filter(o=>o.status==='done').length;$('metricNew').textContent=n;$('metricActive').textContent=a;$('metricDone').textContent=done;$('metricAvg').innerHTML=`${minutes} <em>min</em>`;$('newCount').textContent=n;$('activeCount').textContent=a;$('navCount').textContent=n;}
function orderDeadline(o){const exact=Number(o.deadline);return Number.isFinite(exact)&&exact>0?exact:(o.created+o.minutes*60000);}
function remaining(o){const target=orderDeadline(o);const delta=Math.ceil((target-Date.now())/1000),abs=Math.abs(delta);return {text:`${delta<0?'−':''}${pad(Math.floor(abs/60))}:${pad(abs%60)}`,late:delta<0}}
// Safe kitchen presentation: notes are displayed as text, never executable HTML.
function kitchenNote(o){
 const value=o.note??o.notes??o.comment??o.customerNote??'';
 return typeof value==='string'?value.trim().slice(0,400):'';
}
function kitchenQty(q){const n=Number(q);return Number.isFinite(n)&&n>=0?Math.min(n,999):0;}
// v17.8: one parser for card, print, Väljastus and Statistika (window.PPOrderInfo).
function pp178Parse(raw){
 const text=String(raw||'').trim();
 const cut=text.indexOf(' — ');
 const main=cut<0?text:text.slice(0,cut);
 const details=cut<0?'':text.slice(cut+3);
 const segments=details.split(';').map(v=>v.trim()).filter(Boolean);
 const extras=segments.filter(v=>/^Lisandid\s*:/i.test(v)).map(v=>v.replace(/^Lisandid\s*:/i,'').trim()).flatMap(x=>x.split(',')).map(x=>x.trim()).filter(Boolean);
 const specs=segments.filter(v=>!/^Lisandid\s*:/i.test(v));
 // Codes are assigned only when BOTH size and dough type are explicit.
 const sizeMatch=main.match(/\((large|small|family|medium)\)\s*$/i);
 const size=sizeMatch?sizeMatch[1].toLowerCase():null;
 const base=specs.find(v=>/^Põhi\s*:/i.test(v));
 const dough=base?base.replace(/^Põhi\s*:/i,'').trim().toLowerCase():null;
 const codes={large:{thin:'SÕ',thick:'SP'},small:{thin:'VÕ',thick:'VP'}};
 const code=(codes[size]&&codes[size][dough])||null;
 const name=code?main.replace(/\s*\((large|small)\)\s*$/i,'').trim():main;
 const words={large:'suur',small:'väike',family:'pere',medium:'keskmine',thin:'õhuke',thick:'paks'};
 const codeTitle=code?`${words[size]||size} · ${words[dough]||dough}`:'';
 // Show only what differs from the standard pizza; "regular" adds nothing for the cook.
 const mods=[];
 for(const v of (code?specs.filter(v=>!/^Põhi\s*:/i.test(v)):specs)){
  const m=v.match(/^([^:]+):\s*(.*)$/);const label=m?m[1].trim():'';const val=(m?m[2]:v).trim();const low=val.toLowerCase();
  if(!val||/^(regular|tavaline|normal|standard|default)$/i.test(low))continue;
  if(/^juust$/i.test(label)){
   if(/^(none|no|without|ilma|0)$/.test(low)){mods.push(['ILMA JUUSTUTA','warn']);continue;}
   if(/^(extra|double|topelt|lisa|more)$/.test(low)){mods.push(['TOPELT JUUST','warn']);continue;}
   if(/^(light|less|vähe|vähem)$/.test(low)){mods.push(['VÄHEM JUUSTU','warn']);continue;}
  }
  if(/^põhi$/i.test(label)){mods.push([(words[low]||val)+' põhi','info']);continue;}
  if(/^pakend$/i.test(label)){mods.push([/brand|bränd/i.test(val)?'Brändikarp':'Pakend: '+val,'info']);continue;}
  mods.push([label?label+': '+val:val,'warn']);
 }
 const pack=(text.match(/Pakend\s*:\s*([^;]+)/i)||[])[1]||'';
 const boxLabel={small:'VÄIKE',medium:'KESKMINE',large:'SUUR',family:'PERE'}[size]||null;
 const box=!boxLabel||/^(none|no|ilma|puudub|ei)$/i.test(pack.trim())?null:(/brand|bränd/i.test(pack)?'BRÄNDI '+boxLabel:boxLabel);
 return {name,code,codeTitle,mods,extras,size,box};
}
const PP178_BOX_ORDER=['VÄIKE','KESKMINE','SUUR','PERE','BRÄNDI VÄIKE','BRÄNDI KESKMINE','BRÄNDI SUUR','BRÄNDI PERE'];
// [[label,count],...] sorted; [] when no pizza boxes; null when eaten in the pizzeria.
function pp178BoxCounts(o){
 if(o&&o.dineIn)return null;
 const count=new Map();
 for(const it of (Array.isArray(o?.items)?o.items:[])){const [raw,qty]=Array.isArray(it)?it:[it?.name,it?.quantity];const b=pp178Parse(raw).box;if(b)count.set(b,(count.get(b)||0)+kitchenQty(qty??1));}
 return [...count].sort((a,b)=>PP178_BOX_ORDER.indexOf(a[0])-PP178_BOX_ORDER.indexOf(b[0]));
}
window.PPOrderInfo={parse:pp178Parse,boxes:pp178BoxCounts,boxOrder:PP178_BOX_ORDER};
function kitchenProductLabel(raw){
 const {name,code,codeTitle,mods,extras}=pp178Parse(raw);
 return `<strong class="pp94-pizza">${code?`<span class="pp119-code pp177-code" data-size="${code[0]}" data-dough="${code[1]}" title="${escapeHtml(codeTitle+' põhi')}"><b>${escapeHtml(code)}</b><small>${escapeHtml(codeTitle)}</small></span> `:''}<span class="pp177-name">${escapeHtml(name)}</span></strong>${mods.length?`<span class="pp94-specs pp177-mods">${mods.map(([t,k])=>`<em class="pp177-mod pp177-mod-${k}">${escapeHtml(t)}</em>`).join('')}</span>`:''}${extras.length?`<span class="pp94-extras pp177-extras"><b>+ LISA</b>${extras.map(x=>`<em>${escapeHtml(x)}</em>`).join('')}</span>`:''}`;
}
// v17.7: which pizza boxes this order needs (from pizza size + "Pakend" in the order).
function pp177Boxes(o,items){
 const list=pp178BoxCounts({...o,items});
 if(list===null)return '<div class="pp177-boxes pp177-dinein"><b>🍽 KOHAPEAL</b><span>karpi pole vaja</span></div>';
 if(!list.length)return '';
 return `<div class="pp177-boxes"><b>📦 KARBID</b>${list.map(([k,n])=>`<em data-box="${escapeHtml(k)}"><strong>${n}×</strong> ${escapeHtml(k)}</em>`).join('')}</div>`;
}
function card(o){
 const timer=remaining(o),remainingMs=orderDeadline(o)-Date.now();
 const totalMs=Math.max(1,o.minutes*60000),progress=Math.max(0,Math.min(100,100-remainingMs/totalMs*100));
 const urgency=timer.late?'late':remainingMs<5*60000?'soon':'normal';
 const serving=o.serving==='delivery'?'KOHALE':'KAASA';
 const note=kitchenNote(o);
 const customerName=typeof o.customerName==='string'?o.customerName.trim().slice(0,90):'';
 const phone=typeof o.customerPhone==='string'?o.customerPhone.replace(/[^0-9+ -]/g,'').trim().slice(0,20):'';
 const items=Array.isArray(o.items)?o.items:[];
 const dueTime=timeString(new Date(orderDeadline(o)));
 const dueCaption=o.deadlineSource==='official'?'API aeg':'Hinnanguline aeg';
 const stage=o.status==='new'?'pp118-new':'pp118-active';
 const urgencyLabel=timer.late?'⏱ ÜLE AJA':urgency==='soon'?'⏱ KIIRE':'Aega jäänud';
 return `<article class="ordercard card-v15 pp110-card pp117-ticket pp118-ticket ${stage} urgency-${urgency} ${o.status==='new'?'urgent':''}" data-order-id="${escapeHtml(o.id)}">
  <div class="cardtop pp117-ticket-header">
   <div class="orderid pp117-ticket-identity">
    <strong class="pp92-customer pp120-customer-first ${customerName?'':'pp111-name-missing'}">${customerName?escapeHtml(customerName):'Nimi puudub'}</strong>
    <div class="pp117-identity-line"><span class="order-number" title="Tellimuse number Peetri Pizza süsteemis">#${escapeHtml(o.number)}</span><span class="pp118-serving ${o.serving==='delivery'?'pp118-delivery':'pp118-takeaway'}">${o.dineIn?'🍽 KOHAPEAL':(o.serving==='delivery'?'🚗 ':'🛍 ')+serving}</span><small class="pp110-order-meta pp118-order-time" title="Tellimus saabus">saabus ${timeString(new Date(o.created))}</small>${phone?`<a class="pp177-phone" href="tel:${escapeHtml(phone.replace(/ /g,''))}" title="Kliendi telefon">📞 ${escapeHtml(phone)}</a>`:''}<span class="pp177-count">${items.reduce((n,i)=>n+kitchenQty(i[1]),0)} toodet</span>${o.internalStatus?`<span class="pp153-internal-badge">KÖÖGI OLEK · EI JÕUA KLIENDINI</span>`:''}</div>
   </div>
   <div class="prep-meter pp117-countdown" style="--pp117-fill:${progress.toFixed(1)}%" aria-label="Tellimuse järelejäänud aeg">
    <div class="prep-label"><span>${urgencyLabel}</span><strong data-timer="${escapeHtml(o.id)}" class="timer ${timer.late?'overdue':''}">${timer.text}</strong><small class="pp117-due" title="${dueCaption}">${dueTime}</small></div>
    <div class="prep-track" aria-hidden="true"><div class="prep-progress" data-progress="${escapeHtml(o.id)}" style="width:${progress.toFixed(1)}%"></div></div>
   </div>
  </div>
  ${pp177Boxes(o,items)}
  <div class="carditems pp117-ticket-items">${note?`<div class="customer-note pp118-important-note"><strong>⚑ KLIENDI MÄRKUS</strong><p>${escapeHtml(note)}</p></div>`:''}${items.length?'':`<div class="pp96-missing-items" role="alert">⚠ Tooted puuduvad — kontrolli originaaltellimust!</div>`}
   ${items.map(([name,qty])=>`<div class="product-line${kitchenQty(qty)>1?' pp177-multi':''}"><strong class="product-qty">${kitchenQty(qty)}×</strong><span class="product-name">${kitchenProductLabel(name)}</span></div>`).join('')}
  </div>
  <div class="cardfoot pp117-ticket-footer"><span class="price" aria-label="Tellimuse summa">${money(o.amount)}</span><button type="button" class="details" data-action="details" data-id="${escapeHtml(o.id)}" aria-label="Ava tellimuse #${escapeHtml(o.number)} detailid">Detailid</button>
   ${isPreview()?(document.body.classList.contains('live-active')?`<button type="button" class="pp153-local-btn" title="Muudab köögi olekut selles rakenduses. Peetri Pizza kodulehele see ei lähe." data-kitchen-action="${o.status==='new'?'active':'done'}" data-id="${escapeHtml(o.id)}" ${window.PPKitchenStatus?.ready()?'':'disabled title="Köögiserveriga ühendus puudub"'}>${o.status==='new'?'Võta vastu':'✓ Valmis'}</button>`:'<span class="readonly-tag">🔒 Ainult vaatamiseks</span>'):`<button type="button" class="${o.status==='new'?'accept':'done'}" data-action="${o.status==='new'?'accept':'done'}" data-id="${escapeHtml(o.id)}">${o.status==='new'?'Võta vastu':'✓ Valmis'}</button>`}</div>
 </article>`;
}
function pp145Notify(){
 // Local-only UI event; no external requests. Dataset is already visible to this signed-in browser.
 const snapshot={
   source:window.pp150LiveConnecting?'LIVE_CONNECTING':document.body.classList.contains('live-active')?'LIVE':isPreview()?'JSON':'DEMO',
   orders:shownOrders().map(o=>({id:String(o.id),status:o.status,number:o.number,created:Number(o.created)||0,completed:Number(o.completed)||0,minutes:Number(o.minutes)||20,deadline:Number(o.deadline)||0,deadlineSource:o.deadlineSource||'estimated',dineIn:!!o.dineIn,items:Array.isArray(o.items)?o.items.map(x=>[String(x[0]),Number(x[1])||0]):[]}))
 };
 window.pp145LatestSnapshot=snapshot;
 window.dispatchEvent(new CustomEvent('pp145:orders',{detail:snapshot}));
}
// v17.4: remember exactly which data the cards on screen were rendered from.
let pp174LastFp='';
const pp174Fp=()=>{try{return (document.body.classList.contains('live-active')?'L':'D')+(window.PPKitchenStatus?.ready()?'R':'N')+JSON.stringify(shownOrders())}catch(_){return String(Math.random())}};
function renderOrders(){
 pp174LastFp=pp174Fp();
 pp145Notify();
 updateSourceUI(); countMetrics();const p=sortedOrders(filtered(pending())),a=sortedOrders(filtered(active()));updateLateNotice();
 $('newOrders').innerHTML=p.length?p.map(card).join(''):empty('Uusi tellimusi pole','Selle filtri jaoks tellimusi ei ole.');
 $('activeOrders').innerHTML=a.length?a.map(card).join(''):empty('Kõik on valmis','Selle filtri jaoks tellimusi ei ole.');
 const done=shownOrders().filter(o=>o.status==='done'&&(!historyQuery||String(o.number).toLocaleLowerCase('et-EE').includes(historyQuery)||o.items.some(i=>String(i[0]).toLocaleLowerCase('et-EE').includes(historyQuery)))).sort((x,y)=>historySort==='oldest'?(x.completed||0)-(y.completed||0):historySort==='amount'?y.amount-x.amount:(y.completed||0)-(x.completed||0));
 $('doneCount').textContent=shownOrders().filter(o=>o.status==='done').length;
 $('historyShown').textContent=done.length+' tellimust';
 $('visibleOrderCount').textContent=shownOrders().filter(o=>o.status!=='done').length+' aktiivset tellimust';
 $('urgentOnly').checked=urgentOnly;
 $('doneOrders').innerHTML=done.length?done.map(o=>{
  const finished=o.completed?timeString(new Date(o.completed)):'—';
  const customer=typeof o.customerName==='string'?o.customerName.trim().slice(0,90):'';
  const products=Array.isArray(o.items)?o.items:[];
  const items=products.map(([name,qty])=>`<li class="pp112-product"><span class="pp112-qty">${kitchenQty(qty)}×</span><div class="pp112-product-text">${kitchenProductLabel(name)}</div></li>`).join('');
  const amount=Number(o.amount)||0;
  const pp178Box=pp178BoxCounts(o);
  return `<article class="pp112-done-card" data-order-id="${escapeHtml(o.id)}" data-phone="${escapeHtml(String(o.customerPhone||'').replace(/[^0-9+ -]/g,'').slice(0,20))}" data-boxes="${escapeHtml(pp178Box===null?'KOHAPEAL':pp178Box.map(([k,n])=>n+'× '+k).join(' · '))}" data-ready-at="${o.completed&&Number.isFinite(Number(o.completed))?Number(o.completed):''}" aria-label="Valmis tellimus ${escapeHtml(o.number)}"><div class="pp112-card-top"><div class="pp112-card-identity"><span class="pp112-check" aria-hidden="true">✓</span><div><strong class="pp112-customer pp121-customer-first ${customer?'':'pp112-name-missing'}">${customer?escapeHtml(customer):'Nimi puudub'}</strong><span class="pp112-number">#${escapeHtml(o.number)}</span></div></div><div class="pp112-completed"><span>VALMIS</span><strong>${finished}</strong>${o.internalStatus?`<span class="pp153-local-ready">Valmis ainult köögis</span>`:''}</div></div><div class="pp112-card-body"><ul class="pp112-products">${items||'<li>Tooted puuduvad</li>'}</ul></div><div class="pp112-card-footer"><span>${products.length} ${products.length===1?'tooterida':'tooterida'}</span><strong>${money(amount)}</strong>${o.internalStatus&&o.officialStatus!=='done'?`<button type="button" class="pp153-local-btn" data-kitchen-action="active" data-id="${escapeHtml(o.id)}">↶ Tühista valmis</button>`:''}</div></article>`;
 }).join(''):empty('Valmis tellimusi pole','Valmis tellimused ilmuvad siia.');
 document.body.classList.toggle('compact',compact);
 $('compactMode').checked=compact;$('compactSetting').checked=compact;
 document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
 $('doneOrders').hidden=!showHistory;$('historyTools').hidden=!showHistory;$('toggleHistory').setAttribute('aria-expanded',String(showHistory));
 $('toggleHistory').textContent=showHistory?'↑ Peida valmis ('+$('doneCount').textContent+')':'✓ Valmis ('+$('doneCount').textContent+')';
}

function empty(title,msg){return `<div class="empty"><div class="empty-illustration">✓</div><strong>${title}</strong><p>${msg}</p></div>`}
function refreshTimers(){
 const list=shownOrders();
 const byId=new Map(list.map(o=>[String(o.id),o]));
 document.querySelectorAll('#ordersPage .ordercard[data-order-id]').forEach(card=>{
  const o=byId.get(card.dataset.orderId);if(!o)return;
  const remainingMs=orderDeadline(o)-Date.now();
  const time=remaining(o),urgent=time.late?'late':remainingMs<300000?'soon':'normal';
  card.classList.toggle('urgency-late',urgent==='late');
  card.classList.toggle('urgency-soon',urgent==='soon');
  card.classList.toggle('urgency-normal',urgent==='normal');
  const timer=card.querySelector('[data-timer]');if(timer){timer.textContent=time.text;timer.classList.toggle('overdue',time.late);timer.classList.toggle('timer-soon',urgent==='soon');}
  const label=card.querySelector('.prep-label>span');if(label)label.textContent=urgent==='late'?'⏱ ÜLE AJA':urgent==='soon'?'⏱ KIIRE':'⏱ Aega jäänud';
  const priority=card.querySelector('[data-pp110-priority]');if(priority){priority.hidden=urgent==='normal';priority.textContent=urgent==='late'?'● HILINENUD':'● KIIRE';priority.classList.toggle('is-late',urgent==='late');priority.classList.toggle('is-soon',urgent==='soon');}
  const progress=card.querySelector('[data-progress]');if(progress){const p=100-remainingMs/Math.max(1,o.minutes*60000)*100;const percent=Math.min(100,Math.max(0,p)).toFixed(1)+'%';progress.style.width=percent;card.querySelector('.pp117-countdown')?.style.setProperty('--pp117-fill',percent);}
 });
}
function showDetails(o){$('detailTitle').textContent=`Tellimus #${o.number}`;const entries=[['Kliendi nimi',o.customerName||'—'],['Telefon',o.customerPhone||'—'],['Staatus',o.status==='new'?'Uus':o.status==='active'?'Valmistamisel':'Valmis'],['Tellitud',timeString(new Date(o.created))],['Teenindus',o.serving==='delivery'?'Kohaletoimetamine':'Kaasa'],['Makse',o.payment],['Aeg',o.minutes+' min'],['Summa',money(o.amount)],['Tellimuse ID',o.id]];const note=kitchenNote(o);if(o.officialStatus&&o.officialStatus!==o.status)entries.push(['Ametlik Peetri Pizza staatus',o.officialStatus==='new'?'Uus':o.officialStatus==='active'?'Valmistamisel':'Valmis'],['Hoiatus','Köögis muudetud olekut ei saadeta kliendile']);$('detailBody').innerHTML=`<div class="detail-list">${entries.map(([k,v])=>`<div><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}</div><h3>Tooted</h3><div class="detail-list">${o.items.map(([name,qty])=>`<div><span>${escapeHtml(name)}</span><strong>${Number(qty)}×</strong></div>`).join('')}</div>${note?`<div class="customer-note"><strong>⚑ KLIENDI MÄRKUS</strong><p>${escapeHtml(note)}</p></div>`:''}<div class="modal-note">${isPreview()?'LIVE — ainult vaatamiseks. Kontrolli toodete andmeid originaaltellimusega.':'Näidistellimus. Ühtegi muudatust Peetri Pizza originaalsüsteemi ei saadeta.'}</div>`;$('orderDialog').showModal();window.dispatchEvent(new CustomEvent('pp168:details-opened',{detail:{id:String(o.id),number:String(o.number),customer:String(o.customerName||''),customerName:String(o.customerName||''),customerPhone:String(o.customerPhone||''),dineIn:!!o.dineIn,status:String(o.status),serving:String(o.serving||''),deadline:Number(o.deadline)||0,note:kitchenNote(o),created:Number(o.created)||0,items:o.items.map(v=>[String(v[0]),Number(v[1])||0])}}))}
function onOrdersClick(e){
 const btn=e.target.closest('[data-action]');if(!btn)return;
 const o=shownOrders().find(x=>x.id===btn.dataset.id);if(!o)return;
 const action=btn.dataset.action;
 if(action==='details'){showDetails(o);return;}
 if(isPreview())return;
 if(action!=='accept'&&action!=='done')return;
 if(action==='accept'&&o.status!=='new')return;
 if(action==='done'&&o.status!=='active')return;
 if(action==='done'&&!confirm(`Kas tellimus #${o.number} on valmis?`))return;
 const before={status:o.status,accepted:o.accepted,completed:o.completed,minutes:o.minutes};
 if(action==='accept'){o.status='active';o.accepted=Date.now();o.minutes=minutes;}
 else{o.status='done';o.completed=Date.now();}
 save();renderOrders();renderAux();
 offerUndo(o,before,`Tellimus #${o.number}: ${action==='accept'?'vastu võetud':'valmis'}`);
 toast(action==='accept'?'Tellimus vastu võetud':'Tellimus märgitud valmis');
}

function addDemo(){if(isPreview()){toast('JSON eelvaade on ainult lugemiseks');return;}const number=Math.max(100,...orders.map(o=>Number(o.number)||100))+1;orders.unshift({id:'demo-'+Date.now(),number,status:'new',customerName:'Mari (DEMO)',items:[['Peetri eripizza',1],['Kaste',1]],amount:16.90,created:Date.now(),minutes,serving:Math.random()>.5?'delivery':'takeAway',payment:'online'});save();renderOrders();beep();toast('Uus näidistellimus lisatud')}
const pages={orders:['Tellimuste ülevaade','Kiire ja selge köögi töölaud.'],couriers:['Kullerite haldus','Meeskond ja tarneülevaade.'],products:['Toodete saadavus','Hallake demo toodete saadavust.'],statistics:['Statistika','Tellimuste tulemused ühes kohas.'],settings:['Seaded','Kohandage oma töölauda.']};
function showPage(page){if(!pages[page])return;document.body.classList.toggle('pp-orders-view',page==='orders');document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===page+'Page'));document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===page));$('pageTitle').innerHTML=pages[page][0]+'<span class="period">.</span>';$('pageSubtitle').textContent=pages[page][1];$('overview').style.display=page==='orders'?'':'none';$('demoAdd').style.display=page==='orders'&&!isPreview()&&!document.body.classList.contains('live-active')?'':'none';renderAux();if(typeof renderPerformance==='function')renderPerformance();closeMenu();window.scrollTo({top:0,behavior:'smooth'})}
function openMenu(){$('drawer').classList.add('open');$('drawer').setAttribute('aria-hidden','false');$('backdrop').hidden=false;$('menuBtn').setAttribute('aria-expanded','true')}
function closeMenu(){$('drawer').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');$('backdrop').hidden=true;$('menuBtn').setAttribute('aria-expanded','false')}

// v10.5 — report strictly from orders currently available in the chosen data source.
function renderDailyReport(){
 const box=$('pp105-summary');if(!box)return;
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit'});
 const dateKey=ms=>{const n=Number(ms);return Number.isFinite(n)&&n>0?day.format(new Date(n)):'';};
 const today=dateKey(Date.now());
 const list=shownOrders().filter(o=>dateKey(o.created)===today);
 const done=list.filter(o=>o.status==='done');
 const open=list.filter(o=>o.status==='new'||o.status==='active');
 const finishedToday=done.filter(o=>dateKey(o.completed)===today);
 const times=finishedToday.filter(o=>Number(o.completed)>Number(o.created)).map(o=>(o.completed-o.created)/60000).filter(n=>n>=0&&n<1440);
 const avg=times.length?(times.reduce((a,b)=>a+b,0)/times.length).toFixed(1)+' min':'—';
 const sum=finishedToday.reduce((n,o)=>n+(Number(o.amount)||0),0);
 const metric=(label,value)=>`<div><small>${label}</small><strong>${value}</strong></div>`;
 $('pp105-date').textContent=new Date().toLocaleDateString('et-EE',{timeZone:'Europe/Tallinn'});
 box.innerHTML=metric('Täna saabunud',list.length)+metric('Valmis (tänased tellimused)',done.length)+metric('Pooleli',open.length)+metric('Täna lõpetatud',finishedToday.length)+metric('Lõpetatud tellimuste summa',money(sum))+metric('Keskmine valmimisaeg',avg);
 const takeaway=list.filter(o=>o.serving==='takeAway').length;
 const delivery=list.filter(o=>o.serving==='delivery').length;
 $('pp105-services').textContent=`Kaasa: ${takeaway}  ·  Kohaletoimetamine: ${delivery}`;
 const live=document.body.classList.contains('live-active');
 $('pp105-disclaimer').textContent=live?'LIVE · Aruanne põhineb ainult praegu API-st laaditud tellimustel. See ei pruugi sisaldada kõiki päeva tellimusi ega ole ametlik käibearuanne.':isPreview()?'JSON eelvaade · Aruanne põhineb ainult imporditud tellimustel.':'DEMO · Näidisandmed, mitte tegelik müük.';
}
// v14.0: explicitly local product availability; no upstream writes and no inventory semantics.
const PRODUCT_CATEGORY_ICONS={
 Pitsad:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21 11 2c4.8 1.4 8.2 4.8 10 9.5L3 21Z"/><circle cx="11" cy="12" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M7 17h4"/></svg>',
 Lisandid:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/><circle cx="12" cy="12" r="3"/></svg>',
 Joogid:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14l-2 16H7L5 5ZM4 5h16M10 5V2h5"/><path d="M8 13h8"/></svg>'
};
function renderProductsV140(){
 const box=$('productList');if(!box)return;
 const all=products.map((p,i)=>({...p,i}));
 const visible=all.filter(p=>(productCategory==='Kõik'||p.category===productCategory)&&
   (productStatus==='Kõik'||(productStatus==='Saadaval'&&p.available)||(productStatus==='Otsas'&&!p.available))&&
   (!productQuery||p.name.toLocaleLowerCase('et-EE').includes(productQuery)));
 visible.sort((a,b)=>Number(a.available)-Number(b.available)||a.name.localeCompare(b.name,'et-EE'));
 box.innerHTML=visible.map(p=>{
   const state=p.available?'Saadaval':'Otsas';
   const action=p.available?'Märgi otsas':'Märgi saadavaks';
   return `<article class="pp140-card ${p.available?'is-available':'is-out'}" data-product-card="${p.i}">
    <div class="pp140-card-main"><span class="pp140-product-icon pp140-icon-${p.category.toLowerCase()}" aria-hidden="true">${PRODUCT_CATEGORY_ICONS[p.category]||''}</span>
     <div class="pp140-card-details"><span class="pp140-product-category">${escapeHtml(p.category)}</span><h4>${escapeHtml(p.name)}</h4></div></div>
    <div class="pp140-card-bottom"><span class="pp140-pill ${p.available?'pp140-pill-ok':'pp140-pill-out'}"><span class="pp140-pill-dot"></span>${state}</span>
     <button type="button" class="pp140-product-action ${p.available?'':'pp140-restore-action'}" data-product="${p.i}" aria-label="${action}: ${escapeHtml(p.name)}"><span>${action}</span><span class="pp140-action-icon" aria-hidden="true">${p.available?'−':'+'}</span></button></div>
    </article>`;
 }).join('')||'<div class="pp140-empty"><span aria-hidden="true">⌕</span><strong>Tooteid ei leitud</strong><p>Proovi teist otsingut või vali muu filter.</p></div>';
 const metrics=[['pp140-total',products.length],['pp140-available',products.filter(p=>p.available).length],['pp140-out',products.filter(p=>!p.available).length]];
 for(const [id,value] of metrics){const el=$(id);if(el)el.textContent=String(value)}
 const counter=$('pp137-visible-count');if(counter)counter.textContent=`Näidatud ${visible.length} / ${products.length} toodet`;
 document.querySelectorAll('#pp137-category-tabs [data-category]').forEach(btn=>{
   const selected=btn.dataset.category===productCategory;
   btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));
   const badge=btn.querySelector('[data-category-count]');if(badge)badge.textContent=String(all.filter(p=>btn.dataset.category==='Kõik'||p.category===btn.dataset.category).length);
 });
 document.querySelectorAll('#pp140-status-tabs [data-status]').forEach(btn=>{
  const selected=btn.dataset.status===productStatus;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));
 });
 const clear=$('pp140-search-clear');if(clear)clear.hidden=!productQuery;
 const undo=$('pp140-undo');if(undo)undo.hidden=!productUndo;
}
function toggleProductV140(index){
 if(!Number.isInteger(index)||index<0||index>=products.length)return;
 const p=products[index];const previous=p.available;
 const state=previous?'Otsas':'Saadaval';
 if(!confirm(`Kas märkida „${p.name}” olekuks „${state}”? Muudatus kehtib ainult selles seadmes.`))return;
 p.available=!p.available;
 try{
   saveProducts();
   const check=JSON.parse(localStorage.getItem('pp-products-v1')||'null');
   if(!Array.isArray(check)||check.find(x=>x&&x.name===p.name)?.available!==p.available)throw Error('storage_mismatch');
 }catch{
   p.available=previous;
   try{saveProducts()}catch(_){/* The previous durable value is unchanged on storage failure. */}
   toast('Salvestamine ebaõnnestus. Toote olekut ei muudetud.');return;
 }
 productUndo={index,previous};
 clearTimeout(productUndoTimer);
 productUndoTimer=setTimeout(()=>{productUndo=null;const bar=$('pp140-undo');if(bar)bar.hidden=true},10000);
 const label=$('pp140-undo-label');if(label)label.textContent=`${p.name}: ${p.available?'Saadaval':'Otsas'} · salvestatud selles seadmes`;
 renderAux();toast(`${p.name}: ${p.available?'Saadaval':'Otsas'} · salvestatud selles seadmes`);
 const focus=$('productList').querySelector(`[data-product="${index}"]`);if(focus)focus.focus({preventScroll:true});
}
function undoProductV140(){
 if(!productUndo)return;
 const {index,previous}=productUndo;
 if(!products[index])return;
 products[index].available=previous;
 try{saveProducts()}catch{toast('Taastamist ei saanud salvestada');return}
 clearTimeout(productUndoTimer);productUndo=null;renderAux();toast('Muudatus võeti tagasi');
}
function renderAux(){$('minuteSetting').textContent=minutes+' min';$('soundToggle').checked=sound;$('soundBtn').textContent=sound?'🔊':'🔇';$('soundBtn').setAttribute('aria-pressed',String(sound));$('soundBtn').title=sound?'Heli sees':'Heli väljas';$('courierList').innerHTML=couriers.map((c,i)=>`<div class="listrow"><div><strong>↗ ${escapeHtml(c)}</strong><small>Demo kuller</small></div><button data-delete-courier="${i}">Eemalda</button></div>`).join('')||'<p class="help">Kullereid pole lisatud.</p>';renderProductsV140();const displayed=shownOrders();const complete=displayed.filter(o=>o.status==='done');$('statsData').innerHTML=`<div><small>Tellimusi kokku</small><strong>${displayed.length}</strong></div><div><small>Valmis</small><strong>${complete.length}</strong></div><div><small>${isPreview()?'JSON summa (eelvaade)':'Demo käive'}</small><strong>${money(complete.reduce((s,o)=>s+o.amount,0))}</strong></div>`;renderDailyReport()}
$('orderSearch').addEventListener('input',e=>{orderQuery=e.target.value.trim().toLocaleLowerCase('et-EE');renderOrders();});
$('orderSort').addEventListener('change',e=>{orderSort=e.target.value;renderOrders();});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;renderOrders()}));
function changeCompact(value){compact=!!value;localStorage.setItem('pp-compact-v11',JSON.stringify(compact));renderOrders()}
$('compactMode').addEventListener('change',e=>changeCompact(e.target.checked));
$('compactSetting').addEventListener('change',e=>changeCompact(e.target.checked));
$('toggleHistory').addEventListener('click',()=>{showHistory=!showHistory;renderOrders()});
$('menuBtn').addEventListener('click',openMenu);$('closeDrawer').addEventListener('click',closeMenu);$('backdrop').addEventListener('click',closeMenu);document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.go)));$('demoAdd').addEventListener('click',addDemo);$('newOrders').addEventListener('click',onOrdersClick);$('activeOrders').addEventListener('click',onOrdersClick);$('closeOrder').addEventListener('click',()=>$('orderDialog').close());$('orderDialog').addEventListener('click',e=>{if(e.target===$('orderDialog'))$('orderDialog').close()});$('soundBtn').addEventListener('click',()=>{sound=!sound;localStorage.setItem('pp-sound-v1',JSON.stringify(sound));renderAux();window.PPSound?.sync();if(sound)window.PPSound?.preview()});$('soundToggle').addEventListener('change',e=>{sound=e.target.checked;localStorage.setItem('pp-sound-v1',JSON.stringify(sound));renderAux();window.PPSound?.sync();if(sound)window.PPSound?.preview()});for(const [id,change] of [['minusMinutes',-5],['plusMinutes',5]])$(id).addEventListener('click',()=>{minutes=Math.max(5,Math.min(120,minutes+change));localStorage.setItem('pp-minutes-v1',JSON.stringify(minutes));renderAux();countMetrics()});$('undoAction').addEventListener('click',undoDemoChange);$('resetDemo').addEventListener('click',()=>{if(!confirm('Kas taastada näidistellimused?'))return;clearUndo();orders=structuredClone(DEFAULT_ORDERS).map((o,i)=>({...o,created:Date.now()-(i+2)*4*60000}));save();renderOrders();renderAux();toast('Näidisandmed taastatud')});$('addCourier').addEventListener('click',()=>{const name=prompt('Kulleri nimi');if(name&&name.trim()){couriers.push(name.trim().slice(0,60));localStorage.setItem('pp-couriers-v1',JSON.stringify(couriers));renderAux()}});$('courierList').addEventListener('click',e=>{const b=e.target.closest('[data-delete-courier]');if(!b)return;couriers.splice(Number(b.dataset.deleteCourier),1);localStorage.setItem('pp-couriers-v1',JSON.stringify(couriers));renderAux()});$('productList').addEventListener('click',e=>{const b=e.target.closest('[data-product]');if(b)toggleProductV140(Number(b.dataset.product));});document.getElementById('pp137-category-tabs')?.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;productCategory=b.dataset.category;document.querySelectorAll('#pp137-category-tabs [data-category]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on))});renderAux()});document.getElementById('pp137-product-search')?.addEventListener('input',e=>{productQuery=e.target.value.trim().toLocaleLowerCase('et-EE');renderAux()});document.getElementById('pp140-status-tabs')?.addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;productStatus=b.dataset.status;renderAux()});document.getElementById('pp140-search-clear')?.addEventListener('click',()=>{const input=$('pp137-product-search');input.value='';productQuery='';renderAux();input.focus()});document.getElementById('pp140-undo-action')?.addEventListener('click',undoProductV140);window.addEventListener('storage',e=>{if(e.key!=='pp-products-v1')return;const saved=safeLoad('pp-products-v1',[]);if(!Array.isArray(saved))return;products=products.map(p=>{const found=saved.find(x=>x&&x.name===p.name);return {...p,available:found?!!found.available:p.available}});productUndo=null;renderAux()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});function clock(){$('clock').textContent=timeString(new Date())}clock();setInterval(clock,15000);setInterval(refreshTimers,1000);renderOrders();renderAux();

// v1.2: safe, read-only local integration preflight (never exposes credentials).
async function checkIntegration(){
 const el=$('connectionReport'),button=$('checkConnection');
 button.disabled=true;el.textContent='Kontrollin cRe Studio serverit…';
 try {
  const res=await fetch('api/status.php',{cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});
  const data=await res.json();
  if(!res.ok||!data.ok)throw Error('Diagnostika ei ole saadaval');
  el.textContent=`PHP: ${data.php_ready?'valmis':'puudub'} · JSON: ${data.json_ready?'valmis':'puudub'} · Integratsioon: ${data.integration_enabled?'piiratud':'välja lülitatud'} · Reaalajas tellimused: välja lülitatud`;
  el.dataset.state='ok';
 }catch(e){el.textContent='Diagnostika ei ole saadaval. Kontrolli PHP tuge ja faili api/status.php.';el.dataset.state='error'}
 finally{button.disabled=false}
}
$('checkConnection').addEventListener('click',checkIntegration);
$('returnDemo').addEventListener('click',()=>{previewOrders=null;$('importOrders').value='';$('importReport').textContent='Demorežiim taastatud. JSON-faili eelvaate andmed kustutati mälust.';renderOrders();renderAux();toast('Demorežiim aktiivne')});
$('importOrders').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 const report=$('importReport');
 if(file.size>2*1024*1024){report.textContent='Fail on liiga suur (maksimaalselt 2 MB).';report.dataset.state='error';e.target.value='';return;}
 try{
  const raw=await file.text();const parsed=JSON.parse(raw);
  // Prevent accidental import of known credential fields anywhere in payload.
  if(/\"(?:x-session-id|websocket_key|authorization|secure_id|customer_email|customer_phone|customer_name|customer_address)\"\s*:/i.test(raw))throw Error('Fail sisaldab tundlikke välju. Eemalda need enne importimist.');
  const adapted=window.PeetriOrderAdapter.normalize(parsed);
  if(!adapted.length)throw Error('Failis pole sobivaid tellimusi.');
  previewOrders=adapted;filter='all';renderOrders();renderAux();showPage('orders');
  report.textContent=`Valmis: ${adapted.length} tellimust. Ainult ajutine eelvaade brauseris. Muudatused ja API-päringud on keelatud.`;
  report.dataset.state='ok';toast('JSON eelvaade avatud');
 }catch(err){report.textContent='JSON import ebaõnnestus: '+(err instanceof SyntaxError?'vigane JSON':err.message);report.dataset.state='error';}
 e.target.value='';
});

// v1.5 kitchen focus: local presentation only. Never contacts original API.
function applyFocusMode(){
 document.body.classList.toggle('focus-kitchen',focusMode);
 $('focusMode').checked=focusMode;$('focusSetting').checked=focusMode;
}
function setFocusMode(next){focusMode=!!next;localStorage.setItem('pp-focus-v15',JSON.stringify(focusMode));applyFocusMode();}
$('focusMode').addEventListener('change',e=>setFocusMode(e.target.checked));
$('focusSetting').addEventListener('change',e=>setFocusMode(e.target.checked));
applyFocusMode();
// Enhance local PHP preflight display; this is NOT an upstream API connection.
$('checkConnection').addEventListener('click',()=>{
 setTimeout(()=>{$('diagLocal').textContent=$('connectionReport').dataset.state==='ok'?'PHP töökorras · ainult lokaalne diagnostika':'Kontroll ebaõnnestus';},350);
});

// v1.6: display-only kitchen controls; no external network or order writes.
const fullBtn=$('fullscreenKitchen');
if(fullBtn){
 fullBtn.addEventListener('click',async()=>{
  try{
   if(document.fullscreenElement){await document.exitFullscreen();}
   else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();}
   else{toast('Täisekraan ei ole selles brauseris saadaval');}
  }catch{toast('Täisekraani avamine ei õnnestunud');}
 });
 document.addEventListener('fullscreenchange',()=>{fullBtn.textContent=document.fullscreenElement?'⤢ Välju täisekraanist':'⛶ Täisekraan';});
}
function updateDisplayTimestamp(){const el=$('syncClock');if(el)el.textContent='Viimane kuvauuendus: '+timeString(new Date());}
updateDisplayTimestamp();setInterval(updateDisplayTimestamp,30000);

function renderPerformance(){
 const list=shownOrders(),done=list.filter(o=>o.status==='done');
 const prep=done.filter(o=>o.completed&&o.created).map(o=>(o.completed-o.created)/60000).filter(n=>n>=0&&Number.isFinite(n));
 const avg=prep.length?(prep.reduce((a,b)=>a+b,0)/prep.length).toFixed(1):'—';
 const onTime=done.length?Math.round(done.filter(o=>o.completed&&o.completed<=orderDeadline(o)).length/done.length*100)+'%':'—';
 const byService={takeAway:list.filter(o=>o.serving==='takeAway').length,delivery:list.filter(o=>o.serving==='delivery').length};
 $('performanceStats').innerHTML=`<h3>Tellimuste näitajad</h3><div class="performance-grid"><div><small>Keskmine valmimisaeg</small><strong>${avg}${avg==='—'?'':' min'}</strong></div><div><small>Õigeaegselt valmis</small><strong>${onTime}</strong></div><div><small>Kaasa</small><strong>${byService.takeAway}</strong></div><div><small>Kohaletoimetamine</small><strong>${byService.delivery}</strong></div></div><p class="help">Arvutused põhinevad nähtaval andmeallikal, mitte serveri ametlikul statistikal.</p>`;
}
renderPerformance();

// v1.9 — urgency tools, history search, and live visual status. No upstream writes.
$('urgentOnly').addEventListener('change',e=>{urgentOnly=e.target.checked;renderOrders()});
$('historySearch').addEventListener('input',e=>{historyQuery=e.target.value.trim().toLocaleLowerCase('et-EE');renderOrders()});
function renderRush(){
 const open=shownOrders().filter(o=>o.status==='new'||o.status==='active');
 const late=open.filter(o=>remaining(o).late).length;
 const soon=open.filter(o=>!remaining(o).late&&orderDeadline(o)-Date.now()<5*60000).length;
 document.querySelectorAll('.ordercard').forEach(card=>{
  const timer=card.querySelector('[data-timer]');
  if(!timer)return;
  const o=shownOrders().find(x=>String(x.id)===timer.dataset.timer);
  if(!o)return;
  const ms=orderDeadline(o)-Date.now();
  card.classList.toggle('urgency-late',ms<0);
  card.classList.toggle('urgency-soon',ms>=0&&ms<5*60000);
 });
}
const oldRenderOrders=renderOrders;
renderOrders=function(){oldRenderOrders();renderRush()};
renderOrders();

// v2.2: compact main screen and richer history without changing the two-column workflow.
function syncOverview(){
 const visible=overviewExpanded&&document.querySelector('#ordersPage').classList.contains('active');
 $('overview').hidden=!visible;
 $('toggleOverview').setAttribute('aria-expanded',String(overviewExpanded));
 $('toggleOverview').textContent=overviewExpanded?'▦ Peida statistika':'▦ Näita statistikat';
}
$('toggleOverview').addEventListener('click',()=>{
 overviewExpanded=!overviewExpanded;
 localStorage.setItem('pp-overview-expanded-v22',JSON.stringify(overviewExpanded));
 syncOverview();
});
$('historySort').addEventListener('change',e=>{historySort=e.target.value;renderOrders()});
const originalShowPage=showPage;
showPage=function(page){originalShowPage(page);syncOverview()};
syncOverview();

// v3.3 Kitchen Focus: visual-only controls; never writes to Peetri Pizza API.
const focusKey='pp-kitchen-focus-v33';
let kitchenFocus=localStorage.getItem(focusKey)==='1';
const focusButton=document.createElement('button');
focusButton.type='button';focusButton.id='kitchenFocus';focusButton.className='secondary';
focusButton.setAttribute('aria-pressed',String(kitchenFocus));
$('toggleOverview').insertAdjacentElement('afterend',focusButton);
function setKitchenFocus(on){
 kitchenFocus=!!on;localStorage.setItem(focusKey,kitchenFocus?'1':'0');
 document.body.classList.toggle('kitchen-focus',kitchenFocus);
 focusButton.textContent=kitchenFocus?'◱ Tavaline vaade':'▣ Köögivaade';
 focusButton.setAttribute('aria-pressed',String(kitchenFocus));
}
focusButton.addEventListener('click',()=>setKitchenFocus(!kitchenFocus));
setKitchenFocus(kitchenFocus);
// Timers can change urgency without receiving new orders. Update card severity every second.
// v11.0: a single timer loop manages progress, countdown and urgency.

// v3.0 LIVE monitor — upstream READ ONLY, no credentials in browser, no upstream writes.
let liveMode=false,liveTimer=null,liveBusy=false,liveEpoch=0,liveFailures=0,liveRequestController=null;
function pp168SchedulePoll(){clearTimeout(liveTimer);liveTimer=null;if(!liveMode||document.hidden)return;const ms=liveFailures?Math.min(30000,2000*Math.pow(2,Math.min(liveFailures-1,4))):10000;liveTimer=setTimeout(()=>refreshLive(),ms);}
window.pp155LiveFreshAt=0;
let liveSeen=new Set(),liveInitialized=false,lastLiveSync=0,liveSoundUnlocked=false;
const liveCacheKey='pp154-live-cache-'+(document.querySelector('meta[name="pp-wait-csrf"]')?.content||'session').slice(0,24);
const LIVE_CACHE_MAX_AGE=15*60*1000;
function saveLiveCache(items){try{const safe=items.slice(0,160);const json=JSON.stringify({at:Date.now(),orders:safe});if(json.length<1200000)sessionStorage.setItem(liveCacheKey,json)}catch(_){}}
function loadLiveCache(){try{const c=JSON.parse(sessionStorage.getItem(liveCacheKey)||'null');if(!c||!Number.isFinite(c.at)||Date.now()-c.at>LIVE_CACHE_MAX_AGE||Date.now()<c.at||!Array.isArray(c.orders)){sessionStorage.removeItem(liveCacheKey);return null}return c}catch(_){return null}}
const liveRecent=new Map();
function decorateNewLiveOrders(){
 const now=Date.now();
 for(const [key,until] of liveRecent)if(until<=now)liveRecent.delete(key);
 for(const order of shownOrders()){
  if(!liveRecent.has(liveOrderKey(order)))continue;
  for(const card of document.querySelectorAll('.ordercard.card-v15')){
   const timer=card.querySelector('[data-timer]');
   if(timer&&String(timer.dataset.timer)===String(order.id)){
    card.classList.add('live-just-arrived');
    if(!card.querySelector('.live-new-badge')){
     const badge=document.createElement('span');badge.className='live-new-badge';badge.textContent='UUS';badge.title='Just saabunud';
     card.querySelector('.cardtop')?.appendChild(badge);
    }
   }
  }
 }
}

const liveButton=document.createElement('button');
liveButton.type='button';liveButton.className='secondary';liveButton.textContent='↻ Reaalsed tellimused';
liveButton.setAttribute('aria-label','Laadi päris tellimused ainult lugemiseks');
$('toggleOverview').parentNode.insertBefore(liveButton,$('toggleOverview'));
const liveInfo=document.createElement('div');
liveInfo.className='live-monitor';liveInfo.setAttribute('role','status');liveInfo.setAttribute('aria-live','polite');
liveInfo.textContent='LIVE pole käivitatud';
liveButton.insertAdjacentElement('afterend',liveInfo);
const liveEscape=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function liveStatus(message,kind='normal'){
 liveInfo.dataset.state=kind;
 liveInfo.textContent=message;
}
function liveStop(){
 window.pp155LiveFreshAt=0;
 liveMode=false;window.pp153RawLiveOrders=null;window.pp150LiveConnecting=false;document.body.classList.remove('live-active');liveEpoch++;clearInterval(liveTimer);liveTimer=null;
 // Abort an outstanding request before a subsequent LIVE session is allowed to start.
 if(liveRequestController){liveRequestController.abort();liveRequestController=null;}
 liveBusy=false;
 liveSeen.clear();liveRecent.clear();liveInitialized=false;liveFailures=0;
 window.dispatchEvent(new Event('pp150:live-stopped'));
 liveButton.textContent='↻ Reaalsed tellimused';
 liveStatus('LIVE peatatud');delete liveInfo.dataset.lastSuccess;document.body.classList.remove('live-connection-error');
}
$('returnDemo').addEventListener('click',()=>{liveStop();});
function liveOrderKey(o){
 // v15: server-normalized stable identity; mutable confirmation times must not trigger an alert.
 return String(o.id??o.number??'');
}
function liveNotify(count){
 if(!count)return;
 if(sound)beep()
 if('vibrate' in navigator)try{navigator.vibrate([180,90,180])}catch(_){}
 toast(count===1?'Saabus uus tellimus!':`Saabus ${count} uut tellimust!`);
}
async function refreshLive(){
 if(!liveMode||liveBusy)return;
 clearTimeout(liveTimer);liveTimer=null;
 liveBusy=true;const epoch=liveEpoch;
 const controller=new AbortController();liveRequestController=controller;
 const requestStarted=performance.now();
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  liveStatus('LIVE · Sünkroonimine…');
  const r=await fetch('api/live.php',{credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('HTTP '+r.status);
  const data=await r.json();
  const requestMs=Math.round(performance.now()-requestStarted);
  if(!data.ok||!Array.isArray(data.orders))throw Error('Vigane vastus');
  if(!liveMode||epoch!==liveEpoch)return;
  // Defense in depth: even a nonconforming API response cannot display duplicate order IDs.
  const known=new Set();const incoming=[];
  for(const order of data.orders){const id=String(order?.id||'');if(!/^live-[a-f0-9]{24}$/.test(id)||known.has(id))continue;known.add(id);incoming.push(order);}
  saveLiveCache(incoming);
  const current=new Set(incoming.filter(o=>o.status==='new').map(liveOrderKey));
  const freshKeys=liveInitialized?[...current].filter(id=>!liveSeen.has(id)):[];
  const fresh=freshKeys.length;
  for(const id of freshKeys)liveRecent.set(id,Date.now()+45000);
  // Remember identities throughout this LIVE session, even if a transient poll omits an order.
  for(const key of current)liveSeen.add(key);
  if(liveSeen.size>3200)liveSeen=new Set([...liveSeen].slice(-2500));
  liveInitialized=true;liveFailures=0;document.body.classList.remove('live-connection-error');delete document.body.dataset.pp154CacheAge;lastLiveSync=Date.now();
  window.pp155LiveFreshAt=Date.now();
  window.pp153RawLiveOrders=incoming;
  await window.PPKitchenStatus?.pull(false);
  if(!liveMode||epoch!==liveEpoch)return;
  previewOrders=incoming.map(o=>window.PPKitchenStatus?.overlay(o)??o);window.pp150LiveConnecting=false;
  // Set LIVE source before render so all subscribers get a consistent LIVE snapshot.
  document.body.classList.add('live-active');
  // v17.4: identical LIVE data -> keep the existing cards (no lost taps, no decorator churn); timers still tick every second.
  if(pp174Fp()!==pp174LastFp){renderOrders();renderAux();}else{const el=$('lateNotice'),late=shownOrders().filter(o=>(o.status==='new'||o.status==='active')&&remaining(o).late).length,txt=late?`${late} hilinenud tellimust`:'Kõik graafikus';if(el&&el.textContent!==txt){el.textContent=txt;el.classList.toggle('has-late',late>0);}}
  decorateNewLiveOrders();
  $('modePill').textContent='LIVE · LUGEMINE';$('connectionText').textContent='Reaalsed tellimused';
  $('dataSourceLabel').textContent='● LIVE · AINULT LUGEMISEKS';
  $('bottomMessage').textContent='Reaalsed tellimused · ainult lugemiseks';
  liveButton.textContent='✓ LIVE · Peata';document.body.classList.add('live-active');
  liveInfo.dataset.lastSuccess=String(lastLiveSync);
  liveStatus('● Ühendatud · '+new Date(lastLiveSync).toLocaleTimeString('et-EE',{hour:'2-digit',minute:'2-digit',second:'2-digit'})+' · 10 s (avatud vaates)', 'ok');
  liveNotify(fresh);
  window.dispatchEvent(new CustomEvent('pp150:live-synced',{detail:{ordersCount:incoming.length,newOrders:incoming.filter(o=>o.status==='new').length,activeOrders:incoming.filter(o=>o.status==='active').length,newlyArrived:fresh,lastSuccess:lastLiveSync,requestMs,serverTimestamp:Number(data.updated_at||0)*1000}}));
 }catch(e){
  if(!liveMode||epoch!==liveEpoch)return;
  liveFailures++;window.pp155LiveFreshAt=0;document.body.classList.add('live-connection-error');
  // Last known records are recoverable for this authenticated browser tab only.
  // Never unlock status buttons while showing stale data.
  if(!previewOrders||!previewOrders.length){const cached=loadLiveCache();if(cached){
    window.pp153RawLiveOrders=cached.orders;
    previewOrders=cached.orders.map(o=>window.PPKitchenStatus?.overlay(o)??o);
    renderOrders();renderAux();
    document.body.dataset.pp154CacheAge=String(Math.floor((Date.now()-cached.at)/1000));
  }}
  // Keep previous known orders visible, explicitly marked as stale.
  document.body.classList.add('live-active');$('modePill').textContent='LIVE · VIGA';$('connectionText').textContent='Ühenduse viga';
  $('dataSourceLabel').textContent='● LIVE · ANDMED AEGUNUD';
  $('bottomMessage').textContent='Ühenduse viga. Näidatud andmed võivad olla aegunud.';
  liveButton.textContent='⚠ LIVE · Peata';
  liveStatus('⚠ Ühenduse viga ('+liveEscape(e.message)+') · uus katse automaatselt', 'error');
  window.dispatchEvent(new CustomEvent('pp150:live-failed',{detail:{lastSuccess:lastLiveSync,failures:liveFailures,error:String(e.message).slice(0,80)}}));
 }finally{
  clearTimeout(timeout);
  // An obsolete request must not unset the busy flag of a newer request.
  if(liveRequestController===controller){liveRequestController=null;liveBusy=false;if(liveMode&&epoch===liveEpoch)pp168SchedulePoll();}
 }
}
window.pp153UpdateKitchenUI=()=>{
 if(!liveMode||!window.pp153RawLiveOrders)return;
 previewOrders=window.pp153RawLiveOrders.map(o=>window.PPKitchenStatus?.overlay(o)??o);
 renderOrders();renderAux();
};
liveButton.addEventListener('click',async()=>{
 if(liveMode){liveStop();previewOrders=null;updateSourceUI();renderOrders();renderAux();return;}
 liveSoundUnlocked=true;if(sound)window.PPSound?.unlock();liveMode=true;liveEpoch++;liveSeen.clear();liveInitialized=false;
 const sessionEpoch=liveEpoch;liveStatus('LIVE · Ühendamine…','connecting');
 window.pp150LiveConnecting=true;previewOrders=[];document.body.classList.add('live-active');renderOrders();
 await refreshLive();
 // A stop click during the first request must never create a stray polling timer.
 if(liveMode&&liveEpoch===sessionEpoch)pp168SchedulePoll();
});
document.addEventListener('visibilitychange',()=>{if(!liveMode)return;if(document.hidden){clearTimeout(liveTimer);liveTimer=null;}else refreshLive()});
// UI refresh action reuses the SAME existing read-only request pipeline; no extra poller.
document.addEventListener('pp:refresh-live',()=>{if(liveMode)refreshLive()});
// Keep the just-arrived marker fresh without creating a second network request.
setInterval(()=>{if(liveMode&&liveRecent.size)decorateNewLiveOrders()},5000);
// LIVE is strictly read-only: even if a UI action is reintroduced by a future refactor, block writes.
// Existing event listeners reference the original function, so enforce the same guard at capture phase.
for(const id of ['newOrders','activeOrders'])$(id).addEventListener('click',e=>{
 if(!liveMode)return;const btn=e.target.closest('[data-action]');
 if(btn&&btn.dataset.action!=='details'){e.stopImmediatePropagation();e.preventDefault();toast('LIVE: ainult lugemiseks');}
},true);


// v3.5: Collapsible search and sorting, without hiding the order columns.
(function(){
 const btn=document.getElementById('toggleKitchenTools');
 const panel=document.getElementById('kitchenTools');
 if(!btn||!panel)return;
 let expanded=false;
 const apply=()=>{panel.classList.toggle('tools-open',expanded);btn.setAttribute('aria-expanded',String(expanded));btn.querySelector('span').textContent=expanded?'⌃':'⌄';};
 btn.addEventListener('click',()=>{expanded=!expanded;apply()});
 apply();
})();

/* v11.1: clearer customer names and finished history; LIVE stays read-only. */
// Print only the visible day report, without touching upstream orders.
document.getElementById('pp105-print')?.addEventListener('click',()=>{renderDailyReport();const section=document.querySelector('.pp105-report');if(!section)return;const w=window.open('','_blank','width=820,height=700');if(!w){alert('Luba hüpikaknad printimiseks');return;}w.document.write('<!doctype html><html lang="et"><meta charset="utf-8"><title>Peetri Pizza · Päevaaruanne</title><style>body{font:16px system-ui;padding:32px;color:#161616}h3{font-size:26px}.pp105-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.pp105-grid>div{padding:16px;border:1px solid #ccc;border-radius:8px}small{display:block;color:#555}strong{font-size:24px}.pp105-disclaimer{font-size:12px;color:#555;margin-top:24px}button{display:none}</style>'+section.outerHTML+'</html>');w.document.close();w.focus();setTimeout(()=>w.print(),300);});
