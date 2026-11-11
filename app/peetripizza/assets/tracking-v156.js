(()=>{'use strict';
const token=document.currentScript?.dataset.token||'';
const $=id=>document.getElementById(id);
const names={new:'Vastu võetud',active:'Valmistamisel',done:'Valmis',handed:'Üle antud'};
const rank={new:0,active:1,done:2,handed:3};
let busy=false;
async function check(){if(busy||document.hidden)return;busy=true;
 try{
  if(!/^\d{1,7}\.[a-f0-9]{64}$/.test(token))throw new Error('Link ei kehti');
  const response=await fetch('api/track-status.php?t='+encodeURIComponent(token),{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});
  if(response.status===404)throw new Error('Link on aegunud või ei kehti');
  if(!response.ok)throw new Error('Ühendus pole saadaval. Proovi uuesti.');
  const json=await response.json();if(!json.ok||!Object.hasOwn(rank,json.status))throw new Error('Andmeid ei saa kuvada');
  $('track-title').textContent=names[json.status];
  const pct=25*(rank[json.status]+1);$('pp156-progress-fill').style.width=pct+'%';document.querySelector('.pp156-progress')?.setAttribute('aria-valuenow',String(rank[json.status]+1));
  const message=$('pp156-ready-message');message.hidden=!(json.fresh&&json.status==='done');message.textContent=json.fresh&&json.status==='done'?'🍕 Köögi andmetel on pitsa valmis. Võid tulla järele!':'';
  $('track-caption').textContent='Köögi andmetel: '+names[json.status];
  document.querySelectorAll('#track-steps li').forEach((el,i)=>{el.classList.toggle('reached',i<=rank[json.status]);el.setAttribute('aria-current',i===rank[json.status]?'step':'false')});
  const when=new Date(json.updated_at);$('track-updated').textContent=Number.isNaN(+when)?'Uuendamise aeg teadmata':'Andmeid uuendati '+when.toLocaleString('et-EE',{dateStyle:'short',timeStyle:'short'});
  $('track-fresh').textContent=json.fresh?'● Köögi LIVE andmed saadaval':'⚠ Andmed ei ole värsked. Palun kontrolli tellimust restoranist.';
  $('track-fresh').dataset.state=json.fresh?'ok':'stale';$('pp156-check-time').textContent='Kontrollitud '+new Date().toLocaleTimeString('et-EE',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
 }catch(e){$('pp156-ready-message').hidden=true;document.querySelector('.pp156-progress')?.setAttribute('aria-valuenow','0');$('pp156-progress-fill').style.width='0%';$('track-title').textContent='Oleku kuvamine pole võimalik';$('track-caption').textContent=e.message;$('track-fresh').textContent='Palun kontrolli tellimust restoranist.';$('track-fresh').dataset.state='stale';}
 finally{busy=false;}}
$('pp156-check-now')?.addEventListener('click',check);check();setInterval(check,10000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
})();
