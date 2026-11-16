
(() => {
  'use strict';

  if (window.PP1770) return;

  const $ = id => document.getElementById(id);

  function text(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  async function read(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(path, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {Accept: 'application/json'},
        signal: controller.signal
      });

      if (!response.ok) throw Error('HTTP ' + response.status);

      const json = await response.json();

      if (json?.ok !== true)
        throw Error('API unavailable');

      return json;
    } finally {
      clearTimeout(timeout);
    }
  }

  function create(tag, attributes = {}, label = '') {
    const node = document.createElement(tag);

    for (const [key, value] of Object.entries(attributes))
      node.setAttribute(key, value);

    node.textContent = label;
    return node;
  }

  function install() {
    const products = $('pp1769-products');
    const health = $('pp1769-health');
    const qr = $('pp1769-qr-state');

    if (!products || !health || !qr) return false;

    if ($('pp1770-counts')) return true;

    // 3 — Product search and separate counts.
    const productBox = products.closest('.ppmod');

    const counts = create('p', {id:'pp1770-counts'},
      'Toodete saadavust kontrollitakse.');

    productBox.insertBefore(counts, products);

    // 6 — Live operational diagnostics.
    const healthBox = health.closest('.ppmod');

    const extra = create('div', {
      id:'pp1770-health-extra',
      'aria-live':'polite'
    });

    extra.style.cssText =
      'border-top:1px solid #e4ebe6;margin-top:14px;' +
      'padding-top:12px;font-size:14px;line-height:1.7';

    const healthTitle = create('strong', {},
      'Täiendav seire');

    const healthText = create('div', {
      id:'pp1770-health-text'
    }, 'Kontrollimata');

    extra.append(healthTitle, healthText);
    healthBox.appendChild(extra);

    const refresh = create('button', {
      type:'button',
      id:'pp1770-refresh'
    }, '↻ Uuenda kõiki andmeid');

    refresh.style.marginTop = '10px';
    extra.appendChild(refresh);

    // 4 — Explain QR limitations accurately.
    const qrBox = qr.closest('.ppmod');

    const note = create('p', {
      id:'pp1770-qr-note'
    }, 'QR-koodi lugemine ei kuva automaatselt ' +
       'kliendi boonuste saldot ega muuda boonuspunkte. ' +
       'Selleks on vaja ametliku süsteemi kinnitatud API-t.');

    qrBox.appendChild(note);

    let busy = false;

    async function update() {
      if (busy) return;
      busy = true;
      refresh.disabled = true;

      text('pp1770-health-text', 'Kontrollin ühendusi...');

      try {
        const [site, devices, system] =
          await Promise.allSettled([
            read('api/site-status.php'),
            read('api/heartbeat.php'),
            read('api/system-health.php')
          ]);

        const lines = [];

        if (site.status === 'fulfilled') {
          const s = site.value;
          const a = Array.isArray(s.missing_products)
            ? s.missing_products.length : 0;
          const b = Array.isArray(s.missing_toppings)
            ? s.missing_toppings.length : 0;

          text('pp1770-counts',
            'Puuduvad tooted: ' + a +
            ' · Lisandid: ' + b +
            (s.stale ? ' · ⚠ Aegunud andmed' : '')
          );

          lines.push(s.stale
            ? '⚠ Veebilehe andmed: aegunud vahemälu'
            : '✓ Veebilehe andmed: saadaval');
        } else {
          text('pp1770-counts',
            '⚠ Veebilehe saadavusandmeid ei saanud kontrollida');
          lines.push('⚠ Veebilehe ühendus: kontroll ebaõnnestus');
        }

        if (devices.status === 'fulfilled') {
          const d = devices.value;
          const now = Number(d.now) || 0;
          const list = Array.isArray(d.devices) ? d.devices : [];

          const online = list.filter(x =>
            Number(x.seen) > 0 &&
            now - Number(x.seen) <= 120
          ).length;

          lines.push('✓ Tahvelarvutid / seadmed: ' +
            online + ' aktiivset · ' +
            list.length + ' registreeritud');

          const liveFresh = list.filter(x =>
            x.mode === 'live' &&
            Number(x.live_at) > 0 &&
            now - Number(x.live_at) <= 45
          ).length;

          lines.push('• Värske LIVE-signaaliga seadmed: ' +
            liveFresh);
        } else {
          lines.push('⚠ Seadmete jälgimine pole saadaval');
        }

        if (system.status === 'fulfilled') {
          lines.push(system.value.healthy
            ? '✓ Serveri põhikontroll: korras'
            : '⚠ Serveri põhikontroll: vajab tähelepanu');
        } else {
          lines.push('⚠ Serveri diagnostika pole saadaval');
        }

        // These are actual checks, not assertions that
        // the official write API or printers work.
        lines.push('• Ametlikud kirjutustoimingud: välja lülitatud');

        text('pp1770-health-text', lines.join('\n'));
        healthText.style.whiteSpace = 'pre-line';

        const time = new Intl.DateTimeFormat('et-EE', {
          hour:'2-digit',minute:'2-digit',second:'2-digit',
          timeZone:'Europe/Tallinn'
        }).format(new Date());

        refresh.textContent = '↻ Uuenda · ' + time;

      } catch (_) {
        text('pp1770-health-text',
          '⚠ Diagnostika katkestati');
      } finally {
        busy = false;
        refresh.disabled = false;
      }
    }

    refresh.addEventListener('click', async () => {
      window.PP1769Modules?.refreshProducts();
      window.PP1769Modules?.refreshHealth();
      await update();
    });

    // Refresh diagnostics only while settings are in view.
    let lastRefresh = 0;

    const observer = new MutationObserver(() => {
      const page = $('settingsPage');

      if (!page?.classList.contains('active') ||
          document.hidden) return;

      if (Date.now() - lastRefresh < 60000) return;

      lastRefresh = Date.now();
      update();
    });

    observer.observe($('settingsPage'), {
      attributes:true,
      attributeFilter:['class']
    });

    update();

    window.PP1770 = Object.freeze({
      refresh:update,
      officialWrites:false,
      customerBonusWrites:false,
      productWrites:false
    });

    return true;
  }

  if (!install()) {
    document.addEventListener('DOMContentLoaded', install, {
      once:true
    });
  }
})();
