/* v14.2 — A small, honest LIVE connection indicator.
 * It turns green ONLY after a successful, recent response from the read-only LIVE orders API.
 * Amber = connection in progress; red = failed/stale; grey = demo/preview/off.
 */
(()=>{'use strict';
 const indicator=document.getElementById('pp142-online');
 const liveStatus=document.querySelector('.live-monitor');
 if(!indicator)return;
 // Retire both earlier focus variants so a persisted hidden mode cannot trap the kitchen UI.
 try{if(typeof setFocusMode==='function')setFocusMode(false);if(typeof setKitchenFocus==='function')setKitchenFocus(false);}catch(_){document.body.classList.remove('focus-kitchen','kitchen-focus');}
 // Remove the redundant Tools menu without removing its useful filters or Demo return path.
 const filterGroup=document.querySelector('#pp111-tools-panel .filtergroup');
 const searchPanel=document.getElementById('kitchenTools');
 if(filterGroup&&searchPanel)searchPanel.prepend(filterGroup);
 const demoButton=document.getElementById('demoAdd');
 const heroActions=document.querySelector('.hero-actions');
 if(demoButton&&heroActions)heroActions.append(demoButton);
 const returnDemo=document.getElementById('returnDemo');
 const displayControls=document.querySelector('.dashboard-display-controls');
 if(returnDemo&&displayControls)displayControls.append(returnDemo);
 const text={online:'LIVE ühendatud',connecting:'LIVE ühendamine…',offline:'LIVE ühendus katkes või andmed aegusid',demo:'Demo / ei ole LIVE-ühendust'};
 let last='';
 function paint(){
   const info=document.querySelector('.live-monitor');
   const live=document.body.classList.contains('live-active');
   const failure=document.body.classList.contains('live-connection-error');
   const state=info?.dataset.state||'';
   const success=Number(info?.dataset.lastSuccess||0);
   const recent=success>0&&Date.now()-success<35000;
   const kind=!live?'demo':failure||state==='error'||(success>0&&!recent)?'offline':state==='ok'&&recent?'online':'connecting';
   if(kind===last)return;
   last=kind;
   indicator.dataset.state=kind;
   indicator.title=text[kind];
   indicator.setAttribute('aria-label',text[kind]);
   indicator.setAttribute('aria-live',kind==='offline'?'polite':'off');
 }
 const observer=new MutationObserver(paint);
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 if(liveStatus)observer.observe(liveStatus,{attributes:true,childList:true,characterData:true,subtree:true,attributeFilter:['data-state','data-last-success']});
 // Live-monitor may have been moved into the topbar by the existing kitchen script.
 setInterval(paint,5000);
 document.addEventListener('visibilitychange',paint);
 paint();
})();
