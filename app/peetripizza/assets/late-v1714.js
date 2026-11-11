/* Peetri Pizza v17.14 (+17.15, 17.16) — load the 17.14/17.15 layers after the page is shown, so first paint on a slow tablet is not delayed. */
(()=>{'use strict';const v='17.16.0';
function go(){for(const c of ['ops-v1714.css','ops-v1715.css','ops-v1716.css']){const css=document.createElement('link');css.rel='stylesheet';css.href='assets/'+c+'?v='+v;document.head.append(css);}
 // v17.15: settings-only modules (printing, order window print, health, version) also load here, after first paint.
 for(const f of ['print-v169.js','operations-v168.js','health-v169.js','ops-v1710.js','print-monitor-v1714.js','ops-v1714.js','ops-v1715.js','ops-v1716.js']){const s=document.createElement('script');s.src='assets/'+f+'?v='+v;s.async=false;document.body.append(s);}}
if(document.readyState==='complete')setTimeout(go,0);else window.addEventListener('load',()=>setTimeout(go,0),{once:true});
})();
