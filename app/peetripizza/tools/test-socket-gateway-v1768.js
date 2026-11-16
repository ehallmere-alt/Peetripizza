'use strict';

const gateway = require(
  '../assets/socket-gateway-v1768.js'
);

let passed = 0;

function check(ok, name) {
  console.log((ok ? '✅ ' : '❌ ') + name);
  if (!ok) process.exit(1);
  passed++;
}

function mockSocket() {
  const handlers = new Map();

  return {
    connected: true,

    on(name, fn) {
      handlers.set(name, fn);
    },

    off(name, fn) {
      if (handlers.get(name) === fn) {
        handlers.delete(name);
      }
    },

    emitLocal(name, data) {
      const fn = handlers.get(name);
      if (fn) fn(data);
    },

    listeners() {
      return handlers.size;
    }
  };
}

console.log(
  '=== PEETRI PIZZA v17.68 / STAGE 30 ==='
);

const socket = mockSocket();
const forwarded = [];

const gate = gateway.create({
  branchId: 65,
  verifiedBranchId: 65,
  socket,
  dispatch: name => forwarded.push(name)
});

check(
  gate.diagnostics().authorized,
  'Branch identity verified'
);

check(
  gate.attach(),
  'Socket gateway attached'
);

check(
  socket.listeners() === 3,
  'Official event listeners registered'
);

socket.emitLocal('order-sent', {
  pizzeriaId: 65
});

check(
  forwarded.length === 1,
  'Correct branch event accepted'
);

socket.emitLocal('order-updated', {
  pizzeriaId: 99
});

check(
  forwarded.length === 1,
  'Foreign branch blocked'
);

socket.emitLocal('order-sent', {});

check(
  forwarded.length === 1,
  'Event without branch blocked'
);

socket.emitLocal('order-updated', {
  pizzeriaId: '65'
});

check(
  forwarded.length === 2,
  'Matching string branch accepted'
);

check(
  gate.accept('unknown-event', {
    pizzeriaId: 65
  }) === false,
  'Unknown event blocked'
);

check(
  gate.diagnostics().blocked === 3,
  'Blocked events counted'
);

check(
  gate.diagnostics().accepted === 2,
  'Accepted events counted'
);

check(
  gate.attach() && socket.listeners() === 3,
  'Duplicate listeners prevented'
);

gate.detach();

check(
  socket.listeners() === 0,
  'Listeners removed on detach'
);

check(
  gate.accept('order-sent', {
    pizzeriaId: 65
  }) === false,
  'Detached gateway blocks events'
);

const foreign = gateway.create({
  branchId: 65,
  verifiedBranchId: 99,
  socket,
  dispatch: () => {}
});

check(
  foreign.attach() === false,
  'Mismatched session branch rejected'
);

check(
  !gate.diagnostics().officialWrites &&
  !gate.diagnostics().independentPolling &&
  !gate.diagnostics().subscriptionPerformed,
  'No writes, polling or subscriptions'
);

console.log(
  '\n✅ STAGE 30 COMPLETE — ' + passed + '/15'
);
console.log('🔒 OFFICIAL WRITES: DISABLED');
console.log('🔒 SOCKET CONNECTION: NOT CREATED');
console.log('🍕 KITCHEN UI: UNCHANGED');
