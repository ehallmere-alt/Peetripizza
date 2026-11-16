
(() => {
  'use strict';

  if (window.PP1776QR) return;

  const page = document.getElementById('pp1775-bonus-page');
  const container = document.getElementById('pp1775-bonus-container');

  if (!page || !container) return;

  const status = () => document.getElementById('pp1769-qr-state');

  const setStatus = value => {
    if (status()) status().textContent = value;
  };

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.id = 'pp1776-qr-file';
  fileInput.hidden = true;
  fileInput.setAttribute('aria-label', 'Vali QR-koodi pilt');

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'pp1776-qr-image';
  button.textContent = '▣ Vali QR-pilt';
  button.className = 'secondary';

  const note = document.createElement('p');
  note.id = 'pp1776-qr-info';
  note.textContent =
    'QR-koodi töödeldakse ainult selles seadmes. ' +
    'Kliendiandmeid ei salvestata.';

  note.style.cssText =
    'font-size:13px;line-height:1.5;color:#627367;' +
    'margin-top:12px';

  let scanning = false;

  function mount() {
    const qr = document.getElementById('pp1769-qr-state');
    const card = qr?.closest('.ppmod');

    if (!card) return false;

    if (card.parentElement !== container) {
      container.appendChild(card);
    }

    const actions = card.querySelector('.ppmod-actions');

    if (!actions) return false;

    if (!button.isConnected) actions.appendChild(button);
    if (!fileInput.isConnected) card.appendChild(fileInput);
    if (!note.isConnected) card.appendChild(note);

    return true;
  }

  async function inspect(file) {
    if (scanning || !file) return;

    if (!('BarcodeDetector' in window)) {
      setStatus(
        '⚠ See brauser ei toeta QR-pildi lugemist. ' +
        'Kasuta toetatud brauserit või ametlikku süsteemi.'
      );
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatus('⚠ Vali pildifail.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setStatus('⚠ Pilt on liiga suur (kuni 8 MB).');
      return;
    }

    scanning = true;
    button.disabled = true;
    setStatus('QR-koodi kontrollimine...');

    let bitmap;

    try {
      const detector = new BarcodeDetector({
        formats: ['qr_code']
      });

      bitmap = await createImageBitmap(file);

      const found = await detector.detect(bitmap);

      if (found.length > 0 && found[0].rawValue) {
        // QR value stays entirely inside the browser.
        // It is never displayed, persisted or uploaded.
        setStatus(
          '✓ QR-kood loetud. ' +
          'Boonuste saldo kontrollimiseks ava ametlik süsteem.'
        );

        window.PP1769Modules?.stopScanner();
      } else {
        setStatus(
          '⚠ QR-koodi ei leitud. Proovi selgemat pilti.'
        );
      }

    } catch (_) {
      setStatus(
        '⚠ Pilti ei saanud lugeda. ' +
        'Proovi kaamerat või teist pilti.'
      );
    } finally {
      if (bitmap) bitmap.close();
      fileInput.value = '';
      scanning = false;
      button.disabled = false;
    }
  }

  button.addEventListener('click', () => {
    if (!scanning) fileInput.click();
  });

  fileInput.addEventListener('change', event => {
    const file = event.target.files?.[0];

    if (file) inspect(file);
  });

  // Move the QR card into its dedicated menu page.
  mount();

  const menu = document.getElementById('pp1775-bonus-menu');

  menu?.addEventListener('click', () => {
    // Existing navigation activates the page.
    // Reuse the same scanner rather than cloning it.
    queueMicrotask(mount);
  });

  const observer = new MutationObserver(() => {
    if (!page.classList.contains('active')) {
      window.PP1769Modules?.stopScanner();
    }
  });

  observer.observe(page, {
    attributes: true,
    attributeFilter: ['class']
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.PP1769Modules?.stopScanner();
    }
  });

  window.PP1776QR = Object.freeze({
    mount,
    customerLookupEnabled: false,
    bonusWritesEnabled: false
  });
})();
