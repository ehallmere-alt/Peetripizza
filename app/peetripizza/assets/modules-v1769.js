/*
 * PEETRI PIZZA v17.69
 * Customer QR / Official products / System Health.
 * No upstream writes. Existing kitchen UI untouched.
 */
(() => {
  'use strict';

  if (window.PP1769Modules) return;

  const page = document.getElementById('settingsPage');
  if (!page) return;

  const style = document.createElement('style');
  style.textContent = `
    #pp1769{margin:24px 0;display:grid;gap:16px}
    #pp1769 .ppmod{
      background:#fff;border:1px solid #dce5df;
      border-radius:16px;padding:18px;min-width:0
    }
    #pp1769 h3{margin:0 0 8px;font-size:19px;color:#183b2a}
    #pp1769 p{margin:6px 0 12px;color:#53665b;font-size:14px}
    #pp1769 .ppmod-actions{display:flex;gap:8px;flex-wrap:wrap}
    #pp1769 button,#pp1769 .ppmod-link{
      border:1px solid #cbdcd1;background:#f3f8f4;
      color:#194f32;border-radius:10px;padding:10px 14px;
      font:600 14px system-ui;text-decoration:none;cursor:pointer
    }
    #pp1769 .ppmod-primary{background:#227747!important;color:white!important}
    #pp1769 .ppmod-list{margin:12px 0 0;padding:0;list-style:none}
    #pp1769 .ppmod-list li{
      padding:8px 0;border-bottom:1px solid #edf1ee;
      font-size:14px;overflow-wrap:anywhere
    }
    #pp1769 .ppmod-status{font-weight:600;color:#375644}
    #pp1769 video{
      display:block;width:100%;max-width:380px;
      border-radius:12px;margin:12px 0
    }
    #pp1769 [hidden]{display:none!important}
    @media(min-width:900px){
      #pp1769{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement('section');
  root.id = 'pp1769';
  root.setAttribute('aria-label','Täiendavad köögimoodulid');

  root.innerHTML = `
    <div class="ppmod">
      <h3>📦 Tooted LIVE</h3>
      <p>Ametlikul veebilehel märgitud puuduvad tooted ja lisandid.</p>
      <div class="ppmod-status" id="pp1769-products-state">Kontrollimata</div>
      <div class="ppmod-actions">
        <button type="button" id="pp1769-products-refresh">↻ Uuenda</button>
      </div>
      <ul class="ppmod-list" id="pp1769-products"></ul>
    </div>

    <div class="ppmod">
      <h3>🛡️ System Health 2.0</h3>
      <p>Serveri, salvestuse ja LIVE-ühenduse kontroll.</p>
      <div class="ppmod-status" id="pp1769-health-state">Kontrollimata</div>
      <div class="ppmod-actions">
        <button type="button" id="pp1769-health-refresh">↻ Kontrolli</button>
      </div>
      <ul class="ppmod-list" id="pp1769-health"></ul>
    </div>

    <div class="ppmod">
      <h3>🎁 Boonused QR</h3>
      <p>Kliendi QR-koodi lugemine. Boonuste muutmine pole selles moodulis lubatud.</p>
      <div class="ppmod-status" id="pp1769-qr-state">Skanner on välja lülitatud</div>
      <div class="ppmod-actions">
        <button type="button" class="ppmod-primary" id="pp1769-qr-start">◎ Ava kaamera</button>
        <button type="button" id="pp1769-qr-stop" hidden>Peata</button>
        <a class="ppmod-link" href="https://peetripizza.ee/bonus/"
           target="_blank" rel="noopener noreferrer">Ametlikud boonused ↗</a>
      </div>
      <video id="pp1769-video" playsinline muted autoplay hidden></video>
    </div>
  `;

  page.appendChild(root);

  const $ = id => document.getElementById(id);

  const setText = (id,value) => {
    const node = $(id);
    if(node) node.textContent = String(value);
  };

  function list(id,rows) {
    const host = $(id);
    host.replaceChildren();

    for (const row of rows) {
      const li = document.createElement('li');
      li.textContent = row;
      host.appendChild(li);
    }
  }

  async function getJSON(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),12000);

    try {
      const response = await fetch(path,{
        credentials:'same-origin',
        cache:'no-store',
        headers:{Accept:'application/json'},
        signal:controller.signal
      });

      if(!response.ok) throw Error('HTTP '+response.status);

      const data = await response.json();
      if(!data || data.ok !== true) throw Error('API unavailable');

      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  let productsBusy = false;
  let healthBusy = false;

  async function products() {
    if(productsBusy) return;
    productsBusy = true;
    setText('pp1769-products-state','Laadin...');

    try {
      const data = await getJSON('api/site-status.php');

      const toppings = Array.isArray(data.missing_toppings)
        ? data.missing_toppings : [];
      const items = Array.isArray(data.missing_products)
        ? data.missing_products : [];

      const rows = [
        ...items.map(x => '📦 '+String(x.name || 'Toode')),
        ...toppings.map(x => '➕ '+String(x.name || 'Lisand'))
      ];

      list('pp1769-products',
        rows.length ? rows : ['Puuduvad tooted või lisandid pole märgitud.']
      );

      setText('pp1769-products-state',
        data.stale
          ? '⚠ Kuvatakse varem salvestatud andmeid'
          : '● Ametlikud andmed · ainult lugemine'
      );
    } catch (_) {
      setText('pp1769-products-state','⚠ Andmeid ei õnnestunud laadida');
      list('pp1769-products',[]);
    } finally {
      productsBusy = false;
    }
  }

  async function health() {
    if(healthBusy) return;
    healthBusy = true;
    setText('pp1769-health-state','Kontrollin...');

    try {
      const data = await getJSON('api/system-health.php');

      const checks = Array.isArray(data.checks)
        ? data.checks : [];

      const rows = checks.map(c => {
        const mark = c.state === 'ok' ? '✓'
          : c.state === 'error' ? '✕'
          : c.state === 'warn' ? '⚠' : '•';

        return mark + ' ' +
          String(c.key || 'system') + ' — ' +
          String(c.message || '');
      });

      const fresh = Number(window.pp155LiveFreshAt) || 0;
      const age = Date.now() - fresh;
      const isLive = document.body.classList.contains('live-active');

      rows.push(
        !isLive ? '• LIVE: pole aktiivne'
        : fresh > 0 && age < 30000
          ? '✓ LIVE: värsked andmed'
          : '⚠ LIVE: andmed võivad olla aegunud'
      );

      list('pp1769-health',rows);

      setText('pp1769-health-state',
        data.healthy ? '● Süsteem kontrollitud'
                     : '⚠ Vajab tähelepanu'
      );

    } catch (_) {
      setText('pp1769-health-state','⚠ Kontroll ebaõnnestus');
      list('pp1769-health',[]);
    } finally {
      healthBusy = false;
    }
  }

  let stream = null;
  let running = false;
  let frame = null;

  const video = $('pp1769-video');

  function stopQR() {
    running = false;

    if(frame !== null) cancelAnimationFrame(frame);
    frame = null;

    if(stream) {
      for(const track of stream.getTracks()) track.stop();
    }

    stream = null;
    video.srcObject = null;
    video.hidden = true;

    $('pp1769-qr-start').hidden = false;
    $('pp1769-qr-stop').hidden = true;
  }

  async function startQR() {
    if(running) return;

    if(!('BarcodeDetector' in window)) {
      setText('pp1769-qr-state',
        'QR-skanner pole selles brauseris toetatud. Kasuta ametlikku boonuste lehte.'
      );
      return;
    }

    if(!navigator.mediaDevices?.getUserMedia) {
      setText('pp1769-qr-state','Kaamera pole saadaval');
      return;
    }

    let detector;

    try {
      if(typeof BarcodeDetector.getSupportedFormats === 'function') {
        const formats = await BarcodeDetector.getSupportedFormats();

        if(!formats.includes('qr_code')) {
          setText('pp1769-qr-state','QR-formaat pole toetatud');
          return;
        }
      }

      detector = new BarcodeDetector({formats:['qr_code']});

      stream = await navigator.mediaDevices.getUserMedia({
        audio:false,
        video:{facingMode:{ideal:'environment'}}
      });

      video.srcObject = stream;
      video.hidden = false;
      await video.play();

      running = true;
      $('pp1769-qr-start').hidden = true;
      $('pp1769-qr-stop').hidden = false;

      setText('pp1769-qr-state','Suuna kaamera QR-koodile');

      let lastScan = 0;

      async function scan(now) {
        if(!running) return;

        if(now-lastScan >= 300) {
          lastScan = now;

          try {
            const codes = await detector.detect(video);

            if(codes.length && codes[0].rawValue) {
              // Customer QR contents are never logged,
              // stored, displayed or sent to any server.
              stopQR();

              setText('pp1769-qr-state',
                '✓ QR-kood loetud. Kliendi boonuste kontrollimiseks kasuta ametlikku süsteemi.'
              );
              return;
            }
          } catch (_) {}
        }

        if(running) frame = requestAnimationFrame(scan);
      }

      frame = requestAnimationFrame(scan);

    } catch (_) {
      stopQR();
      setText('pp1769-qr-state',
        '⚠ Kaamera käivitamine ebaõnnestus'
      );
    }
  }

  $('pp1769-products-refresh').addEventListener('click',products);
  $('pp1769-health-refresh').addEventListener('click',health);
  $('pp1769-qr-start').addEventListener('click',startQR);

  $('pp1769-qr-stop').addEventListener('click',() => {
    stopQR();
    setText('pp1769-qr-state','Skanner on välja lülitatud');
  });

  document.addEventListener('visibilitychange',() => {
    if(document.hidden) stopQR();
  });

  const observer = new MutationObserver(() => {
    if(!page.classList.contains('active')) stopQR();
  });

  observer.observe(page,{
    attributes:true,
    attributeFilter:['class']
  });

  window.PP1769Modules = Object.freeze({
    refreshProducts:products,
    refreshHealth:health,
    stopScanner:stopQR,
    officialWrites:false
  });

  // Initial read-only status; subsequent refreshes are manual.
  products();
  health();
})();
