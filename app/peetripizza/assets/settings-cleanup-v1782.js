
(() => {
  'use strict';

  if (window.PP1782Cleanup) return;

  const $ = id => document.getElementById(id);

  const settings = $('settingsPage');
  const products = $('productsPage');

  if (!settings || !products) return;

  const css = document.createElement('style');

  css.textContent = `
    #pp1770-search,
    #pp1770-health-extra,
    #pp1772 {
      display: none !important;
    }


    #pp1790-health-details {
      margin-top: 16px;
      border: 1px solid #dce8df;
      border-radius: 14px;
      overflow: hidden;
    }

    #pp1790-health-details > summary {
      padding: 15px 17px;
      color: #205a39;
      background: #f3f7f4;
      font-weight: 700;
      cursor: pointer;
      list-style-position: inside;
    }

    #pp1790-health-details[open] > summary {
      border-bottom: 1px solid #dce8df;
    }

    #pp1790-health-details > #pp1769-health {
      padding: 15px;
      overflow-wrap: anywhere;
    }

    #pp1790-health-details[open] #pp1770-health-extra,
    #pp1790-health-details[open] #pp1772 {
      display: block !important;
    }

    #pp1782-health-home[hidden] {
      display: none !important;
    }

    #pp1782-health-home {
      margin: 18px 0;
    }

    #pp1782-health-home > .ppmod {
      background: #fff;
      border: 1px solid #dce5df;
      border-radius: 16px;
      padding: 18px;
      min-width: 0;
    }

    #pp1782-health-home h3 {
      color: #183b2a;
    }

    #pp1782-health-home #pp1773 {
      margin: 12px 0;
    }

    #pp1782-health-home .ppmod-list {
      list-style: none;
      padding: 0;
    }

    #pp1782-health-home .ppmod-list li {
      padding: 8px 0;
      border-bottom: 1px solid #edf1ee;
      overflow-wrap: anywhere;
    }

    #pp1769 {
      margin: 16px 0;
      display: block;
    }

    #pp1769 > .ppmod {
      margin-bottom: 16px;
    }
  `;

  document.head.appendChild(css);

  const healthHome = document.createElement('div');
  healthHome.id = 'pp1782-health-home';
  healthHome.hidden = true;
  // Keep Health inside the settings panel, not outside it.
  const panel = settings.querySelector('.panel') || settings;
  panel.appendChild(healthHome);

  let currentTab = 'kook';

  function tabName(button) {
    if (!button || !settings.contains(button)) return null;

    const value = (button.textContent || '')
      .replace(/[^\p{L}]/gu, '')
      .toLocaleLowerCase('et');

    if (value === 'köök') return 'kook';
    if (value === 'heli') return 'heli';
    if (value === 'printer') return 'printer';
    if (value === 'süsteem') return 'system';

    return null;
  }

  function selectedTab() {
    const buttons = [...settings.querySelectorAll('button')];

    for (const button of buttons) {
      const tab = tabName(button);
      if (!tab) continue;

      if (
        button.classList.contains('active') ||
        button.classList.contains('is-active') ||
        button.getAttribute('aria-selected') === 'true'
      ) {
        return tab;
      }
    }

    return null;
  }

  function updateHealthVisibility() {
    const activeSystem = [...settings.querySelectorAll('button')]
      .some(button => tabName(button) === 'system' &&
        (button.classList.contains('active') ||
         button.classList.contains('is-active') ||
         button.getAttribute('aria-selected') === 'true' ||
         button.getAttribute('aria-pressed') === 'true'));

    healthHome.hidden =
      !settings.classList.contains('active') ||
      !(currentTab === 'system' || activeSystem);
  }


  // PP1790_HEALTH_DETAILS
  function compactHealth() {
    const healthList = $('pp1769-health');
    const compact = $('pp1773');

    if (!healthList || !compact) return;

    const card = healthList.closest('.ppmod');

    if (!card || !card.closest('#pp1782-health-home')) return;

    let details = $('pp1790-health-details');

    if (!details) {
      details = document.createElement('details');
      details.id = 'pp1790-health-details';

      const summary = document.createElement('summary');
      summary.textContent = 'Täpsem diagnostika';

      details.appendChild(summary);
      card.appendChild(details);
    }

    // Move original nodes, never clone or
    // replace existing API handlers.
    if (details.contains(compact)) {
      card.insertBefore(compact, details);
    } else if (!card.contains(compact)) {
      card.insertBefore(compact, details);
    }

    if (healthList.parentElement !== details) {
      details.appendChild(healthList);
    }
  }

  function relocate() {
    const moduleRoot = $('pp1769');
    const productList = $('pp1769-products');
    const healthList = $('pp1769-health');

    // Remove the unwanted search even if an older
    // cached module has recreated it.
    $('pp1770-search')?.remove();

    // Remove duplicate diagnostics from the compact
    // view; the original detailed checks are retained.
    const oldExtra = $('pp1770-health-extra');
    if (oldExtra) oldExtra.hidden = true;

    const oldMonitor = $('pp1772');
    if (oldMonitor) oldMonitor.hidden = true;

    // Move the existing Health card, never clone it.
    const healthCard = healthList?.closest('.ppmod');

    if (healthCard &&
        healthCard.parentElement !== healthHome) {
      healthHome.appendChild(healthCard);
    }

    // Move the existing Products card to Tooted.
    // Keep its original root so its styles and
    // button event handlers continue working.
    if (moduleRoot && productList &&
        moduleRoot.parentElement !== products) {
      products.appendChild(moduleRoot);
    }

    compactHealth();
    updateHealthVisibility();
  }

  settings.addEventListener('click', event => {
    const button = event.target.closest('button');
    const tab = tabName(button);

    if (!tab) return;

    currentTab = tab;

    // Let the original tabs finish their own
    // navigation before adjusting visibility.
    setTimeout(() => {
      currentTab = selectedTab() || currentTab;
      relocate();
    }, 0);
  });

  const settingsObserver = new MutationObserver(() => {
    if (settings.classList.contains('active')) {
      currentTab = selectedTab() || currentTab;
    }
    updateHealthVisibility();
  });

  settingsObserver.observe(settings, {
    attributes: true,
    attributeFilter: ['class']
  });

  document.addEventListener('click', event => {
    if (event.target.closest('[data-page="settings"]')) {
      setTimeout(() => {
        currentTab = selectedTab() || 'kook';
        relocate();
      }, 0);
    }
  });

  // Other modules may initialize after this script.
  // Reconcile once more without adding polling.
  relocate();
  setTimeout(relocate, 500);
  setTimeout(relocate, 1500);

  window.PP1782Cleanup = Object.freeze({
    refresh: relocate,
    diagnostics: () => ({
      tab: currentTab,
      productLocation:
        $('pp1769')?.parentElement?.id || 'missing',
      healthLocation:
        $('pp1769-health')?.closest('.ppmod')
          ?.parentElement?.id || 'missing',
      searchPresent: !!$('pp1770-search'),
      officialWrites: false
    })
  });
})();
