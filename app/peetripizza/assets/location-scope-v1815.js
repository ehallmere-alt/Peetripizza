/* Peetri Pizza v18.15 — Tooted (Otsas) and couriers are kept separately for every pizzeria on this device.
 * Before 18.15 these were one shared copy in the browser, so logging in to another pizzeria on the same tablet
 * showed the previous pizzeria's "Otsas" marks. Runs before app-core reads them: when the pizzeria changes,
 * the current copy is put aside under the old pizzeria and the new pizzeria's own copy is put back
 * (none yet = everything available, default couriers). Nothing is sent anywhere. */
(function(){
 'use strict';
 const meta=document.querySelector('meta[name="pp-location-id"]');
 const id=String(parseInt(meta&&meta.content,10)||0);
 if(id==='0')return;
 const KEYS=['pp-products-v1','pp-couriers-v1'];
 const OWNER='pp1815-location';
 try{
  const ls=window.localStorage;
  const owner=ls.getItem(OWNER);
  // First run after the update: what is stored belongs to the pizzeria this tablet already works for.
  if(!owner){ls.setItem(OWNER,id);return;}
  if(owner===id)return;
  for(const k of KEYS){
   const cur=ls.getItem(k);
   if(cur!==null)ls.setItem(k+'@'+owner,cur);else ls.removeItem(k+'@'+owner);
   const mine=ls.getItem(k+'@'+id);
   if(mine!==null)ls.setItem(k,mine);else ls.removeItem(k);
  }
  ls.setItem(OWNER,id);
 }catch(_){}
})();
