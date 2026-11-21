/*
 * Peetri Pizza v17.68 — Stage 41
 * Socket.IO connection controller.
 *
 * Not automatically activated.
 * Requires trusted authenticated configuration.
 * No official order writes or independent polling.
 */
(function(root) {
  'use strict';

  function create(options = {}) {
    const socketFactory = options.socketFactory;
    const gatewayFactory = options.gatewayFactory;
    const dispatch = options.dispatch;

    let socket = null;
    let gateway = null;
    let active = false;
    let subscribed = false;
    let connecting = false;
    let connectHandler = null;
    let disconnectHandler = null;

    const validId = v =>
      (typeof v === 'string' || typeof v === 'number') &&
      /^[1-9][0-9]{0,14}$/.test(String(v));

    function allowedUrl(value) {
      if (typeof value !== 'string') return false;

      try {
        const u = new URL(value);

        const host = u.hostname.toLowerCase();

        return (
          u.protocol === 'https:' ||
          u.protocol === 'wss:'
        ) &&
        (
          host === 'peetripizza.ee' ||
          host.endsWith('.peetripizza.ee')
        ) &&
        !u.username &&
        !u.password &&
        !u.search &&
        !u.hash &&
        (!u.port || u.port === '443');
      } catch (_) {
        return false;
      }
    }

    function stop() {
      active = false;
      subscribed = false;
      connecting = false;

      if (gateway) gateway.detach();

      if (socket) {
        if (connectHandler) {
          socket.off('connect', connectHandler);
        }
        if (disconnectHandler) {
          socket.off('disconnect', disconnectHandler);
        }
        socket.disconnect();
      }

      socket = null;
      gateway = null;
      connectHandler = null;
      disconnectHandler = null;
    }

    function start(config) {
      stop();

      if (
        !config ||
        !validId(config.branchId) ||
        !validId(config.verifiedBranchId) ||
        String(config.branchId) !==
          String(config.verifiedBranchId) ||
        !allowedUrl(config.websocketUrl) ||
        typeof config.websocketKey !== 'string' ||
        !config.websocketKey.trim() ||
        typeof socketFactory !== 'function' ||
        typeof gatewayFactory !== 'function'
      ) {
        return false;
      }

      const branchId = config.branchId;
      const verifiedBranchId = config.verifiedBranchId;

      // Key is confined to the controller's closure.
      // Never store it in localStorage or logs.
      let key = config.websocketKey;

      try {
        socket = socketFactory(config.websocketUrl, {
          autoConnect: false,
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
          timeout: 10000
        });

        if (
          !socket ||
          typeof socket.on !== 'function' ||
          typeof socket.off !== 'function' ||
          typeof socket.emit !== 'function' ||
          typeof socket.connect !== 'function' ||
          typeof socket.disconnect !== 'function'
        ) {
          stop();
          return false;
        }

        gateway = gatewayFactory({
          branchId,
          verifiedBranchId,
          socket,
          dispatch
        });

        if (
          !gateway ||
          typeof gateway.confirmSubscription !== 'function' ||
          typeof gateway.attach !== 'function' ||
          typeof gateway.detach !== 'function'
        ) {
          stop();
          return false;
        }

        active = true;

        connectHandler = () => {
          if (!active || !socket.connected) return;

          gateway.detach();
          subscribed = false;
          connecting = true;

          const currentSocket = socket;

          currentSocket.timeout(8000).emit(
            'subscribe-pizzeria',
            key,
            (error, success, message) => {
              if (
                !active ||
                socket !== currentSocket ||
                !currentSocket.connected
              ) return;

              connecting = false;

              // Socket.IO timeout ACK adds an error
              // before the official callback parameters.
              const acknowledged =
                !error && success === true;

              if (!acknowledged) {
                gateway.detach();
                subscribed = false;
                return;
              }

              subscribed = gateway.confirmSubscription(
                true,
                verifiedBranchId
              ) && gateway.attach();
            }
          );
        };

        disconnectHandler = () => {
          subscribed = false;
          connecting = false;
          gateway.detach();
        };

        socket.on('connect', connectHandler);
        socket.on('disconnect', disconnectHandler);

        socket.connect();
        return true;

      } catch (_) {
        stop();
        return false;
      }
    }

    function diagnostics() {
      return Object.freeze({
        active,
        connected: !!socket?.connected,
        subscribing: connecting,
        subscribed,
        gatewayAttached:
          gateway?.diagnostics()?.attached === true,
        independentPolling: false,
        officialWrites: false
      });
    }

    return Object.freeze({
      start,
      stop,
      diagnostics
    });
  }

  const api = Object.freeze({create});

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) root.PP1768SocketController = api;

})(typeof window !== 'undefined' ? window : null);
