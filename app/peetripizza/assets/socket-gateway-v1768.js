
/*
 * Peetri Pizza v17.68 — Stage 37
 * Subscription-aware Socket.IO gateway.
 *
 * Passive module. Does not connect or subscribe.
 * No polling and no official API writes.
 */
(function (root) {
  'use strict';

  const EVENTS = Object.freeze([
    'order-sent',
    'order-updated',
    'pizzeria-updated'
  ]);

  const validId = value =>
    (typeof value === 'string' ||
     typeof value === 'number') &&
    /^[1-9][0-9]{0,14}$/.test(String(value));

  function create(options = {}) {
    const branchId = options.branchId;
    const verifiedBranchId = options.verifiedBranchId;
    const socket = options.socket;
    const dispatch = options.dispatch;

    const branchValid =
      validId(branchId) &&
      validId(verifiedBranchId) &&
      String(branchId) === String(verifiedBranchId);

    let subscribed = false;
    let attached = false;
    let accepted = 0;
    let blocked = 0;

    const listeners = [];

    /*
     * Must be called by a trusted connection controller
     * ONLY after a successful upstream subscription ACK.
     *
     * An ACK without independently verified session
     * and branch context is not proof of authorization.
     */
    function confirmSubscription(ack, confirmedBranchId) {
      subscribed = false;

      if (
        !branchValid ||
        !socket ||
        socket.connected !== true ||
        ack !== true ||
        !validId(confirmedBranchId) ||
        String(confirmedBranchId) !== String(branchId)
      ) {
        return false;
      }

      subscribed = true;
      return true;
    }

    function accept(name) {
      if (
        !attached ||
        !subscribed ||
        !branchValid ||
        !socket ||
        socket.connected !== true ||
        !EVENTS.includes(name)
      ) {
        blocked++;
        return false;
      }

      accepted++;

      if (typeof dispatch === 'function') {
        dispatch(name);
      }

      return true;
    }

    function attach() {
      if (attached) return true;

      if (
        !subscribed ||
        !branchValid ||
        !socket ||
        socket.connected !== true ||
        typeof socket.on !== 'function' ||
        typeof socket.off !== 'function'
      ) {
        return false;
      }

      for (const name of EVENTS) {
        const listener = () => accept(name);
        socket.on(name, listener);
        listeners.push([name, listener]);
      }

      const disconnect = () => detach();
      socket.on('disconnect', disconnect);
      listeners.push(['disconnect', disconnect]);

      attached = true;
      return true;
    }

    function detach() {
      const previous = listeners.splice(0);

      attached = false;
      subscribed = false;

      if (socket && typeof socket.off === 'function') {
        for (const [name, listener] of previous) {
          socket.off(name, listener);
        }
      }
    }

    function diagnostics() {
      return {
        branchValid,
        subscribed,
        attached,
        accepted,
        blocked,
        connectionCreated: false,
        subscriptionSent: false,
        independentPolling: false,
        officialWrites: false
      };
    }

    return Object.freeze({
      confirmSubscription,
      attach,
      detach,
      accept,
      diagnostics
    });
  }

  const api = Object.freeze({ create });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) root.PP1768SocketGateway = api;

})(typeof window !== 'undefined' ? window : null);
