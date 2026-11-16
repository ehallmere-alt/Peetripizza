(() => {
'use strict';

const $ = id => document.getElementById(id);
const date = sec => sec > 0
  ? new Date(sec * 1000).toLocaleString('et-EE')
  : 'Andmed puuduvad';

function item(tag, value) {
  const p = document.createElement('p');
  const b = document.createElement('b');
  b.textContent = tag + ': ';
  p.append(b, document.createTextNode(String(value)));
  return p;
}

async function refresh() {
  try {
    const res = await fetch('api/heartbeat.php', {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (!res.ok) throw Error('HTTP ' + res.status);

    const data = await res.json();
    if (!data.ok || !Array.isArray(data.devices)) {
      throw Error('Vigased andmed');
    }

    const now = Number(data.now) || Math.floor(Date.now()/1000);
    const devices = data.devices;
    const online = devices.filter(d => now - Number(d.seen) <= 150);
    const warnings = devices.filter(d =>
      now - Number(d.seen) > 150 ||
      (d.mode === 'live' &&
       (Number(d.live_at) <= 0 || now - Number(d.live_at) > 120))
    );

    $('total').textContent = devices.length;
    $('online').textContent = online.length;
    $('warnings').textContent = warnings.length;
    $('updated').textContent = 'Uuendatud: ' + date(now);
    $('error').textContent = '';

    const root = $('devices');
    root.replaceChildren();

    if (!devices.length) {
      root.textContent = 'Seadmeid pole veel registreeritud.';
    }

    for (const d of devices) {
      const isOnline = now - Number(d.seen) <= 150;
      const fresh = d.mode !== 'live' ||
        (Number(d.live_at) > 0 && now - Number(d.live_at) <= 120);

      const card = document.createElement('article');
      card.className = 'device';

      const title = document.createElement('h3');
      title.textContent = d.name || d.kind || 'Seade';

      const badge = document.createElement('span');
      badge.className = 'tag' + (isOnline && fresh ? '' : ' off');
      badge.textContent = !isOnline ? 'Võrguühendus puudub'
        : !fresh ? 'LIVE aegunud' : 'Ühendatud';

      card.append(
        title,
        badge,
        item('Režiim', String(d.mode || '').toUpperCase()),
        item('Versioon', d.version || '—'),
        item('Viimati nähtud', date(Number(d.seen))),
        item('LIVE uuendatud', date(Number(d.live_at))),
        item('Ekraan', d.screen || '—')
      );

      root.append(card);
    }

  } catch (e) {
    $('error').textContent = 'Seadmete laadimine ebaõnnestus: ' + e.message;
  }
}

$('refresh').addEventListener('click', refresh);
refresh();
setInterval(() => {
  if (!document.hidden) refresh();
}, 30000);
})();
