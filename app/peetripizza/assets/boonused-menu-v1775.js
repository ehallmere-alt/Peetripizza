
(() => {
  'use strict';

  if (window.PP1775Boonused) return;

  const menu = document.getElementById('pp1775-bonus-menu');
  const page = document.getElementById('pp1775-bonus-page');
  const container = document.getElementById('pp1775-bonus-container');

  if (!menu || !page || !container) return;

  const settingsMenu = document.querySelector(
    '[data-page="settings"]'
  );

  if (!settingsMenu) return;

  function moveQR() {
    const qr = document.getElementById('pp1769-qr-state');
    const panel = qr?.closest('.ppmod');

    if (!panel) return false;

    if (panel.parentElement !== container) {
      container.appendChild(panel);
    }

    return true;
  }

  function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const backdrop = document.getElementById('backdrop');
    const menuBtn = document.getElementById('menuBtn');

    drawer?.classList.remove('open');

    if (drawer) drawer.setAttribute('aria-hidden','true');
    if (backdrop) backdrop.hidden = true;
    if (menuBtn) menuBtn.setAttribute('aria-expanded','false');
  }

  function openBonus() {
    if (!moveQR()) {
      console.warn('Boonused QR module unavailable');
      return;
    }

    // Existing application navigation handles
    // normal page cleanup and menu state.
    settingsMenu.click();

    // Switch to the dedicated QR page.
    document.querySelectorAll('.page').forEach(node => {
      node.classList.toggle('active', node === page);
    });

    document.querySelectorAll('[data-page]').forEach(node => {
      node.classList.remove('active');
    });

    menu.classList.add('active');
    document.body.classList.remove('pp-orders-view');

    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');

    if (title) title.textContent = 'Boonused QR';
    if (subtitle) {
      subtitle.textContent = 'Kliendiboonuste QR-koodi lugemine.';
    }

    closeDrawer();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  menu.addEventListener('click', openBonus);

  // Other navigation buttons use the existing
  // application routing. Only clear our own state.
  document.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => {
      if (!page.classList.contains('active')) return;

      window.PP1769Modules?.stopScanner();
      page.classList.remove('active');
      menu.classList.remove('active');
    });
  });

  // Stop camera when opening another page through
  // any other application navigation.
  const observer = new MutationObserver(() => {
    if (!page.classList.contains('active')) {
      window.PP1769Modules?.stopScanner();
      menu.classList.remove('active');
    }
  });

  observer.observe(page, {
    attributes:true,
    attributeFilter:['class']
  });

  window.addEventListener('pagehide', () => {
    window.PP1769Modules?.stopScanner();
  });

  window.PP1775Boonused = Object.freeze({
    open:openBonus,
    available:moveQR,
    officialWrites:false
  });
})();
