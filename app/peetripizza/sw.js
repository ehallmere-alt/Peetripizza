/* Peetri Pizza v17.6 — offline app shell. (v17.67: the files of the current page are stored right away and old
 * versions of the same files are removed, so the cache does not grow with every release.)
 * - Order data (api/*) is NEVER cached here; LIVE keeps its own short browser cache (15 min) as before.
 * - The dashboard page is cached only after a successful logged-in load and removed as soon as the
 *   server shows the login page again (logout / session end).
 * - Assets are served from cache and refreshed in the background (URLs carry ?v=version).
 */
'use strict';
const SHELL='pp-shell-v176',ASSETS='pp-assets-v176',KEEP=[SHELL,ASSETS];
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(!KEEP.includes(k))await caches.delete(k);
  await self.clients.claim();
})()));
const scope=new URL(self.registration.scope);
const isShell=u=>u.origin===scope.origin&&(u.pathname===scope.pathname||u.pathname===scope.pathname+'index.php'||u.pathname===scope.pathname+'dashboard.php');
const offlinePage=()=>new Response('<!doctype html><html lang="et"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Peetri Pizza · ühendus puudub</title><body style="font:600 18px system-ui;padding:40px;color:#13221a;background:#f4f8f5"><h1 style="color:#0f3b24">Internet puudub</h1><p>Köögi töölaud avaneb, kui ühendus tagasi tuleb.</p><button onclick="location.reload()" style="font:800 18px system-ui;padding:14px 22px;border:0;border-radius:12px;background:#196a3b;color:#fff">Proovi uuesti</button></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
// v17.67: store every file the page names (so the first offline reload already works) and drop older ?v= copies of them.
async function keepAssets(html){
  const wanted=new Map();
  for(const m of html.replace(/<!--[\s\S]*?-->/g,'').matchAll(/(?:href|src)="(assets\/[^"?#]+(?:\?[^"#]*)?)"/g)){
    const u=new URL(m[1].replace(/&amp;/g,'&'),scope);wanted.set(u.pathname,u.href);}
  const c=await caches.open(ASSETS);
  for(const req of await c.keys()){const u=new URL(req.url);const want=wanted.get(u.pathname);if(want&&want!==u.href)await c.delete(req);}
  for(const href of wanted.values()){if(await c.match(href))continue;try{const r=await fetch(href,{credentials:'same-origin'});if(r.ok)await c.put(href,r);}catch(_){}}
}
self.addEventListener('message',e=>{if(e.data==='pp-clear-shell')e.waitUntil(caches.delete(SHELL));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const u=new URL(req.url);if(u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname))return;
  const rel=u.pathname.slice(scope.pathname.length);
  if(rel.startsWith('api/')||rel.startsWith('tools/')||rel.startsWith('private_data')||rel==='tracking.php'||rel==='sw.js')return;
  if(req.mode==='navigate'&&isShell(u)){
    e.respondWith((async()=>{
      try{
        const res=await fetch(req);
        const copy=res.clone();
        e.waitUntil((async()=>{try{const html=await copy.text();const c=await caches.open(SHELL);
          if(res.ok&&html.includes('name="peetri-release"')){await c.put(scope.pathname,new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','X-PP-Offline-Copy':'1'}}));await keepAssets(html);}
          else if(html.includes('id="pl-form"')||html.includes('pp78-login-form'))await caches.delete(SHELL);}catch(_){}})());
        return res;
      }catch(_){
        const hit=await (await caches.open(SHELL)).match(scope.pathname);
        return hit||offlinePage();
      }
    })());
    return;
  }
  if(rel.startsWith('assets/')){
    e.respondWith((async()=>{
      const c=await caches.open(ASSETS);const hit=await c.match(req);
      const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r;}).catch(()=>null);
      if(hit){e.waitUntil(net);return hit;}
      return (await net)||new Response('',{status:504});
    })());
  }
});
