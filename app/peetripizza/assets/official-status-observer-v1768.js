/*
 * Peetri Pizza v17.68 — Official Status Observer.
 * Follows successful LOCAL status saves.
 * Only read-only upstream verification.
 */
(() => {
  'use strict';

  if (window.PP1768OfficialObserver) return;

  const csrf = document.querySelector(
    'meta[name="pp-wait-csrf"]'
  )?.content || '';

  const pending = new Set();

  const stats = {
    checked: 0,
    eligible: 0,
    conflicts: 0,
    failed: 0,
    officialWrites: false
  };

  window.PP1768OfficialObserver = Object.freeze({
    diagnostics: () => ({...stats})
  });

  window.addEventListener(
    'pp155:status-saved',
    async event => {
      const id = event.detail?.id;
      const status = event.detail?.status;

      if (
        !csrf ||
        typeof id !== 'string' ||
        !/^live-[a-f0-9]{24}$/.test(id) ||
        !document.body.classList.contains('live-active')
      ) return;

      const action =
        status === 'active' ? 'confirm' :
        status === 'done' ? 'ready' : null;

      if (!action) return;

      const key = id + ':' + action;

      if (pending.has(key)) return;
      pending.add(key);

      try {
        const response = await fetch(
          'api/official-status-gateway-v1768.php',
          {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrf
            },
            body: JSON.stringify({id,action})
          }
        );

        stats.checked++;

        if (response.ok) stats.eligible++;
        else if (response.status === 409) stats.conflicts++;
        else stats.failed++;

      } catch (_) {
        stats.failed++;
      } finally {
        pending.delete(key);
      }
    }
  );
})();
