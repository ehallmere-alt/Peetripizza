'use strict';
/* Real Chromium interaction checks against a static generated dashboard fixture.
   All /api endpoints are mocked and external network blocked; no production writes. */
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const FIXTURE_URL='http://127.0.0.1:8765/browser-fixture-v1802.html';
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=route.request().url();
   const u=new URL(url);
   if(u.hostname!=='127.0.0.1')return route.abort();
   if(u.pathname.includes('/api/')){
     return route.fulfill({status:503,contentType:'application/json',
       body:JSON.stringify({ok:false,error:'isolated-test-no-upstream'})});
   }
   return route.continue();
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(FIXTURE_URL,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2500);
  const menu=page.locator('#menuBtn');
  const drawer=page.locator('#drawer');
  assert.equal(await menu.count(),1,'Menu button missing');
  assert.equal(await drawer.count(),1,'Drawer missing');
  // Initial layout can be temporarily locked by tablet mode. Force only local
  // harmless app storage state; do not alter actual DOM controls.
  const locked=await page.evaluate(()=>localStorage.getItem('pp148-tablet-lock'));
  if(locked==='true'){
    await page.evaluate(()=>localStorage.setItem('pp148-tablet-lock','false'));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(1500);
  }
  await menu.click({timeout:10000});
  assert.equal(await drawer.getAttribute('aria-hidden'),'false','Menu did not open');
  await page.locator('#closeDrawer').click({timeout:10000});
  assert.equal(await drawer.getAttribute('aria-hidden'),'true','Menu did not close');
  console.log('PASS browser: menu opens and closes');

  // v17.2+ presents the actual LIVE control in the DEMO/LIVE header switch.
  // The original read-only button remains present but is intentionally hidden.
  const live=page.locator('#pp172-mode button[data-mode="live"]');
  assert.equal(await live.count(),1,'LIVE mode control missing in kitchen header');
  assert.equal(await live.isVisible(),true,'LIVE mode control is hidden');
  assert.equal(await page.locator('button[aria-label="Laadi päris tellimused ainult lugemiseks"]').count(),1,'Original read-only LIVE handler removed');
  console.log('PASS browser: LIVE mode visible with underlying read-only handler');

  await menu.click({timeout:10000});
  await page.locator('[data-page="products"]').first().click({timeout:10000});
  assert.equal(await page.locator('#productsPage').isVisible(),true,'Tooted page hidden');
  assert.ok(await page.locator('#productList .pp140-card').count()>=60,
    'Official product and ingredients catalog not rendered');
  console.log('PASS browser: real Tooted products visible');

  await menu.click({timeout:10000});
  await page.locator('[data-page="settings"]').first().click({timeout:10000});
  // The native radio is visually hidden by existing styles; trigger its
  // real change listener instead of requiring a pointer-clickable input.
  await page.locator('#pp1799-themes input[value="2"]').evaluate(el=>{
    el.checked=true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('pp-design-two')),true,
    'Premium Clean theme did not activate');
  await page.locator('#pp1799-themes input[value="1"]').evaluate(el=>{
    el.checked=true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('pp-design-two')),false,
    'Classic theme did not restore');
  console.log('PASS browser: theme 2 and classic switch');

  if(errors.length)console.log('Browser console exceptions (non-fatal API mocks):',errors.slice(0,6));
  console.log('ALL browser tests PASSED — read-only, isolated, no upstream access');
 }catch(e){console.error('BROWSER TEST FAILED:',e.stack||String(e));process.exitCode=1}
 finally{if(browser)await browser.close()}
})();
