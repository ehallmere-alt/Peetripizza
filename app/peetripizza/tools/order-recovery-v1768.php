<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 7
 * Safe recovery state machine.
 * CLI tests only. No real API calls.
 */

if (PHP_SAPI !== 'cli') exit(1);

function verify(bool $ok, string $name): void {
    echo ($ok ? '✅ ' : '❌ ') . $name . PHP_EOL;
    if (!$ok) exit(1);
}

function begin(array &$ops, string $key, string $order, string $action): string {
    if (!preg_match('/^[a-z0-9_-]{8,100}$/iD', $key)) {
        return 'invalid_key';
    }

    $fingerprint = hash('sha256', $order.'|'.$action);

    if (isset($ops[$key])) {
        if ($ops[$key]['fingerprint'] !== $fingerprint) {
            return 'key_conflict';
        }
        return match ($ops[$key]['state']) {
            'confirmed' => 'already_confirmed',
            'unknown' => 'reconciliation_required',
            default => 'already_pending'
        };
    }

    foreach ($ops as $existing) {
        if ($existing['fingerprint'] === $fingerprint) {
            return 'duplicate_blocked';
        }
    }

    $ops[$key] = [
        'fingerprint' => $fingerprint,
        'state' => 'pending',
        'created_at' => time()
    ];

    return 'accepted_dry_run';
}

function timeout(array &$ops, string $key): string {
    if (!isset($ops[$key])) return 'not_found';

    if ($ops[$key]['state'] !== 'pending') {
        return 'invalid_transition';
    }

    $ops[$key]['state'] = 'unknown';
    return 'reconciliation_required';
}

function confirm(array &$ops, string $key, bool $verified): string {
    if (!isset($ops[$key])) return 'not_found';

    if (!$verified) return 'verification_required';

    if (!in_array($ops[$key]['state'], ['pending','unknown'], true)) {
        return 'invalid_transition';
    }

    $ops[$key]['state'] = 'confirmed';
    return 'confirmed';
}

function reconcile(array &$ops, string $key, bool $unchanged): string {
    if (!isset($ops[$key])) return 'not_found';

    if ($ops[$key]['state'] !== 'unknown') {
        return 'invalid_transition';
    }

    if (!$unchanged) {
        return 'manual_review_required';
    }

    // Even when unchanged, never automatically resend an uncertain write.
    return 'manual_review_required';
}

echo "=== PEETRI PIZZA v17.68 / STAGE 7 ===\n";

$ops = [];

verify(
    begin($ops,'order-key-0001','TEST-ORDER-1','ready') === 'accepted_dry_run',
    'New operation accepted'
);

verify(
    begin($ops,'order-key-0001','TEST-ORDER-1','ready') === 'already_pending',
    'Duplicate pending request blocked'
);

verify(
    timeout($ops,'order-key-0001') === 'reconciliation_required',
    'Timeout enters unknown state'
);

verify(
    begin($ops,'order-key-0001','TEST-ORDER-1','ready') === 'reconciliation_required',
    'Unknown operation cannot be repeated'
);

verify(
    begin($ops,'order-key-0002','TEST-ORDER-1','ready') === 'duplicate_blocked',
    'New key cannot bypass protection'
);

verify(
    confirm($ops,'order-key-0001',false) === 'verification_required',
    'Unverified confirmation blocked'
);

verify(
    reconcile($ops,'order-key-0001',true) === 'manual_review_required',
    'Automatic retry after timeout disabled'
);

verify(
    confirm($ops,'order-key-0001',true) === 'confirmed',
    'Verified official result accepted'
);

verify(
    begin($ops,'order-key-0001','TEST-ORDER-1','ready') === 'already_confirmed',
    'Confirmed operation stays protected'
);

verify(
    begin($ops,'order-key-0001','TEST-ORDER-2','ready') === 'key_conflict',
    'Idempotency key conflict blocked'
);

verify(
    count($ops) === 1,
    'No duplicate operations created'
);

echo "\n✅ STAGE 7 COMPLETE — 11/11\n";
echo "🔒 DRY RUN — OFFICIAL API NOT MODIFIED\n";
