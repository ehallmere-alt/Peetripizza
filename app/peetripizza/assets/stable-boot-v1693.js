/* v16.9.3 — Hydration gate. Do not render the legacy PHP queue before v15.7+ home layers finish. */
(()=>{'use strict';
 const reveal=()=>{document.documentElement.classList.remove('pp1693-booting');};
 let done=false;
 const finish=()=>{if(done)return;done=true;reveal();};
 // Do not block the page indefinitely if a script, network request or extension fails.
 const fallback=setTimeout(finish,3500);
 const hydrate=()=>{
   // External deferred scripts are run before DOMContentLoaded; defer two paints to let
   // queued layout work and DOM movers settle, avoiding a flash of old controls.
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
     clearTimeout(fallback);finish();
   }));
 };
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',hydrate,{once:true});
 else hydrate();
 window.addEventListener('pageshow',finish,{once:true});
})();
