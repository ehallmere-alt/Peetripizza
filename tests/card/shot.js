const {chromium}=require('playwright');
const out=process.argv[2]||'card177/after';const W=+(process.argv[3]||1280),H=+(process.argv[4]||800);
const now=Date.now();
const it=(n,q)=>[n,q];
const orders=[
 {id:'live-'+'1'.padStart(24,'0'),number:'261111-2',status:'active',customerName:'Merje',customerPhone:'+372 5123 4567',items:[it('Peetri Pizza (large) — Põhi: thin; Äär: regular; Juust: regular',1),it('Topolino (small) — Põhi: thin; Äär: regular; Juust: regular; Pakend: branded',1),it('Frutti Di Mare (small) — Põhi: thin; Äär: regular; Juust: regular',1)],amount:23.79,created:now-60000*3,minutes:20,deadline:now+1018000,deadlineSource:'official',serving:'takeAway',payment:'Kaart'},
 {id:'live-'+'2'.padStart(24,'0'),number:'261111-3',status:'new',customerName:'Karl-Erik Tammsaare',customerPhone:'5555-1234',items:[it('Pepperoni (large) — Põhi: thick; Äär: juustuäär; Juust: extra; Lisandid: Jalapeño, Sibul',2),it('Coca-Cola 0,5l',2)],amount:31.4,created:now-60000,minutes:25,deadline:now+1440000,deadlineSource:'official',serving:'delivery',payment:'Kaart',note:'Uksekell ei tööta, helistage'},
 {id:'live-'+'3'.padStart(24,'0'),number:'261111-4',status:'active',customerName:'',dineIn:true,items:[it('Margherita (family) — Põhi: thin; Juust: none',1)],amount:14,created:now-60000*22,minutes:20,deadline:now-90000,deadlineSource:'official',serving:'takeAway',payment:'Sularaha'},
];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:2});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/api/live.php*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders,updated_at:Math.floor(Date.now()/1000)})}));
await p.goto('http://127.0.0.1:8099/peetripizza/dashboard.php');await p.waitForTimeout(1500);
await p.click('#pp172-mode [data-mode="live"]');await p.waitForTimeout(3500);
await p.screenshot({path:out+'.png'});
const c=await p.$('#activeOrders .ordercard');if(c)await c.screenshot({path:out+'-card.png'});
console.log('errors',errs);await b.close()})();
