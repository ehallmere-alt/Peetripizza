/* Peetri Pizza v17.49 — check.php: reads api/heartbeat.php and shows each tablet. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const ago=s=>s<60?'just nüüd':s<3600?Math.floor(s/60)+' min tagasi':s<86400?Math.floor(s/3600)+' h tagasi':Math.floor(s/86400)+' päeva tagasi';
 const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
 async function load(){
  let j;try{const r=await fetch('api/heartbeat.php',{credentials:'same-origin',cache:'no-store'});j=await r.json();if(!r.ok||!j.ok)throw 0;}
  catch(_){$('sum').replaceChildren(el('p','pp1749-bad','Serveriga ühendus puudub või sisselogimine aegus.'));return;}
  const now=j.now,list=j.devices||[];
  const on=list.filter(d=>now-d.seen<180);
  const liveOk=on.filter(d=>d.mode==='live'&&d.live_at&&now-d.live_at<180);
  const sum=$('sum');sum.replaceChildren();
  const big=el('div','pp1749-big');big.dataset.s=on.length?(liveOk.length?'ok':'warn'):'bad';
  const liveOn=on.filter(d=>d.mode==='live');
  if(on.length&&!liveOk.length&&!liveOn.length)big.dataset.s='warn';
  big.append(el('strong',null,!on.length?'Ükski tahvel pole praegu ühenduses':liveOk.length?'Köök töötab':liveOn.length?'Tahvel on lahti, LIVE andmeid ei tule':'Tahvel on lahti, aga DEMO režiimis'));
  big.append(el('span',null,on.length+' tahvlit ühenduses · server '+(j.server_version||'?')));
  sum.append(big);
  const box=$('list');box.replaceChildren();
  if(!list.length){box.append(el('p','pp1749-empty','Ükski tahvel pole veel endast märku andnud. Ava töölaud köögi tahvlis ja oota minut.'));return;}
  for(const d of list){
   const s=now-d.seen;const alive=s<180;const live=d.mode==='live';
   const c=el('article','pp1749-dev');c.dataset.s=alive?(live&&d.live_at&&now-d.live_at<180?'ok':'warn'):'bad';
   const top=el('div','pp1749-dtop');top.append(el('i'),el('strong',null,(d.kind||'Tahvel').replace(/^muu · /,'')+(alive?'':' · pole ühenduses')),el('em',null,'#'+d.device));c.append(top);
   const rows=[['Viimati ühenduses',ago(s)],['Režiim',live?'LIVE':'DEMO'],['Viimane LIVE andmete uuendus',live?(d.live_at?ago(now-d.live_at):'veel pole'):'—'],['Versioon',(d.version||'?')+(j.server_version&&d.version&&d.version!==j.server_version?' (serveris '+j.server_version+', värskenda tahvlit)':'')],['Ekraan',({orders:'Tellimused',products:'Tooted',statistics:'Statistika',settings:'Seaded'}[d.page]||d.page||'')+(d.screen?' · '+d.screen:'')]];
   const dl=el('dl');for(const [k,v] of rows){dl.append(el('dt',null,k),el('dd',null,v));}c.append(dl);
   box.append(c);
  }
 }
 load();setInterval(load,30000);
})();
