/*
 * Peetri Pizza v17.68 — One-shot official order inspection.
 * Checks one already visible LIVE order.
 * Uses the existing GET-only upstream PHP adapter.
 * No official writes; no UI modifications.
 */
(() => {
  'use strict';

  if (window.PP1768ReadOnlyProbe) return;

  const csrf = document.querySelector(
    'meta[name="pp-wait-csrf"]'
  )?.content || '';

  let started = false;
  let result = 'not_started';

  window.PP1768ReadOnlyProbe = Object.freeze({
    diagnostics: () => ({
      started,
      result,
      officialWrites: false
    })
  });

  async function inspect() {
    if (started || !csrf) return;

    if (!document.body.classList.contains('live-active')) {
      return;
    }

    const orders = window.pp153RawLiveOrders;

    if (!Array.isArray(orders)) return;

    const order = orders.find(o =>
      o &&
      typeof o.id === 'string' &&
      /^live-[a-f0-9]{24}$/.test(o.id) &&
      (o.status === 'new' || o.status === 'active')
    );

    if (!order) {
      result = 'no_actionable_order';
      return;
    }

    started = true;
    result = 'checking';

    const action = order.status === 'new'
      ? 'confirm'
      : 'ready';

    try {
      const response = await fetch(
        'api/official-order-check-v1768.php',
        {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-Token': csrf
          },
          body: JSON.stringify({
            id: order.id,
            action
          })
        }
      );

      result = response.ok
        ? 'eligible'
        : 'http_' + response.status;

    } catch (_) {
      result = 'request_failed';
    }
  }

  window.addEventListener('pp150:live-synced', inspect);
  inspect();
})();
