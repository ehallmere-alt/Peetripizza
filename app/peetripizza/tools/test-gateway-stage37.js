
'use strict';

const assert = require('assert');
const gateway = require('../assets/socket-gateway-v1768.js');

const handlers = new Map();
const events = [];

const socket = {
  connected: true,
  on(name, callback) {
    handlers.set(name, callback);
  },
  off(name, callback) {
    if (handlers.get(name) === callback) {
      handlers.delete(name);
    }
  },
  receive(name) {
    handlers.get(name)?.();
  }
};

const gate = gateway.create({
  branchId: 65,
  verifiedBranchId: 65,
  socket,
  dispatch: name => events.push(name)
});

let passed = 0;

function check(value, description) {
  assert(value, description);
  console.log('✅ ' + description);
  passed++;
}

check(!gate.attach(), 'No subscription: attach blocked');
check(!gate.accept('order-sent'), 'Unsubscribed event blocked');

check(
  !gate.confirmSubscription(false, 65),
  'Failed ACK rejected'
);

check(
  !gate.confirmSubscription(true, 99),
  'Other branch rejected'
);

check(
  gate.confirmSubscription(true, 65),
  'Trusted ACK state accepted'
);

check(gate.attach(), 'Gateway attached');
check(gate.attach(), 'Duplicate attach prevented');

socket.receive('order-sent');
check(events.length === 1, 'New order without payload accepted');

socket.receive('order-updated');
check(events.length === 2, 'Updated order without payload accepted');

check(
  !gate.accept('unknown-event'),
  'Unknown event rejected'
);

socket.connected = false;
socket.receive('order-sent');
check(events.length === 2, 'Disconnected socket blocked');

socket.receive('disconnect');
check(!gate.diagnostics().subscribed, 'Subscription revoked');
check(!gate.diagnostics().attached, 'Listeners detached');

socket.connected = true;
check(!gate.attach(), 'Reconnect requires new ACK');

check(
  gate.confirmSubscription(true, 65),
  'Fresh ACK accepted'
);

check(gate.attach(), 'Listeners restored');

socket.receive('order-sent');
check(events.length === 3, 'Events resume after ACK');

gate.detach();
check(handlers.size === 0, 'Listeners cleaned up');

check(
  !gate.diagnostics().officialWrites &&
  !gate.diagnostics().independentPolling &&
  !gate.diagnostics().subscriptionSent,
  'No official writes, polling or subscriptions'
);

console.log(
  '\n✅ STAGE 37 COMPLETE — ' + passed + '/19'
);
console.log('🔒 REAL SOCKET CONNECTION: DISABLED');
console.log('🍕 KITCHEN UI UNCHANGED');
