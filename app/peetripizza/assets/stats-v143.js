/* v14.3: compact day report, preserves original print and stats calculations. */
(()=>{
const toggle=document.getElementById('pp143-toggle');
const body=document.getElementById('pp143-report-body');
const print=document.getElementById('pp105-print');
if(!toggle||!body)return;
const update=open=>{body.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Peida aruanne ▴':'Näita aruannet ▾';};
update(false);
toggle.addEventListener('click',()=>update(body.hidden));
if(print)print.addEventListener('click',()=>{
  const wasHidden=body.hidden;
  if(wasHidden)update(true);
  window.addEventListener('afterprint',()=>{if(wasHidden)update(false);},{once:true});
},true);
})();
