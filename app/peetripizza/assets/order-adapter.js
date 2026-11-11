/* Peetri Pizza Service App: browser-only read-only import adapter.
 * Never store or show customer PII, secure_id, session keys, full original payloads.
 */
(function (root) {
 'use strict';
 const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
 const statuses={new:'new',pending:'new',received:'new',sent:'new',waiting:'new',confirmed:'active',accepted:'active',preparing:'active',in_progress:'active',processing:'active',ready:'done',completed:'done',picked_up:'done',cancelled:'done',canceled:'done',declined:'done'};
 function unwrap(payload){
  if(Array.isArray(payload))return payload;
  if(!payload || typeof payload!=='object')throw Error('JSON peab olema tellimuste massiiv või tellimuste objekt.');
  const parts=Object.values(payload);
  if(parts.every(v=>v&&typeof v==='object'&&!Array.isArray(v)))return parts;
  for(const key of ['orders','data','results','items'])if(Array.isArray(payload[key]))return payload[key];
  throw Error('Tellimuste nimekirja ei leitud.');
 }
 function isoDate(value){const d=typeof value==='number'?new Date(value):new Date(value||'');return Number.isFinite(d.getTime())?d.getTime():null;}
 function sanitizeItems(o){
  // A conservative allowlist. Do not infer item text from arbitrary free-form messages.
  const input=Array.isArray(o.products)?o.products:Array.isArray(o.items)?o.items:Array.isArray(o.order_items)?o.order_items:[];
  return input.slice(0,24).map((p)=>{
    if(Array.isArray(p))return [String(p[0]??'Toode').slice(0,90),Math.max(1,Math.min(99,Number(p[1])||1))];
    if(!p||typeof p!=='object')return null;
    const name=typeof p.product_name==='string'?p.product_name:typeof p.name==='string'?p.name:typeof p.title==='string'?p.title:'Toode';
    return [name.slice(0,90),Math.max(1,Math.min(99,Number(p.quantity??p.qty??1)||1))];
  }).filter(Boolean);
 }
 function normalize(payload){
  const arr=unwrap(payload);
  if(arr.length>3000)throw Error('Liiga suur fail: kuni 3000 tellimust.');
  const out=[], seen=new Set();
  for(const [i,o] of arr.entries()){
   if(!o||typeof o!=='object'||Array.isArray(o))continue;
   const rawStatus=String(o.status??'').toLowerCase().trim();
   const status=statuses[rawStatus]||'active';
   const rawNumber=o.order_number??o.number??o.id??(i+1);
   const number=String(rawNumber).slice(0,24).replace(/[^\w.-]/g,'')||String(i+1);
   const id='preview-'+i; if(seen.has(id))continue; seen.add(id);
   const created=isoDate(o.time_confirmed??o.time_sent??o.created_at??o.created??o.date);
   const expected=isoDate(o.time_expected);
   const estimated=Math.max(1,Math.min(240,Number(o.estimated_minutes)||20));
   const safeCreated=created??Date.now();
   const minutes=expected?Math.max(1,Math.min(1440,Math.round((expected-safeCreated)/60000))):estimated;
   const serving=String(o.serving??'').toLowerCase().includes('deliver')?'delivery':'takeAway';
   out.push({id,number,status,items:sanitizeItems(o),amount:Math.max(0,Number(o.total_amount??o.amount)||0),created:safeCreated,minutes,serving,payment:String(o.payment_type??'—').slice(0,24),completed:isoDate(o.time_completed??o.time_ready)||0,preview:true});
  }
  return out;
 }
 const api={normalize};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.PeetriOrderAdapter=api;
})(typeof window!=='undefined'?window:undefined);
