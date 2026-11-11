// Peetri Pizza — browser regression tests (dev only, never deployed).
// Usage: node run-tests.js [baseUrl] [expectedRelease]
// Needs: a running ./serve.sh and Playwright (require('playwright')).
'use strict';
const {chromium}=require('playwright');
const BASE=(process.argv[2]||'http://127.0.0.1:8099/peetripizza/').replace(/\/?$/,'/');
const RELEASE=process.argv[3]||'';
const results=[];
async function test(name,fn){const t0=Date.now();try{await fn();results.push({name,ok:true,ms:Date.now()-t0});console.log('PASS',name)}catch(e){results.push({name,ok:false,err:e.message});console.log('FAIL',name,'—',e.message)}}
function assert(c,m){if(!c)throw new Error(m)}
async function page(browser,opts={}){
 const ctx=await browser.newContext({viewport:opts.viewport||{width:1180,height:820}});
 const p=await ctx.newPage();p.errors=[];
 p.on('pageerror',e=>p.errors.push('pageerror: '+e.message));
 p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource: the server responded with a status of (401|500)/.test(m.text()))p.errors.push('console: '+m.text())});
 if(opts.countObservers)await p.addInitScript(()=>{
  const who=()=>((new Error().stack||'').match(/assets\/([\w.-]+\.js)/)||[])[1]||'inline';
  window.__mo={};const MO=window.MutationObserver;
  window.MutationObserver=class extends MO{constructor(cb){const w=who();super((...a)=>{window.__mo[w]=(window.__mo[w]||0)+1;return cb(...a)})}};
  // Real work scheduled by presentation scripts goes through requestAnimationFrame.
  window.__raf={};const RAF=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=cb=>{const w=who();window.__raf[w]=(window.__raf[w]||0)+1;return RAF(cb)};
 });
 p.ctx=ctx;return p;
}
const visible=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'},sel);
const now=Date.now();
const liveOrder=(i,st)=>({id:'live-'+i.toString(16).padStart(24,'0'),number:String(500+i),status:st,items:[['Margherita pizza',1],['Vesi',2]],amount:12.5,created:now-60000*i,minutes:20,deadline:now-60000*i+1200000,deadlineSource:'official',serving:'takeAway',payment:'Kaart',customerName:'Klient '+i});

(async()=>{
const browser=await chromium.launch();
const url=BASE+'dashboard.php';

await test('Loads without JavaScript errors, release meta present',async()=>{
 const p=await page(browser);await p.goto(url);await p.waitForTimeout(2500);
 const rel=await p.evaluate(()=>document.querySelector('meta[name="peetri-release"]')?.content);
 assert(rel,'no peetri-release meta');if(RELEASE)assert(rel===RELEASE,`release ${rel} != ${RELEASE}`);
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('First paint: no legacy UI visible while booting, reveal < 3.5s (slow tablet)',async()=>{
 const p=await page(browser);const cdp=await p.ctx.newCDPSession(p);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:100000});
 const t0=Date.now();p.goto(url).catch(()=>{});let revealedAt=0;const leaks=[];
 for(let i=0;i<40&&!revealedAt;i++){await p.waitForTimeout(100);
  const st=await p.evaluate(()=>{const s=document.querySelector('body>.shell');return {booting:document.documentElement.classList.contains('pp170-booting'),shellVisible:!!s&&getComputedStyle(s).visibility!=='hidden',shellExists:!!s}}).catch(()=>null);
  if(!st)continue;if(st.booting&&st.shellExists&&st.shellVisible)leaks.push(i);if(!st.booting&&st.shellExists)revealedAt=Date.now()-t0;}
 assert(!leaks.length,'shell visible while booting at samples '+leaks.join(','));
 assert(revealedAt&&revealedAt<3500+1500,'not revealed in time ('+revealedAt+'ms incl. slow network)');
 await p.ctx.close();
});

await test('Menu: every other section hides the order queue completely',async()=>{
 const p=await page(browser);await p.goto(url);await p.waitForTimeout(1500);
 for(const pg of ['products','statistics','settings']){
  await p.evaluate(pg=>document.querySelector('#drawer [data-page="'+pg+'"]').click(),pg);await p.waitForTimeout(300);
  assert(await visible(p,'#'+pg+'Page'),pg+' page not visible');
  assert(!(await visible(p,'#ordersPage')),'order queue visible on '+pg);
  assert(!(await visible(p,'#newOrders')),'new orders visible on '+pg);
 }
 await p.evaluate(()=>document.querySelector('#drawer [data-page="orders"]').click());await p.waitForTimeout(300);
 assert(await visible(p,'#newOrders'),'queue not back on Tellimused');
 const items=await p.evaluate(()=>[...document.querySelectorAll('#drawer nav .navitem')].map(e=>e.textContent.replace(/\d+|↗/g,'').trim()));
 for(const want of ['Tellimused','Tooted','Statistika','Taigna tellimine','Boonused','Seaded'])assert(items.some(t=>t.startsWith(want)),'menu item missing: '+want);
 assert(!items.some(t=>/Köögimeeskond|Tarnekalender/i.test(t)),'forbidden menu item present');
 const bonus=await p.evaluate(()=>[...document.querySelectorAll('#drawer a')].find(a=>/Boonused/.test(a.textContent))?.href);
 assert(bonus==='https://peetripizza.ee/bonus/','Boonused link is '+bonus);
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('Product contract: no kitchen search, no LIVE Engine badges, Ooteaeg only in header',async()=>{
 const p=await page(browser);await p.goto(url);await p.waitForTimeout(1500);
 assert(!(await visible(p,'#orderSearch')),'kitchen search visible');
 const txt=await p.evaluate(()=>document.body.innerText);
 assert(!/LIVE Engine/i.test(txt),'LIVE Engine badge text present');
 assert(!/Köögimeeskond|Tarnekalender/i.test(txt),'removed module text visible');
 const waits=await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&/^\s*Ooteaeg\s*$/i.test(e.textContent)&&e.getClientRects().length).map(e=>!!e.closest('.topbar')));
 assert(waits.length&&waits.every(Boolean),'Ooteaeg shown outside the header');
 assert(await visible(p,'#pp172-mode'),'DEMO/LIVE switch not visible');
 assert(!(await visible(p,'#ordersPage .pp157-list-header')),'v17.3: row under the header still visible');
 assert(await p.evaluate(()=>!!document.querySelector('button[aria-label="Laadi päris tellimused ainult lugemiseks"]')),'native LIVE button removed from DOM');
 await p.ctx.close();
});

await test('Demo orders: add, accept moves to Valmistamisel, timers tick',async()=>{
 const p=await page(browser);await p.goto(url);await p.waitForTimeout(1500);
 await p.evaluate(()=>document.getElementById('demoAdd').click());await p.waitForTimeout(300);
 const before=await p.evaluate(()=>({n:document.querySelectorAll('#newOrders .ordercard').length,a:document.querySelectorAll('#activeOrders .ordercard').length}));
 assert(before.n>0,'no new demo orders');
 const t1=await p.evaluate(()=>document.querySelector('#ordersPage [data-timer]')?.textContent);
 await p.click('#newOrders .ordercard button:has-text("Võta vastu")');await p.waitForTimeout(400);
 const after=await p.evaluate(()=>({n:document.querySelectorAll('#newOrders .ordercard').length,a:document.querySelectorAll('#activeOrders .ordercard').length}));
 assert(after.n===before.n-1&&after.a===before.a+1,`accept did not move order ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
 await p.waitForTimeout(2200);
 const t2=await p.evaluate(()=>document.querySelector('#ordersPage [data-timer]')?.textContent);
 assert(t1&&t2&&t1!==t2,'timer did not tick ('+t1+' / '+t2+')');
 const levels=await p.evaluate(()=>[...document.querySelectorAll('#ordersPage .ordercard')].every(c=>{const t=c.querySelector('.pp117-countdown');if(!t)return true;const want=c.classList.contains('urgency-late')?'late':c.classList.contains('urgency-soon')?'soon':'normal';return t.dataset.level===want}));
 assert(levels,'timer colour level out of sync with urgency');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('Timer tick does not wake presentation scripts every second',async()=>{
 const p=await page(browser,{countObservers:true});await p.goto(url);await p.waitForTimeout(1500);
 for(let i=0;i<5;i++){await p.evaluate(()=>document.getElementById('demoAdd').click());await p.waitForTimeout(100)}
 await p.waitForTimeout(800);await p.evaluate(()=>{window.__mo={};window.__raf={}});await p.waitForTimeout(10000);
 const {mo,raf}=await p.evaluate(()=>({mo:window.__mo,raf:window.__raf}));
 // Before v17.1 peetri-v160 repainted every second (~10 per 10s). Allowed: its own 10s safety tick + slack.
 const hot=['peetri-v160.js'].filter(k=>(raf[k]||0)>3);
 assert(!hot.length,'repaints too often in 10s: raf='+JSON.stringify(raf)+' observers='+JSON.stringify(mo));
 await p.ctx.close();
});

await test('LIVE (mocked, read-only): sync, then outage keeps last orders + warning',async()=>{
 const p=await page(browser);let calls=0;const writes=[];
 await p.route('**/api/live.php*',r=>{calls++;if(r.request().method()!=='GET')writes.push(r.request().method());if(calls<=2)return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:[liveOrder(1,'new'),liveOrder(2,'new'),liveOrder(3,'active')],updated_at:Math.floor(Date.now()/1000)})});return r.fulfill({status:500,body:'x'})});
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2500);
 const synced=await p.evaluate(()=>document.querySelectorAll('#ordersPage .ordercard').length);
 assert(synced===3,'expected 3 LIVE cards, got '+synced);
 await p.waitForTimeout(24000);
 const st=await p.evaluate(()=>({cards:document.querySelectorAll('#ordersPage .ordercard').length,err:document.body.classList.contains('live-connection-error'),warn:document.getElementById('pp164-connection-warning')?.dataset.active}));
 assert(calls>=3,'LIVE not polled again');assert(st.err,'no connection-error state');
 assert(st.cards===3,'last known orders disappeared during outage');assert(st.warn==='true','no visible LIVE warning');
 assert(!writes.length,'non-GET request to live.php');
 await p.click('#pp172-mode [data-mode="demo"]');await p.waitForTimeout(600);
 const stopped=await p.evaluate(()=>!document.body.classList.contains('live-active'));
 assert(stopped,'LIVE did not stop via button');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('Header shortcuts: Statistika and Valmis (N) use the existing navigation',async()=>{
 const p=await page(browser);await p.goto(url);await p.waitForTimeout(1500);
 assert(await visible(p,'#pp171-stats'),'Statistika header button missing');
 assert(await visible(p,'#pp171-ready'),'Valmis header button missing');
 const counts=await p.evaluate(()=>[document.getElementById('pp171-ready-count').textContent,document.getElementById('doneCount').textContent.trim()]);
 assert(counts[0]===counts[1],'Valmis count '+counts[0]+' != done '+counts[1]);
 await p.click('#pp171-stats');await p.waitForTimeout(300);
 assert(await visible(p,'#statisticsPage'),'Statistika did not open');
 assert(!(await visible(p,'#ordersPage')),'queue visible on Statistika');
 assert(await p.getAttribute('#pp171-stats','aria-pressed')==='true','Statistika not marked active');
 await p.click('#pp171-ready');await p.waitForTimeout(500);
 assert(await visible(p,'#ordersPage'),'Valmis did not return to Tellimused');
 assert(await p.getAttribute('#toggleHistory','aria-expanded')==='true','ready history not opened');
 assert(await p.getAttribute('#pp171-ready','aria-pressed')==='true','Valmis not marked active');
 await p.click('#pp171-ready');await p.waitForTimeout(300);
 assert(await p.getAttribute('#toggleHistory','aria-expanded')==='false','ready history did not close');
 for(const vp of [{width:768,height:1024},{width:1024,height:768},{width:1366,height:1024}]){
  await p.setViewportSize(vp);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const t=document.querySelector('.topbar').getBoundingClientRect();const kids=[...document.querySelectorAll('.topbar .top-right > *')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());return {h:t.height,overflow:kids.some(k=>k.right>innerWidth+1||k.top>t.top+t.height)}});
  assert(!r.overflow,'header overflows at '+vp.width+'px');
 }
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.2: DEMO/LIVE switch drives the original read-only LIVE button',async()=>{
 const p=await page(browser);let calls=0;
 await p.route('**/api/live.php*',r=>{calls++;return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:[liveOrder(7,'new')],updated_at:Math.floor(Date.now()/1000)})})});
 await p.goto(url);await p.waitForTimeout(1500);
 assert(await visible(p,'#pp172-mode'),'switch missing');
 assert(await p.getAttribute('#pp172-mode','data-state')==='demo','initial state not demo');
 await p.click('#pp172-mode [data-mode="demo"]');await p.waitForTimeout(300);
 assert(calls===0,'clicking DEMO while in DEMO started LIVE');
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2000);
 assert(calls>=1,'LIVE not requested');
 assert(await p.getAttribute('#pp172-mode','data-state')==='live','switch not in live state');
 assert(await p.getAttribute('#pp172-mode [data-mode="live"]','aria-pressed')==='true','LIVE not pressed');
 const n=await p.evaluate(()=>document.querySelectorAll('#ordersPage .ordercard').length);assert(n===1,'expected 1 LIVE card, got '+n);
 await p.click('#pp172-mode [data-mode="demo"]');await p.waitForTimeout(600);
 assert(!(await p.evaluate(()=>document.body.classList.contains('live-active'))),'DEMO did not stop LIVE');
 assert(await p.getAttribute('#pp172-mode','data-state')==='demo','switch not back to demo');
 // phone: single pill toggles
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);
 await p.click('#pp172-mode button[aria-pressed="true"]');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>document.body.classList.contains('live-active')),'phone pill did not start LIVE');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.2: tools block hidden, same header on every page, backdrop covers header',async()=>{
 const p=await page(browser,{viewport:{width:820,height:1180}});await p.goto(url);await p.waitForTimeout(1500);
 assert(!(await visible(p,'#pp157-more')),'Tööriistad ja ülevaated still visible');
 const sig=()=>p.evaluate(()=>['.pp116-logo','.pp114-location','.topbar','.topbar .top-right'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,Math.round(r.left),Math.round(r.width),Math.round(r.height)].join(':')}).join('|')+'|online:'+!!document.getElementById('pp142-online')?.getClientRects().length);
 const ref=await sig();
 for(const pg of ['products','statistics','settings']){await p.evaluate(pg=>document.querySelector('#drawer [data-page="'+pg+'"]').click(),pg);await p.waitForTimeout(250);const s2=await sig();assert(s2===ref,'header differs on '+pg+': '+s2+' vs '+ref)}
 await p.click('#menuBtn');await p.waitForTimeout(300);
 const z=await p.evaluate(()=>[+getComputedStyle(document.getElementById('backdrop')).zIndex,+getComputedStyle(document.querySelector('.topbar')).zIndex]);
 assert(z[0]>z[1],'backdrop below header '+z);
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.3: full-screen button in the header',async()=>{
 const p=await page(browser,{viewport:{width:820,height:1180}});await p.goto(url);await p.waitForTimeout(1500);
 assert(await visible(p,'#pp173-fullscreen'),'fullscreen button missing at tablet width');
 await p.click('#pp173-fullscreen');await p.waitForTimeout(600);
 const on=await p.evaluate(()=>[!!document.fullscreenElement,document.getElementById('pp173-fullscreen').getAttribute('aria-pressed'),document.getElementById('toast')?.textContent||'']);
 assert(on[0]?on[1]==='true':/Täisekraan/.test(on[2]),'fullscreen neither entered nor explained: '+on);
 if(on[0]){await p.click('#pp173-fullscreen');await p.waitForTimeout(600);assert(!(await p.evaluate(()=>!!document.fullscreenElement)),'did not exit fullscreen');}
 for(const vp of [{width:768,height:1024},{width:820,height:1180},{width:1024,height:768}]){await p.setViewportSize(vp);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const t=document.querySelector('.topbar').getBoundingClientRect();return [...document.querySelectorAll('.topbar .top-right > *')].filter(e=>e.getClientRects().length).some(e=>{const k=e.getBoundingClientRect();return k.right>innerWidth+1||k.top>t.top+t.height})});
  assert(!r,'header overflows at '+vp.width);}
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('Tablet: drawer menu scrolls on short screens',async()=>{
 const p=await page(browser,{viewport:{width:1024,height:420}});await p.goto(url);await p.waitForTimeout(1500);
 await p.click('#menuBtn');await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const d=document.getElementById('drawer');const cands=[d,...d.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+4&&/(auto|scroll)/.test(getComputedStyle(e).overflowY));const last=[...d.querySelectorAll('nav .navitem')].pop();return {scrollable:cands.length>0,fits:d.scrollHeight<=d.clientHeight+4,lastText:last?.textContent.trim()}});
 assert(r.scrollable||r.fits,'drawer neither fits nor scrolls');
 await p.ctx.close();
});

await test('v17.4: identical LIVE polls keep the same cards, changed data re-renders',async()=>{
 const p=await page(browser);let calls=0,extra=false;
 await p.route('**/api/live.php*',r=>{calls++;const orders=[liveOrder(1,'new'),liveOrder(3,'active')];if(extra)orders.push(liveOrder(4,'new'));return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders,updated_at:Math.floor(Date.now()/1000)})})});
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2500);
 await p.evaluate(()=>document.querySelectorAll('#ordersPage .ordercard').forEach(c=>c.dataset.pp174Mark='1'));
 const before=calls;await p.waitForTimeout(11500);
 const kept=await p.evaluate(()=>[...document.querySelectorAll('#ordersPage .ordercard')].map(c=>c.dataset.pp174Mark||''));
 assert(calls>before,'LIVE not polled again');assert(kept.length===2&&kept.every(x=>x==='1'),'cards were rebuilt on identical data: '+JSON.stringify(kept));
 const t1=await p.evaluate(()=>document.querySelector('#ordersPage [data-timer]')?.textContent);await p.waitForTimeout(2100);
 const t2=await p.evaluate(()=>document.querySelector('#ordersPage [data-timer]')?.textContent);
 assert(t1&&t2&&t1!==t2,'timers stopped ticking ('+t1+' / '+t2+')');
 extra=true;await p.waitForTimeout(11000);
 const after=await p.evaluate(()=>({n:document.querySelectorAll('#ordersPage .ordercard').length,marked:document.querySelectorAll('#ordersPage .ordercard[data-pp174-mark]').length}));
 assert(after.n===3,'new LIVE order not shown, cards='+after.n);assert(after.marked===2,'v17.16: unchanged cards must stay, only the new one is built (marked='+after.marked+')');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.4: session expiry (401) shows login banner, recovery hides it',async()=>{
 const p=await page(browser);let calls=0,expired=false;
 await p.route('**/api/live.php*',r=>{calls++;if(expired)return r.fulfill({status:401,contentType:'application/json',body:'{"ok":false,"error":"authentication_required"}'});return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:[liveOrder(1,'new')],updated_at:Math.floor(Date.now()/1000)})})});
 await p.goto(url);await p.waitForTimeout(1200);
 assert(!(await visible(p,'#pp174-session')),'banner visible without reason');
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2000);
 expired=true;await p.waitForTimeout(11500);
 assert(await visible(p,'#pp174-session'),'session banner not shown after 401');
 assert(await p.getAttribute('#pp174-session a','href')==='./?aegus=1','login link wrong');
 const cards=await p.evaluate(()=>document.querySelectorAll('#ordersPage .ordercard').length);assert(cards===1,'cards lost on 401');
 expired=false;await p.evaluate(()=>window.dispatchEvent(new Event('online')));await p.waitForTimeout(2500);
 assert(!(await visible(p,'#pp174-session')),'banner stayed after recovery (online refresh)');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.4: stale LIVE tap is refused with a visible notice, no write',async()=>{
 const p=await page(browser);let calls=0;const posts=[];
 await p.route('**/api/live.php*',r=>{calls++;if(calls<=1)return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:[liveOrder(1,'new')],updated_at:Math.floor(Date.now()/1000)})});return r.fulfill({status:500,body:'x'})});
 p.on('request',rq=>{if(rq.url().includes('kitchen-status.php')&&rq.method()==='POST')posts.push(1)});
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2000);
 await p.waitForTimeout(12000);
 const err=await p.evaluate(()=>document.body.classList.contains('live-connection-error'));assert(err,'outage not detected');
 await p.click('#ordersPage .ordercard button[data-kitchen-action]');await p.waitForTimeout(500);
 assert(await visible(p,'#pp174-stale'),'stale notice not shown');
 assert(!posts.length,'kitchen status was written with stale data');
 await p.click('#pp174-stale [data-pp174="close"]');await p.waitForTimeout(200);
 assert(!(await visible(p,'#pp174-stale')),'notice did not close');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.4: fresh LIVE tap still saves kitchen status (no false notice)',async()=>{
 const p=await page(browser);const posts=[];
 await p.route('**/api/live.php*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:[liveOrder(1,'new')],updated_at:Math.floor(Date.now()/1000)})}));
 p.on('request',rq=>{if(rq.url().includes('kitchen-status.php')&&rq.method()==='POST')posts.push(1)});
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2500);
 await p.click('#ordersPage .ordercard button[data-kitchen-action]');await p.waitForTimeout(1200);
 assert(!(await visible(p,'#pp174-stale')),'false stale notice');
 assert(posts.length===1,'kitchen status not saved, posts='+posts.length);
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.4: sound banner + wake lock setting',async()=>{
 const p=await page(browser);
 await p.route('**/api/live.php*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:[liveOrder(1,'new')],updated_at:Math.floor(Date.now()/1000)})}));
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2000);
 await p.evaluate(()=>{const real=window.PPSound;window.__unlocks=0;window.PPSound=Object.assign({},real,{diagnostics:()=>({supported:true,enabled:true,state:'suspended',tone:'double',volume:60}),unlock:()=>{window.__unlocks++;return Promise.resolve(true)}});});
 await p.waitForTimeout(2300);
 assert(await visible(p,'#pp174-sound'),'sound banner not shown while audio is blocked');
 await p.click('#pp174-sound button');await p.waitForTimeout(200);
 assert(await p.evaluate(()=>window.__unlocks)>=1,'banner tap did not unlock audio');
 await p.click('#pp172-mode [data-mode="demo"]');await p.waitForTimeout(2500);
 assert(!(await visible(p,'#pp174-sound')),'sound banner shown in DEMO');
 await p.click('#menuBtn');await p.click('#drawer [data-page="settings"]');await p.waitForTimeout(400);
 assert(await visible(p,'#pp174-wakelock'),'wake lock toggle missing in Seaded');
 const r=await p.evaluate(()=>{const i=document.getElementById('pp174-wakelock');const row=i.closest('.pp163-setting-row').getBoundingClientRect();const ref=document.getElementById('pp163-display-toggle').closest('.pp163-setting-row').getBoundingClientRect();return {checked:i.checked,dx:Math.abs(row.left-ref.left),dw:Math.abs(row.width-ref.width)}});
 assert(r.checked,'wake lock should default on');assert(r.dx<1&&r.dw<1,'wake lock row misaligned '+JSON.stringify(r));
 await p.click('#pp174-wakelock');
 assert(await p.evaluate(()=>localStorage.getItem('pp-wakelock-v174'))==='false','wake lock choice not saved');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.4: JS errors are journaled to api/client-log.php (scrubbed)',async()=>{
 const p=await page(browser);await p.goto(url);await p.waitForTimeout(1200);
 const resp=p.waitForResponse(r=>r.url().includes('api/client-log.php'),{timeout:5000});
 await p.evaluate(()=>setTimeout(()=>{throw new Error('pp174 test boom mari@example.com +372 5555 1234')},0));
 const r=await resp;assert(r.status()===200,'client-log status '+r.status());
 const body=JSON.parse(r.request().postData());assert(body.kind==='error'&&body.release,'bad report body');
 const bad=await p.evaluate(async()=>{const x=await fetch('api/client-log.php',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"message":"x"}'});return x.status});
 assert(bad===403,'endpoint accepted request without CSRF: '+bad);
 await p.ctx.close();
});

// ---------------- v17.14 Regression Guard ----------------
const fakePrint=()=>{window.__printed=[];window.__openBlocked=false;window.open=function(){if(window.__openBlocked)return null;const w={closed:false,_h:'',document:{open(){},write(h){w._h+=h},close(){window.__printed.push(w._h)}},focus(){},print(){},addEventListener(){},close(){w.closed=true}};return w;};};
const late=async p=>{await p.waitForFunction(()=>window.PPPrintMonitor&&window.PPHealth&&document.getElementById('pp1714-print-monitor'),null,{timeout:8000});};

await test('v17.14 print: first print, then duplicate asks first and the copy says KOOPIA',async()=>{
 const p=await page(browser);await p.addInitScript(fakePrint);await p.goto(url);await late(p);
 await p.evaluate(()=>window.dispatchEvent(new CustomEvent('pp168:details-opened',{detail:{id:'demo-901',number:'901',status:'new',created:Date.now(),items:[['Margherita',1]]}})));
 await p.evaluate(()=>window.PPPrint169.printManual({id:'demo-901',number:'901',created:Date.now(),items:[['Margherita',1]]}));
 await p.waitForFunction(()=>window.PPPrintMonitor.record('demo-901')?.count===1,null,{timeout:5000});
 assert(await p.evaluate(()=>window.__printed.length===1&&!/KOOPIA/.test(window.__printed[0])),'first print wrong');
 await p.evaluate(()=>window.PPPrint169.printManual({id:'demo-901',number:'901',created:Date.now(),items:[['Margherita',1]]}));
 await p.waitForSelector('#pp1714-print-dialog[open]',{timeout:3000});
 assert(await p.evaluate(()=>window.__printed.length===1),'printed before the question');
 await p.click('#pp1714-pd-yes');await p.waitForTimeout(300);
 assert(await p.evaluate(()=>window.__printed.length===2&&/KOOPIA/.test(window.__printed[1])),'copy not marked KOOPIA');
 await p.waitForFunction(()=>window.PPPrintMonitor.record('demo-901')?.count===2,null,{timeout:5000});
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.14 print: blocked popup shows a red bar with "Prindi nüüd"',async()=>{
 const p=await page(browser);await p.addInitScript(fakePrint);await p.goto(url);await late(p);
 await p.evaluate(()=>{window.__openBlocked=true;window.PPPrint169.printManual({id:'demo-902',number:'902',created:Date.now(),items:[['Vesi',1]]});});
 await p.waitForSelector('#pp1714-print-bar.bad:not([hidden])',{timeout:3000});
 await p.evaluate(()=>{window.__openBlocked=false;});await p.click('#pp1714-print-bar [data-pp1714="now"]');await p.waitForTimeout(300);
 assert(await p.evaluate(()=>window.__printed.length===1),'"Prindi nüüd" did not print');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.14 health: Seaded shows LIVE, sync, printer, storage, version and tablet cards',async()=>{
 const p=await page(browser);await p.goto(url);await late(p);
 await p.evaluate(()=>document.querySelector('#drawer [data-page="settings"]').click());
 await p.waitForFunction(()=>document.querySelectorAll('#pp1714-health .pp1714-sh-tile').length>=7&&/Kontrollitud/.test(document.querySelector('#pp1714-health .pp1714-sh-head')?.textContent||''),null,{timeout:10000});
 const keys=await p.evaluate(()=>[...document.querySelectorAll('#pp1714-health .pp1714-sh-tile')].map(t=>t.dataset.key));
 for(const k of ['live','sync','net','print','storage','version','device','server'])assert(keys.includes(k),'missing card '+k+' in '+keys);
 const ver=await p.evaluate(()=>document.querySelector('#pp1714-health [data-key="version"]').dataset.state);assert(ver==='ok','version card '+ver);
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.16 Statistika: Täna köögis, Karbid, Köögi analüütika, Päevaaruanne, Lõpeta vahetus hidden; the rest stays',async()=>{
 const p=await page(browser);await p.goto(url);await late(p);
 await p.waitForFunction(()=>!!window.PP1716,null,{timeout:8000});
 await p.evaluate(()=>document.querySelector('#drawer [data-page="statistics"]').click());await p.waitForTimeout(800);
 for(const sel of ['#pp176-today','#pp1714-analytics','#pp143-report','#pp1711-shift-open'])assert(!(await visible(p,sel)),sel+' still visible');
 const txt=await p.evaluate(()=>document.getElementById('statisticsPage').innerText);
 assert(!/Karbid täna|Täna köögis|Köögi analüütika|Päevaaruanne|Lõpeta vahetus/.test(txt),'hidden block text on screen');
 for(const sel of ['#statsData','#performanceStats','#statisticsPage .pp145-insights'])assert(await visible(p,sel),sel+' disappeared');
 assert(await p.evaluate(()=>!!document.getElementById('pp1714-analytics')&&!!document.getElementById('pp176-today')),'blocks were removed from the DOM (must only be hidden)');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.14 speed mode: switch adds pp1714-lite and survives reload; off by default',async()=>{
 const p=await page(browser);await p.goto(url);await late(p);
 assert(!(await p.evaluate(()=>document.documentElement.classList.contains('pp1714-lite'))),'lite on by default');
 await p.evaluate(()=>{const i=document.getElementById('pp1714-lite');i.checked=true;i.dispatchEvent(new Event('change'))});
 await p.reload();await late(p);
 assert(await p.evaluate(()=>document.documentElement.classList.contains('pp1714-lite')),'lite not kept');
 await p.evaluate(()=>{const i=document.getElementById('pp1714-lite');i.checked=false;i.dispatchEvent(new Event('change'))});
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.14 dough: unsaved changes guard, edit window badge, history summary',async()=>{
 const p=await page(browser);await p.goto(BASE+'dough.php');await p.waitForTimeout(1200);
 const plus=await p.$('#items .item:not(.disabled) button.plus');assert(plus,'no enabled product');await plus.click();
 assert(await p.evaluate(()=>!document.getElementById('pp1714-unsaved').hidden),'unsaved marker not shown');
 await p.click('a.back');await p.waitForSelector('#pp1714-leave[open]',{timeout:3000});
 await p.click('#pp1714-stay');assert(/dough\.php/.test(p.url()),'left the page');
 p.once('dialog',d=>d.accept());await p.click('#save');await p.waitForFunction(()=>/salvestatud/.test(document.getElementById('message').textContent),null,{timeout:5000});
 assert(await p.evaluate(()=>document.getElementById('pp1714-unsaved').hidden),'unsaved marker stays after save');
 await p.waitForSelector('#history .pp1714-dough-sum',{timeout:4000});
 assert(await p.evaluate(()=>!!document.querySelector('#history .pp1714-lock.open')),'no "Muudetav kuni" badge');
 await p.click('#history [data-edit]');await p.waitForSelector('#pp1714-editbar:not([hidden])',{timeout:3000});
 await p.click('#pp1714-edit-cancel');assert(await p.evaluate(()=>document.getElementById('pp1714-editbar').hidden),'edit bar not closed');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.14 responsive: no sideways scroll on phone, portrait and landscape tablet',async()=>{
 for(const vp of [{width:360,height:740},{width:800,height:1280},{width:1280,height:800}]){
  const p=await page(browser,{viewport:vp});await p.goto(url);await late(p);
  for(const pg of ['orders','statistics','settings']){
   await p.evaluate(pg=>document.querySelector('#drawer [data-page="'+pg+'"]')?.click(),pg);await p.waitForTimeout(400);
   const w=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(w<=2,vp.width+'px '+pg+' scrolls sideways by '+w+'px');
  }
  await p.goto(BASE+'dough.php');await p.waitForTimeout(800);
  const w=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(w<=2,vp.width+'px dough scrolls sideways by '+w+'px');
  assert(!p.errors.length,vp.width+': '+p.errors.join(' | '));await p.ctx.close();
 }
});

await test('v17.15: Seaded → Versioon shows the permanent update command; slimmed CSS and late modules load',async()=>{
 const p=await page(browser);await p.goto(url);await p.waitForFunction(()=>window.PPPrint169&&window.PPHealth,null,{timeout:8000});
 await p.evaluate(()=>document.querySelector('#drawer [data-page="settings"]').click());
 await p.waitForSelector('#pp1715-update code',{timeout:8000});
 const cmd=await p.textContent('#pp1715-update code');assert(/raw\.githubusercontent\.com\/ehallmere-alt\/Peetripizza\/main\/patches\/update-latest-ssh\.txt/.test(cmd)&&/&& bash /.test(cmd),'command '+cmd);
 const css=await p.evaluate(()=>[...document.styleSheets].map(s=>s.href||'').filter(h=>/kitchen-release/.test(h)));assert(css.length===1&&/v1715/.test(css[0]),'css '+css);
 assert(await p.evaluate(()=>typeof window.PPPrint169.printManual==='function'&&!!document.getElementById('pp169-health-check')),'late modules missing');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.16 LIVE: only the changed card is rebuilt, the rest stay the same node',async()=>{
 const p=await page(browser);let st1='new',extra=false;
 await p.route('**/api/live.php*',r=>{const orders=[liveOrder(1,st1),liveOrder(3,'active')];if(extra)orders.push(liveOrder(4,'new'));return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders,updated_at:Math.floor(Date.now()/1000)})})});
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2500);
 await p.evaluate(()=>document.querySelectorAll('#ordersPage .ordercard').forEach(c=>c.dataset.m=c.dataset.orderId));
 const built0=await p.evaluate(()=>window.pp1716BuiltCards());
 extra=true;st1='active';await p.evaluate(()=>document.dispatchEvent(new Event('pp:refresh-live')));await p.waitForTimeout(2500);
 const r=await p.evaluate(()=>({nw:[...document.querySelectorAll('#newOrders .ordercard')].map(c=>[c.dataset.orderId.slice(-1),c.dataset.m||'']),act:[...document.querySelectorAll('#activeOrders .ordercard')].map(c=>[c.dataset.orderId.slice(-1),c.dataset.m||'']),built:window.pp1716BuiltCards()}));
 const a3=r.act.find(x=>x[0]==='3'),a1=r.act.find(x=>x[0]==='1'),n4=r.nw.find(x=>x[0]==='4');
 assert(a3&&a3[1],'unchanged order 3 was rebuilt '+JSON.stringify(r));
 assert(a1&&!a1[1],'order 1 moved to active but card not rebuilt '+JSON.stringify(r));
 assert(n4&&!n4[1],'new order 4 missing '+JSON.stringify(r));
 assert(r.built-built0===2,'expected 2 built cards, got '+(r.built-built0));
 const t1=await p.textContent('#activeOrders [data-timer]');await p.waitForTimeout(2100);assert(t1!==await p.textContent('#activeOrders [data-timer]'),'timer stopped on kept card');
 assert(!(await visible(p,'button[aria-label="Laadi päris tellimused ainult lugemiseks"]')),'v17.16: old "Reaalsed tellimused" button still visible');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

const empty=(r,list)=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:list||[],updated_at:Math.floor(Date.now()/1000)})});
await test('v17.16 self-update: new server version reloads only when no orders, LIVE comes back on',async()=>{
 const p=await page(browser);let list=[liveOrder(1,'new')],ver='17.99.0';
 await p.route('**/api/live.php*',r=>empty(r,list));
 await p.route('**/api/release.php*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:ver})}));
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2000);
 await p.waitForFunction(()=>!!window.PP1716,null,{timeout:8000});
 await p.evaluate(()=>{window.__same=1});
 await p.evaluate(()=>window.PP1716.checkVersion());await p.waitForTimeout(800);
 assert(await p.evaluate(()=>window.__same===1),'reloaded while an order was in work');
 assert(await visible(p,'#pp1716-update'),'update bar not shown');
 list=[];await p.evaluate(()=>document.dispatchEvent(new Event('pp:refresh-live')));await p.waitForTimeout(1500);
 ver=await p.evaluate(()=>document.querySelector('meta[name="peetri-release"]').content);
 await p.evaluate(()=>window.PP1716._test.setServer('17.99.0'));
 await Promise.all([p.waitForNavigation({timeout:8000}),p.evaluate(()=>window.PP1716.tryUpdate())]);
 await p.waitForTimeout(4500);
 assert(await p.evaluate(()=>window.__same===undefined),'page not reloaded');
 assert(await p.evaluate(()=>document.body.classList.contains('live-active')),'LIVE not switched back on after reload');
 assert(!(await visible(p,'#pp1716-update')),'update bar still shown on the new version');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.16 night reload: only 05:00–05:30 Tallinn, after 6 h open, once a day, no orders',async()=>{
 const p=await page(browser);
 await p.route('**/api/live.php*',r=>empty(r,[]));
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2000);
 await p.waitForFunction(()=>!!window.PP1716,null,{timeout:8000});
 const r=await p.evaluate(()=>{const at=h=>new Date(Date.UTC(2026,10,12,h-2,10));const N=window.PP1716.nightTick;
  return {day:N(at(14),8*3600000),young:N(at(5),3600000),orders:window.PP1716.busyReason()}});
 assert(r.day===false&&r.young===false,'reload at a wrong time '+JSON.stringify(r));
 assert(r.orders==='','busy with no orders: '+r.orders);
 await p.evaluate(()=>{window.__same=1;try{localStorage.removeItem('pp1716-night')}catch(_){}});
 await Promise.all([p.waitForNavigation({timeout:8000}),p.evaluate(()=>window.PP1716.nightTick(new Date(Date.UTC(2026,10,12,3,10)),7*3600000))]);
 await p.waitForTimeout(4500);
 assert(await p.evaluate(()=>window.__same===undefined&&document.body.classList.contains('live-active')),'night reload or LIVE resume failed');
 await p.waitForFunction(()=>!!window.PP1716,null,{timeout:8000});
 assert(await p.evaluate(()=>window.PP1716.nightTick(new Date(Date.UTC(2026,10,12,3,15)),7*3600000))===false,'second night reload on the same day');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.16 LIVE silent 3 min: red bar + sound, gone after a good sync',async()=>{
 const p=await page(browser);
 await p.route('**/api/live.php*',r=>empty(r,[liveOrder(1,'new')]));
 await p.goto(url);await p.waitForTimeout(1200);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2000);
 await p.waitForFunction(()=>!!window.PP1716,null,{timeout:8000});
 assert(!(await visible(p,'#pp1716-silent')),'silent bar without reason');
 const r=await p.evaluate(()=>{let beeps=0;const old=window.PPSound.play;window.PPSound.play=k=>{if(k==='offline')beeps++;return true};
  window.PP1716._test.setLastOk(Date.now()-200000);const a=window.PP1716.silentTick();const b=window.PP1716.silentTick();window.PPSound.play=old;return {a,b,beeps}});
 assert(r.a&&r.beeps===1,'bar/sound not triggered once '+JSON.stringify(r));
 assert(await visible(p,'#pp1716-silent'),'silent bar not visible');
 assert(/3/.test(await p.textContent('#pp1716-silent-min')),'minutes not shown');
 await p.click('#pp1716-silent-retry');await p.waitForTimeout(1500);
 assert(!(await visible(p,'#pp1716-silent')),'bar stays after LIVE answered again');
 await p.click('#pp172-mode [data-mode="demo"]');await p.waitForTimeout(500);
 await p.evaluate(()=>window.PP1716._test.setLastOk(Date.now()-900000));
 assert(await p.evaluate(()=>window.PP1716.silentTick())===false,'alarm in DEMO');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.16 Seaded: daily data copy card, restore asks first',async()=>{
 const p=await page(browser);
 await p.goto(url);await p.waitForTimeout(1200);
 await p.waitForFunction(()=>!!window.PP1716,null,{timeout:8000});
 await p.evaluate(()=>document.querySelector('#drawer [data-page="settings"]').click());
 await p.evaluate(()=>window.PP1716.loadBackups());
 await p.waitForFunction(()=>/Viimane koopia/.test(document.getElementById('pp1716-last')?.textContent||''),null,{timeout:8000});
 assert(await visible(p,'#pp1716-backup'),'card not visible in Seaded');
 let asked='';p.once('dialog',d=>{asked=d.message();d.dismiss()});
 await p.click('#pp1716-restore');await p.waitForTimeout(500);
 assert(/Taastada/.test(asked),'restore did not ask first');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});

await test('v17.17 allergy: "allergia", "ilma …" and gluteenivaba marked red on the card and on the 80 mm ticket',async()=>{
 const p=await page(browser);await p.addInitScript(fakePrint);
 const o1={...liveOrder(1,'new'),note:'Lapsel on pähkliallergia! Palun ilma sibulata.',items:[['Pepperoni — Põhi: gluteenivaba',1],['Vesi',2]]};
 await p.route('**/api/live.php*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:[o1,liveOrder(3,'active')],updated_at:Math.floor(Date.now()/1000)})}));
 await p.goto(url);await late(p);
 await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(2500);
 const r=await p.evaluate(()=>{const c=document.querySelector('#ordersPage .ordercard[data-order-id$="1"]'),c3=document.querySelector('#ordersPage .ordercard[data-order-id$="3"]');
  return {marks:[...c.querySelectorAll('mark.pp1717')].map(m=>m.textContent),badge:c.querySelector('.pp1717-badge')?.textContent||'',alert:c.classList.contains('pp1717-alert'),clean:!c3.querySelector('mark.pp1717,.pp1717-badge'),bg:getComputedStyle(c.querySelector('mark.pp1717')).backgroundColor}});
 assert(r.marks.some(x=>/pähkliallergia/i.test(x))&&r.marks.some(x=>/ilma sibulata/i.test(x))&&r.marks.some(x=>/gluteenivaba/i.test(x)),'marks '+JSON.stringify(r));
 assert(/⚠/.test(r.badge)&&r.alert,'badge/frame missing '+JSON.stringify(r));
 assert(r.clean,'order without allergy got marks');
 assert(/198, 40, 40|rgb\(198/.test(r.bg),'mark not red: '+r.bg);
 await p.evaluate(o=>window.PPPrint169.printManual({id:o.id,number:o.number,created:Date.now(),note:o.note,items:o.items}),o1);
 await p.waitForFunction(()=>window.__printed.length===1,null,{timeout:5000});
 const html=await p.evaluate(()=>window.__printed[0]);
 assert(/class="allergy"[^>]*>⚠[^<]*PÄHKLIALLERGIA|class="allergy"[^>]*>⚠[^<]*pähkliallergia/i.test(html)&&/ilma sibulata/i.test(html),'ticket has no allergy line');
 // a kept card (unchanged data) keeps its marks after the next poll
 await p.waitForTimeout(11000);
 assert(await p.evaluate(()=>document.querySelectorAll('#ordersPage mark.pp1717').length>=3),'marks lost after poll');
 assert(!p.errors.length,p.errors.join(' | '));await p.ctx.close();
});
await browser.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} passed`);
process.exit(failed.length?1:0);
})();
