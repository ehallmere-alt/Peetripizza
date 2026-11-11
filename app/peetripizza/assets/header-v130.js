/* v13.0: kitchen-mode quick toggle; dispatches the existing native control. */
(()=>{
 const btn=document.getElementById('pp130-focus');
 const checkbox=document.getElementById('focusMode');
 if(!btn||!checkbox)return;
 function sync(){
  const active=checkbox.checked;
  btn.setAttribute('aria-pressed',String(active));
  btn.classList.toggle('pp130-enabled',active);
  btn.setAttribute('title',active?'Lülita köögirežiim välja':'Lülita köögirežiim sisse');
 }
 btn.addEventListener('click',()=>{
  checkbox.checked=!checkbox.checked;
  checkbox.dispatchEvent(new Event('change',{bubbles:true}));
  sync();
 });
 checkbox.addEventListener('change',sync);
 const observer=new MutationObserver(sync);
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 sync();
})();
