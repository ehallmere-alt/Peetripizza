<?php
declare(strict_types=1);

require_once dirname(__DIR__).
    '/api/official-order-preflight-v1768.php';

echo "=== PEETRI PIZZA v17.68 / ORDER PREFLIGHT ===\n";

$passed = 0;

function check1768(bool $condition, string $name): void {
    global $passed;

    if (!$condition) {
        echo "❌ ".$name.PHP_EOL;
        exit(1);
    }

    $passed++;
    echo "✅ ".$name.PHP_EOL;
}

$orders = [
    [
        'id' => 1001,
        'secure_id' => 'TEST-SECURE-1',
        'status' => 'sent',
        'serving' => 'takeaway'
    ],
    [
        'id' => 1002,
        'secure_id' => 'TEST-SECURE-2',
        'status' => 'confirmed',
        'serving' => 'delivery'
    ],
    [
        'id' => 1003,
        'secure_id' => 'TEST-SECURE-3',
        'status' => 'cancelled',
        'serving' => 'takeaway'
    ],
    [
        'id' => 1004,
        'secure_id' => 'TEST-SECURE-4',
        'status' => 'sent',
        'serving' => 'unknown'
    ]
];

$id1 = PP1768OfficialPreflight::localId($orders[0]);
$id2 = PP1768OfficialPreflight::localId($orders[1]);
$id3 = PP1768OfficialPreflight::localId($orders[2]);
$id4 = PP1768OfficialPreflight::localId($orders[3]);

$a = PP1768OfficialPreflight::check(
    $orders, $id1, 'confirm'
);

check1768(
    $a['ok'] === true,
    'Sent order eligible for confirmation proposal'
);

check1768(
    $a['proposed_status'] === 'confirmed',
    'Confirmation target identified'
);

$b = PP1768OfficialPreflight::check(
    $orders, $id2, 'ready'
);

check1768(
    $b['ok'] === true,
    'Confirmed order eligible for ready proposal'
);

check1768(
    $b['serving'] === 'delivery',
    'Delivery classified correctly'
);

check1768(
    !PP1768OfficialPreflight::check(
        $orders, $id3, 'ready'
    )['ok'],
    'Cancelled order blocked'
);

check1768(
    !PP1768OfficialPreflight::check(
        $orders, $id4, 'confirm'
    )['ok'],
    'Unknown serving blocked'
);

check1768(
    !PP1768OfficialPreflight::check(
        $orders, $id1, 'ready'
    )['ok'],
    'Incorrect status transition blocked'
);

check1768(
    !PP1768OfficialPreflight::check(
        $orders, $id1, 'delete'
    )['ok'],
    'Unknown action blocked'
);

check1768(
    !PP1768OfficialPreflight::check(
        $orders, 'live-'.str_repeat('0',24), 'confirm'
    )['ok'],
    'Unknown order blocked'
);

check1768(
    !PP1768OfficialPreflight::check(
        [$orders[0],$orders[0]],
        $id1,
        'confirm'
    )['ok'],
    'Ambiguous mapping blocked'
);

check1768(
    $a['write_enabled'] === false &&
    $a['transition_verified'] === false,
    'Writes disabled and rules marked unverified'
);

check1768(
    !PP1768OfficialPreflight::check(
        [['id'=>1001,'status'=>'sent','serving'=>'takeaway']],
        $id1,
        'confirm'
    )['ok'],
    'Missing secure ID blocked'
);

echo "\n✅ PREFLIGHT COMPLETE — {$passed}/12\n";
echo "🔒 NO OFFICIAL WRITES\n";
echo "🍕 KITCHEN UI UNCHANGED\n";
