(() => {
'use strict';
const $ = id => document.getElementById(id);
const labels = {
runtime:'PHP',json:'JSON',curl:'cURL',storage:'Andmesalvestus',
database:'Andmebaas',session:'Seanss',staff_credentials:'Sisselogimine',
logging:'Vealogimine',http_protection:'HTTP-kaitse',
release:'Failide terviklus',storage_size:'Andmete maht',disk:'Kettaruum'
};
let busy = false;
async function refresh() {
 if (busy) return;
 busy = true;
 $('refresh').disabled = true;
 $('problem').textContent = '';
 try {
  const r = await fetch('api/system-health.php', {
   credentials:'same-origin',cache:'no-store'
  });
  if (!r.ok) throw Error('HTTP ' + r.status);
  const data = await r.json();
  if (!data.ok || !data.read_only || !Array.isArray(data.checks))
   throw Error('Ootamatu serverivastus');

  const counts = {ok:0,warn:0,error:0,info:0};
  const list = $('checks');
  list.replaceChildren();

  for (const check of data.checks) {
   const state = ['ok','warn','error','info'].includes(check.state)
    ? check.state : 'warn';
   counts[state]++;

   const card = document.createElement('article');
   card.className = 'check';
   const dot = document.createElement('span');
   dot.className = 'dot ' + state;
   const content = document.createElement('div');
   const title = document.createElement('h3');
   title.textContent = labels[check.key] || check.key || 'Kontroll';
   const detail = document.createElement('p');
   detail.textContent = check.message || '—';
   content.append(title,detail);
   card.append(dot,content);
   list.append(card);
  }

  $('okCount').textContent = counts.ok;
  $('warnCount').textContent = counts.warn;
  $('errorCount').textContent = counts.error;
  $('overall').textContent = counts.error
   ? '● Vajab tähelepanu'
   : counts.warn ? '● Töötab · hoiatused'
   : '● Süsteem töötab';
  $('updated').textContent = 'Viimati kontrollitud: ' +
   new Date(Number(data.checked_at)*1000).toLocaleString('et-EE');
 } catch(e) {
  $('overall').textContent = '● Kontroll ebaõnnestus';
  $('problem').textContent = 'Diagnostika viga: ' + e.message;
 } finally {
  busy = false;
  $('refresh').disabled = false;
 }
}
$('refresh').addEventListener('click',refresh);
refresh();
setInterval(() => { if (!document.hidden) refresh(); },60000);
})();
