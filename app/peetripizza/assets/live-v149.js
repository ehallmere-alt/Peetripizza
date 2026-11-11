/* Peetri Pizza v14.9: manual, authenticated LIVE read-only health check */
(()=>{'use strict';const $=id=>document.getElementById(id);
const test=$('pp149-test-live'),status=$('pp149-test-status'),result=$('pp149-test-result');if(!test||!status||!result)return;
const map={connected:'API töötab ja pizzeria seanss kehtib.',upstream_auth_failed:'Peetri Pizza API seanss on aegunud või puuduvad õigused. Logi uuesti sisse.',upstream_session_missing:'Peetri Pizza API seanss puudub. Logi uuesti sisse.',pizzeria_login_required:'Pizzeria ei ole sisse logitud.',authentication_required:'Töölaua sisselogimine on aegunud.',network_error:'Ühendus Peetri Pizza serveriga ebaõnnestus.',upstream_error:'Peetri Pizza API vastas veaga.',invalid_json:'API tagastas vigased JSON-andmed.',unexpected_schema:'Tellimuste andmevorming on muutunud.',too_many_orders:'Tellimuste vastus on ebatavaliselt suur.',curl_unavailable:'PHP cURL moodul puudub.',too_many_checks:'Järgmise testini tuleb veidi oodata.'};
function show(text,state='error'){status.dataset.state=state;status.textContent=text;}
test.addEventListener('click',async()=>{
 test.disabled=true;result.hidden=true;show('Ühenduse kontrollimine…','testing');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);
 try{
  const response=await fetch('api/live-health.php',{credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
  const data=await response.json();const state=data.state||'upstream_error';
  if(!response.ok||!data.ok){show(map[state]||'API ühendust ei saanud kontrollida.');if(state==='too_many_checks'&&data.retry_after)show('Proovi uuesti '+Number(data.retry_after)+' s pärast.');return;}
  show('● LIVE ühendus töötab','ok');
  const p=data.pizzeria||{};
  const row=(a,b)=>{const div=document.createElement('div');const key=document.createElement('span'),val=document.createElement('strong');key.textContent=a;val.textContent=b;div.append(key,val);return div};
  result.replaceChildren(row('Pizzeria',String(p.name||'')+' · ID '+String(p.id||'—')),row('Laaditud tellimusi',String(data.orders_count)),row('API vastusaeg',String(data.latency_ms)+' ms'),row('Juurdepääs','AINULT LUGEMISEKS'));
  result.hidden=false;
 }catch(_){show('Päring aegus või ühendus katkestati.','error')}
 finally{clearTimeout(timer);test.disabled=false;}
});
})();