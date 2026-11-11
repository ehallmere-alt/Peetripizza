/* Peetri Pizza v17.14 — load the 17.14 layers after the page is shown, so first paint on a slow tablet is not delayed. */
(()=>{'use strict';const v='17.14.0';
function go(){const css=document.createElement('link');css.rel='stylesheet';css.href='assets/ops-v1714.css?v='+v;document.head.append(css);
 for(const f of ['print-monitor-v1714.js','ops-v1714.js']){const s=document.createElement('script');s.src='assets/'+f+'?v='+v;s.async=false;document.body.append(s);}}
if(document.readyState==='complete')setTimeout(go,0);else window.addEventListener('load',()=>setTimeout(go,0),{once:true});
})();
