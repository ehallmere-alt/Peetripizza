'use strict';

/*
 * Peetri Pizza v17.68 — Stage 31
 * Integrated Socket Gateway + LIVE Bridge test.
 * Simulated browser and socket.
 * No production requests or writes.
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const gateway = require(
  '../assets/socket-gateway-v1768.js'
);

const bridgeSource = fs.readFileSync(
  require('path').join(
    __dirname,
    '../assets/live-event-bridge-v1768.js'
  ),
  'utf8'
);

let passed = 0;
let liveRefreshes = 0;

function check(condition, name) {
  console.log((condition ? '✅ ' : '❌ ') + name);
  assert(condition, name);
  passed++;
}

class FakeEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

function emitter() {
  const listeners = new Map();

  return {
    addEventListener(name, fn) {
      if (!listeners.has(name)) {
        listeners.set(name, []);
      }
      listeners.get(name).push(fn);
    },

    dispatchEvent(event) {
      if (event.type === 'pp:refresh-live') {
        liveRefreshes++;
      }

      for (const fn of listeners.get(event.type) || []) {
        fn(event);
      }
    }
  };
}

const windowMock = emitter();
const documentMock = emitter();

let live = true;
let hidden = false;

documentMock.body = {
  classList: {
    contains: name => name === 'live-active' && live
  }
};

Object.defineProperty(documentMock, 'hidden', {
  get: () => hidden
});

const context = {
  window: windowMock,
  document: documentMock,
  navigator: { onLine: true },
  Event: FakeEvent,
  setTimeout,
  clearTimeout,
  Date,
  Set,
  Object
};

vm.createContext(context);
vm.runInContext(bridgeSource, context);

const handlers = new Map();

const socket = {
  connected: true,

  on(name, fn) {
    handlers.set(name, fn);
  },

  off(name, fn) {
    if (handlers.get(name) === fn) {
      handlers.delete(name);
    }
  },

  receive(name, payload) {
    handlers.get(name)?.(payload);
  }
};

const gate = gateway.create({
  branchId: 65,
  verifiedBranchId: 65,
  socket,

  dispatch(name) {
    windowMock.dispatchEvent(
      new FakeEvent('pp1768:socket-event', {
        detail: { name }
      })
    );
  }
});

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log(
    '=== PEETRI PIZZA v17.68 / STAGE 31 ==='
  );

  check(
    gate.attach(),
    'Socket gateway connected to event pipeline'
  );

  check(
    !!windowMock.PP1768EventBridge,
    'LIVE Event Bridge loaded'
  );

  socket.receive('order-sent', {
    pizzeriaId: 65
  });

  socket.receive('order-updated', {
    pizzeriaId: 65
  });

  await sleep(350);

  check(
    liveRefreshes === 1,
    'Two events trigger one LIVE refresh'
  );

  socket.receive('order-sent', {
    pizzeriaId: 99
  });

  await sleep(350);

  check(
    liveRefreshes === 1,
    'Foreign branch cannot refresh kitchen'
  );

  live = false;

  socket.receive('order-sent', {
    pizzeriaId: 65
  });

  await sleep(350);

  check(
    liveRefreshes === 1,
    'DEMO mode blocks LIVE refresh'
  );

  live = true;
  hidden = true;

  socket.receive('order-updated', {
    pizzeriaId: 65
  });

  await sleep(350);

  check(
    liveRefreshes === 1,
    'Hidden tablet blocks refresh'
  );

  hidden = false;

  socket.receive('order-updated', {
    pizzeriaId: 65
  });

  await sleep(1600);

  check(
    liveRefreshes === 2,
    'Visible kitchen resumes refresh'
  );

  windowMock.dispatchEvent(
    new FakeEvent('pp150:live-stopped')
  );

  check(
    windowMock.PP1768EventBridge
      .diagnostics().pending === false,
    'LIVE stop clears pending updates'
  );

  gate.detach();

  check(
    handlers.size === 0,
    'Socket listeners detached'
  );

  check(
    gate.diagnostics().officialWrites === false,
    'Official API writes disabled'
  );

  check(
    windowMock.PP1768EventBridge
      .diagnostics().additionalPolling === false,
    'No second polling engine'
  );

  console.log(
    '\n✅ STAGE 31 COMPLETE — ' +
    passed + '/11'
  );

  console.log('🔒 SYNTHETIC SOCKET ONLY');
  console.log('🔒 REAL ORDERS NOT MODIFIED');
  console.log('🍕 KITCHEN UI UNCHANGED');

})().catch(error => {
  console.error(
    '❌ STAGE 31 FAILED:',
    error.message
  );
  process.exitCode = 1;
});
