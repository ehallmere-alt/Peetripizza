(() => {
'use strict';

const $ = id => document.getElementById(id);
const euro = cents => Number.isFinite(Number(cents))
  ? (Number(cents)/100).toLocaleString('et-EE',{style:'currency',currency:'EUR'})
  : '—';

let active = 'today';
let requestId = 0;

async function load() {
  const id = ++requestId;
  $('message').textContent = 'Andmeid laaditakse…';

  try {
    const periods = active === 'today'
      ? ['today','yesterday'] : [active];

    const results = await Promise.all(periods.map(async period => {
      const res = await fetch('api/kitchen-analytics.php?period=' +
        encodeURIComponent(period), {
          credentials:'same-origin',
          cache:'no-store'
        });

      if (!res.ok) throw Error('HTTP ' + res.status);
      const json = await res.json();
      if (!json.ok || !json.report) throw Error('Vigased andmed');
      return json;
    }));

    if (id !== requestId) return;

    const report = results[0].report;
    const orders = Number(report.orders) || 0;
    const amountOrders = Number(report.amount_orders) || 0;

    $('orders').textContent = orders.toLocaleString('et-EE');
    $('revenue').textContent = amountOrders > 0
      ? euro(report.amount_cents) : '—';
    $('average').textContent = report.avg_check_cents !== null &&
      report.avg_check_cents !== undefined
      ? euro(report.avg_check_cents) : '—';
    $('pizzas').textContent = (Number(report.pizzas)||0).toLocaleString('et-EE');

    $('coverage').textContent = amountOrders + ' / ' + orders +
      ' tellimuse summa salvestatud';

    if (active === 'today' && results[1]) {
      const prev = Number(results[1].report.orders) || 0;
      const diff = orders - prev;
      $('comparison').textContent =
        (diff > 0 ? '+' : '') + diff + ' võrreldes eilsega';
    } else {
      $('comparison').textContent = 'Valitud periood';
    }

    const hours = Array.isArray(report.hours) ? report.hours : [];
    const max = Math.max(0,...hours.map(x=>Number(x)||0));
    const chart = $('chart');
    chart.replaceChildren();

    for (let h = 0; h < 24; h++) {
      const n = Math.max(0,Number(hours[h])||0);
      const outer = document.createElement('div');
      outer.className = 'bar';
      outer.title = String(h).padStart(2,'0') + ':00 — ' + n +
        ' tellimust';
      outer.setAttribute('aria-label',outer.title);

      const bar = document.createElement('div');
      bar.className = 'bar-inner' +
        (max > 0 && n === max ? ' peak' : '');
      bar.style.height = (max ? 100*n/max : 0) + '%';

      outer.append(bar);
      chart.append(outer);
    }

    const peakHour = max ? hours.findIndex(x => Number(x) === max) : -1;
    $('peak').textContent = peakHour >= 0
      ? 'Tipp: ' + String(peakHour).padStart(2,'0') + ':00'
      : 'Andmed puuduvad';

    $('message').textContent =
      results[0].from + ' — ' + results[0].to +
      ' · Andmed serverist';

  } catch(e) {
    if (id === requestId) {
      $('message').textContent = '⚠ Andmete laadimine ebaõnnestus: ' +
        e.message;
    }
  }
}

document.querySelectorAll('[data-period]').forEach(button => {
  button.addEventListener('click', () => {
    active = button.dataset.period;
    document.querySelectorAll('[data-period]').forEach(b => {
      b.classList.toggle('selected',b === button);
    });
    load();
  });
});

load();
})();
