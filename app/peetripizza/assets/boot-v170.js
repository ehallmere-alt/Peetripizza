/* Peetri Pizza v17.0 — stable navigation and first-paint gate.
 * Does not poll LIVE, touch kitchen statuses, or create UI overlays.
 */
(()=>{'use strict';
const doc=document, root=doc.documentElement;
let finished=false;
function reveal(){if(finished)return;finished=true;root.classList.remove('pp170-booting');}
// Never leave a kitchen screen hidden indefinitely, even after a failed script.
const watchdog=setTimeout(reveal,3000);
function ready(){
 requestAnimationFrame(()=>requestAnimationFrame(()=>{clearTimeout(watchdog);reveal();}));
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.addEventListener('pageshow',()=>{clearTimeout(watchdog);reveal();},{once:true});
})();
