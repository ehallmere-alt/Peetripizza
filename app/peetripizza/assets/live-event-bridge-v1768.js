/*
 * Peetri Pizza v17.68 — Stage 27
 * Passive Socket.IO event bridge.
 * No socket connection. No extra polling.
 * No official writes.
 */
(function () {
    'use strict';

    if (window.PP1768EventBridge) return;

    const allowed = new Set([
        'order-sent',
        'order-updated'
    ]);

    let timer = null;
    let lastRefresh = 0;
    let pending = false;
    let received = 0;
    let forwarded = 0;

    const liveAvailable = () =>
        document.body.classList.contains('live-active') &&
        !document.hidden &&
        navigator.onLine !== false;

    function reset() {
        if (timer !== null) clearTimeout(timer);
        timer = null;
        pending = false;
    }

    function flush() {
        timer = null;

        if (!pending || !liveAvailable()) {
            pending = false;
            return;
        }

        pending = false;
        lastRefresh = Date.now();
        forwarded++;

        // Existing kitchen LIVE engine.
        // No independent API request.
        document.dispatchEvent(
            new Event('pp:refresh-live')
        );
    }

    function handle(event) {
        const name = event?.detail?.name;

        if (!allowed.has(name)) return;
        if (!liveAvailable()) return;

        received++;
        pending = true;

        if (timer !== null) return;

        const elapsed = Date.now() - lastRefresh;
        const delay = Math.max(200, 1500 - elapsed);

        timer = setTimeout(flush, delay);
    }

    window.addEventListener(
        'pp1768:socket-event',
        handle
    );

    window.addEventListener(
        'pp150:live-stopped',
        reset
    );

    document.addEventListener(
        'visibilitychange',
        () => {
            if (document.hidden) reset();
        }
    );

    window.PP1768EventBridge = Object.freeze({
        version: '17.68',
        mode: 'PASSIVE',
        diagnostics: () => ({
            received,
            forwarded,
            pending,
            socketConnected: false,
            additionalPolling: false,
            officialWrites: false
        })
    });
})();
