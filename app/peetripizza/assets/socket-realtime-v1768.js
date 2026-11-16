/*
 * Peetri Pizza v17.68 — production Socket.IO adapter.
 * Official subscription is read-only.
 * Existing LIVE polling remains untouched.
 */
(() => {
  'use strict';

  if (window.PP1768RealSocket) return;

  let socket = null;
  let csrf = '';
  let key = '';
  let busy = false;
  let subscribed = false;
  let retryAt = 0;
  let generation = 0;

  const state = {
    phase: 'idle',
    connected: false,
    subscribed: false,
    notifications: 0,
    officialWrites: false,
    independentPolling: false
  };

  window.PP1768RealSocket = Object.freeze({
    diagnostics: () => ({...state})
  });

  const live = () =>
    document.body.classList.contains('live-active') &&
    !document.hidden &&
    navigator.onLine !== false;

  function report(phase) {
    if (state.phase === phase) return;
    state.phase = phase;

    if (!csrf) return;

    fetch('api/socket-telemetry-v1768.php', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-PP-CSRF': csrf
      },
      body: JSON.stringify({state: phase})
    }).catch(() => {});
  }

  function stop() {
    generation++;
    busy = false;
    subscribed = false;

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    state.connected = false;
    state.subscribed = false;
    report('stopped');

    key = '';
    csrf = '';
  }

  async function start() {
    if (!live() || socket || busy ||
        Date.now() < retryAt) return;

    if (typeof window.io !== 'function' ||
        !window.PP1768EventBridge) return;

    busy = true;
    const epoch = ++generation;

    // Avoid repeatedly fetching credentials on every
    // existing LIVE polling cycle.
    retryAt = Date.now() + 60000;

    try {
      const response = await fetch(
        'api/socket-config-v1768.php', {
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {Accept: 'application/json'}
        }
      );

      if (!response.ok)
        throw Error('config_unavailable');

      const config = await response.json();

      if (!config.ok ||
          !config.websocketKey ||
          !config.websocketUrl ||
          !Number.isSafeInteger(Number(config.branchId)) ||
          Number(config.branchId) <= 0)
        throw Error('config_invalid');

      if (epoch !== generation || !live()) return;

      const u = new URL(config.websocketUrl);

      if (!['https:', 'wss:'].includes(u.protocol))
        throw Error('insecure_transport');

      csrf = config.csrf;
      key = config.websocketKey;

      socket = window.io(config.websocketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 10000
        // PP1768_TRANSPORT_FIX: Socket.IO default transport order
      });

      const current = socket;
      report('connecting');

      current.on('connect', () => {
        if (socket !== current) return;

        subscribed = false;
        state.connected = true;
        state.subscribed = false;
        report('connected');

        // Socket.IO timeout adds an error argument
        // before the server's official (success, reason).
        current.timeout(8000).emit(
          'subscribe-pizzeria',
          key,
          (error, success) => {
            if (socket !== current ||
                !current.connected) return;

            if (error || success !== true) {
              subscribed = false;
              state.subscribed = false;
              report('ack_rejected');
              return;
            }

            subscribed = true;
            state.subscribed = true;
            report('subscribed');
          }
        );
      });

      current.on('disconnect', () => {
        if (socket !== current) return;
        subscribed = false;
        state.connected = false;
        state.subscribed = false;
        report('disconnected');
      });

      current.on('connect_error', (err) => {
        if (socket !== current) return;
        state.connected = false;
        state.subscribed = false;
        subscribed = false;

        const message = String(err?.message || '').toLowerCase();

        const reason =
          message.includes('xhr') ||
          message.includes('poll')
            ? 'connect_error_polling'
          : message.includes('websocket')
            ? 'connect_error_websocket'
          : message.includes('timeout')
            ? 'connect_error_timeout'
          : message.includes('forbidden') ||
            message.includes('unauthorized')
            ? 'connect_error_rejected'
          : 'connect_error_other';

        report(reason);
      });

      for (const name of ['order-sent', 'order-updated']) {
        current.on(name, () => {
          if (!subscribed || !live() ||
              socket !== current) return;

          state.notifications++;

          window.dispatchEvent(
            new CustomEvent('pp1768:socket-event', {
              detail: {name}
            })
          );
        });
      }

      current.connect();

    } catch (_) {
      report('config_failed');
    } finally {
      busy = false;
    }
  }

  window.addEventListener('pp150:live-synced', start);
  window.addEventListener('pp150:live-stopped', stop);
  window.addEventListener('online', start);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  // LIVE may already be active when this script loads.
  start();
})();
