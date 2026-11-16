<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 9
 * Official status preflight prototype.
 * CLI only. Synthetic orders.
 * NO HTTP REQUESTS. NO REAL WRITES.
 */

if (PHP_SAPI !== 'cli') exit(1);

function verify(bool $ok, string $label): void {
    echo ($ok ? '✅ ' : '❌ ') . $label . PHP_EOL;
    if (!$ok) exit(1);
}

function preflight(
    array $order,
    string $expectedSecureId,
    string $expectedStatus,
    string $action
): array {
    $allowed = [
        'sent' => [
            'confirm' => 'confirmed'
        ],
        'confirmed' => [
            'ready' => 'ready'
        ],
        'ready' => [
            'delivery' => 'inDelivery'
        ],
        'inDelivery' => [
            'complete' => 'completed'
        ]
    ];

    $secure = $order['secure_id'] ?? null;
    $current = $order['status'] ?? null;

    if (!is_string($secure) || $secure === '') {
        return ['ok'=>false,'reason'=>'missing_secure_id'];
    }

    if (!hash_equals($secure, $expectedSecureId)) {
        return ['ok'=>false,'reason'=>'order_mismatch'];
    }

    if (!is_string($current) || $current === '') {
        return ['ok'=>false,'reason'=>'missing_status'];
    }

    if (!hash_equals($current, $expectedStatus)) {
        return ['ok'=>false,'reason'=>'status_conflict'];
    }

    if (in_array($current, [
        'completed','cancelled','abandoned'
    ], true)) {
        return ['ok'=>false,'reason'=>'terminal_order'];
    }

    $next = $allowed[$current][$action] ?? null;

    if ($next === null) {
        return ['ok'=>false,'reason'=>'invalid_transition'];
    }

    return [
        'ok'=>true,
        'current_status'=>$current,
        'target_status'=>$next,
        'official_write_enabled'=>false,
        'mode'=>'DRY_RUN'
    ];
}

echo "=== PEETRI PIZZA v17.68 / STAGE 9 ===\n";

$order = [
    'secure_id'=>'TEST-SECURE-1001',
    'status'=>'sent'
];

$r = preflight($order,'TEST-SECURE-1001','sent','confirm');

verify(
    $r['ok'] && $r['target_status']==='confirmed',
    'New order can be confirmed'
);

verify(
    preflight(
        ['secure_id'=>'TEST-SECURE-1001','status'=>'confirmed'],
        'TEST-SECURE-1001','confirmed','ready'
    )['ok'],
    'Confirmed order can be marked ready'
);

verify(
    preflight(
        ['secure_id'=>'TEST-SECURE-1001','status'=>'ready'],
        'TEST-SECURE-1001','ready','delivery'
    )['ok'],
    'Delivery transition validated'
);

verify(
    preflight(
        ['secure_id'=>'TEST-SECURE-1001','status'=>'inDelivery'],
        'TEST-SECURE-1001','inDelivery','complete'
    )['ok'],
    'Delivery completion validated'
);

verify(
    preflight(
        $order,'WRONG-ORDER','sent','confirm'
    )['reason']==='order_mismatch',
    'Wrong secure ID blocked'
);

verify(
    preflight(
        $order,'TEST-SECURE-1001','confirmed','confirm'
    )['reason']==='status_conflict',
    'Stale order status blocked'
);

verify(
    preflight(
        ['secure_id'=>'TEST-SECURE-1001','status'=>'cancelled'],
        'TEST-SECURE-1001','cancelled','ready'
    )['reason']==='terminal_order',
    'Cancelled order protected'
);

verify(
    preflight(
        ['secure_id'=>'TEST-SECURE-1001','status'=>'completed'],
        'TEST-SECURE-1001','completed','complete'
    )['reason']==='terminal_order',
    'Completed order protected'
);

verify(
    preflight(
        ['secure_id'=>'TEST-SECURE-1001','status'=>'abandoned'],
        'TEST-SECURE-1001','abandoned','confirm'
    )['reason']==='terminal_order',
    'Abandoned order protected'
);

verify(
    preflight(
        $order,'TEST-SECURE-1001','sent','ready'
    )['reason']==='invalid_transition',
    'Invalid transition blocked'
);

verify(
    preflight(
        ['secure_id'=>'','status'=>'sent'],
        'TEST-SECURE-1001','sent','confirm'
    )['reason']==='missing_secure_id',
    'Missing secure ID rejected'
);

verify(
    $r['official_write_enabled']===false,
    'Official API writes remain disabled'
);

echo "\n✅ STAGE 9 COMPLETE — 12/12\n";
echo "🔒 DRY RUN — NO REAL ORDERS MODIFIED\n";
