<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') exit(1);

require_once dirname(__DIR__).'/api/order-map-core-v1768.php';

$passed = 0;

function test15(bool $ok, string $name): void
{
    global $passed;
    echo ($ok ? '✅ ' : '❌ ') . $name . PHP_EOL;
    if (!$ok) exit(1);
    $passed++;
}

function rejected15(callable $fn, string $reason): bool
{
    try {
        $fn();
    } catch (Throwable $e) {
        return $e->getMessage() === $reason;
    }
    return false;
}

echo "=== PEETRI PIZZA v17.68 / STAGE 15 ===\n";

$orders = [
    [
        'id'=>1001,
        'secure_id'=>'TEST-SECURE-A',
        'status'=>'sent',
        'order_number'=>1
    ],
    [
        'id'=>1002,
        'secure_id'=>'TEST-SECURE-B',
        'status'=>'confirmed',
        'order_number'=>2
    ]
];

$map = PPOrderMap1768::build($orders);
$ids = array_keys($map);

test15(count($map)===2, 'Two orders mapped');

test15(
    preg_match('/^live-[a-f0-9]{24}$/D',$ids[0])===1,
    'Original kitchen ID format'
);

test15(
    $map[$ids[0]]['secure_id']==='TEST-SECURE-A',
    'Official secure ID linked'
);

test15(
    PPOrderMap1768::inspect($map,$ids[0],'sent')['ok'],
    'Current official status validated'
);

test15(
    PPOrderMap1768::inspect($map,$ids[0],'confirmed')['reason']
        ==='status_conflict',
    'Stale status blocked'
);

test15(
    PPOrderMap1768::inspect(
        $map,'live-000000000000000000000000','sent'
    )['reason']==='order_not_found',
    'Unknown order blocked'
);

test15(
    rejected15(
        fn()=>PPOrderMap1768::build([$orders[0],$orders[0]]),
        'duplicate_local_id'
    ),
    'Duplicate local ID rejected'
);

$duplicateSecure = $orders[1];
$duplicateSecure['secure_id']='TEST-SECURE-A';

test15(
    rejected15(
        fn()=>PPOrderMap1768::build([$orders[0],$duplicateSecure]),
        'duplicate_secure_id'
    ),
    'Duplicate secure ID rejected'
);

$missing = $orders[0];
unset($missing['secure_id']);

test15(
    rejected15(
        fn()=>PPOrderMap1768::build([$missing]),
        'missing_identifier'
    ),
    'Missing secure ID rejected'
);

$missingNative = $orders[0];
unset($missingNative['id']);

test15(
    rejected15(
        fn()=>PPOrderMap1768::build([$missingNative]),
        'missing_identifier'
    ),
    'Missing native ID rejected'
);

test15(
    PPOrderMap1768::inspect(
        $map,$ids[0],'sent'
    )['write_enabled']===false,
    'Official writes disabled'
);

test15(
    count($map)===count($orders),
    'Every synthetic order mapped'
);

echo "\n✅ STAGE 15 COMPLETE — {$passed}/12\n";
echo "🔒 NO HTTP REQUESTS OR OFFICIAL WRITES\n";
echo "🍕 KITCHEN UI UNCHANGED\n";
