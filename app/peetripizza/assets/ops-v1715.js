/* Peetri Pizza v17.15 — the permanent update command in Seaded → Versioon. Nothing is sent anywhere. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* ---------- Versioon: one permanent update command ---------- */
const CMD="curl -fsSL https://raw.githubusercontent.com/ehallmere-alt/Peetripizza/main/patches/update-latest-ssh.txt -o /tmp/pp-update.sh && bash /tmp/pp-update.sh";
function updateBox(){
 const card=$('pp1710-version');if(!card||$('pp1715-update'))return;
 const box=document.createElement('div');box.id='pp1715-update';box.className='pp1715-update';
 box.innerHTML='<strong>Uuenda viimasele versioonile</strong><small>Sama käsk kehtib alati. Kopeeri ja kleebi SSH-i. Käsk teeb varukoopia, kontrollib faile ja taastab vea korral vana versiooni.</small><code id="pp1715-cmd"></code><button type="button" id="pp1715-copy" class="secondary">📋 Kopeeri käsk</button>';
 box.querySelector('code').textContent=CMD;card.append(box);
}
window.addEventListener('click',async e=>{
 if(!e.target.closest?.('#pp1715-copy'))return;
 const b=e.target.closest('#pp1715-copy');
 let ok=false;try{await navigator.clipboard.writeText(CMD);ok=true;}catch(_){
  try{const r=document.createRange();r.selectNodeContents($('pp1715-cmd'));const s=getSelection();s.removeAllRanges();s.addRange(r);ok=document.execCommand('copy');}catch(__){}}
 b.textContent=ok?'✓ Kopeeritud':'Vali tekst ja kopeeri käsitsi';setTimeout(()=>{b.textContent='📋 Kopeeri käsk';},2500);
});

function start(){updateBox();new MutationObserver(()=>{if(!$('pp1715-update'))updateBox();}).observe($('settingsPage')||document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
