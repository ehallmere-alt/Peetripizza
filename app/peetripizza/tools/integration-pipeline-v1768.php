<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 21
 * Integrated order pipeline.
 * CLI only. Synthetic data. NO official writes.
 */

if (PHP_SAPI !== 'cli') exit(1);

$root = dirname(__DIR__);

require_once $root.'/api/upstream-read-v1768.php';
require_once $root.'/api/order-map-core-v1768.php';
require_once $root.'/api/order-flow-policy-v1768.php';

function verify21(bool $condition, string $name): void {
    global $passed;
    echo ($condition ? "✅ " : "❌ ").$name.PHP_EOL;
    if (!$condition) exit(1);
    $passed++;
}

$passed = 0;

echo "=== PEETRI PIZZA v17.68 / STAGE 21 ===\n";

$orders = [
    [
        'id'=>1001,
        'secure_id'=>'TEST-SECURE-1001',
        'order_number'=>101,
        'status'=>'sent',
        'serving'=>'takeaway'
    ],
    [
        'id'=>1002,
        'secure_id'=>'TEST-SECURE-1002',
        'order_number'=>102,
        'status'=>'confirmed',
        'serving'=>'delivery'
    ],
    [
        'id'=>1003,
        'secure_id'=>'TEST-SECURE-1003',
        'order_number'=>103,
        'status'=>'confirmed',
        'serving'=>'unknown'
    ]
];

$mock = static function(string $path) use ($orders): array {
    if ($path === 'orders') {
        return ['http'=>200,'data'=>['orders'=>$orders]];
    }
    return ['http'=>404,'data'=>null];
};

$api = new PPUpstreamRead1768(
    'TEST-SESSION-123456',
    65,
    $mock
);

$data = $api->get('orders');

verify21(
    isset($data['orders']) && count($data['orders'])===3,
    'Official API adapter connected to mock'
);

$map = PPOrderMap1768::build($data['orders']);

verify21(
    count($map)===3,
    'All orders mapped to official secure IDs'
);

$localIds = array_keys($map);

verify21(
    PPOrderMap1768::inspect(
        $map,$localIds[0],'sent'
    )['ok']===true,
    'Official order mapping validated'
);

$pickup = PPFlowPolicy1768::evaluate(
    $orders[0],'confirm'
);

verify21(
    $pickup['ok']===true &&
    $pickup['proposed_next']==='confirmed',
    'Takeaway confirmation evaluated'
);

$delivery = PPFlowPolicy1768::evaluate(
    $orders[1],'ready'
);

verify21(
    $delivery['ok']===true &&
    $delivery['proposed_next']==='ready',
    'Delivery preparation evaluated'
);

$unknown = PPFlowPolicy1768::evaluate(
    $orders[2],'ready'
);

verify21(
    $unknown['ok']===false &&
    $unknown['reason']==='unknown_serving',
    'Unknown serving blocked'
);

verify21(
    PPOrderMap1768::inspect(
        $map,$localIds[0],'confirmed'
    )['reason']==='status_conflict',
    'Stale official status blocked'
);

verify21(
    $pickup['official_write_enabled']===false &&
    $delivery['official_write_enabled']===false,
    'Official API writes disabled'
);

verify21(
    $pickup['policy_verified_by_official_api']===false,
    'Unverified status transitions marked'
);

verify21(
    count(array_unique($localIds))===count($localIds),
    'No duplicate local IDs'
);

echo "\n✅ STAGE 21 COMPLETE — {$passed}/10\n";
echo "🔒 SYNTHETIC DATA ONLY\n";
echo "🔒 OFFICIAL API WRITES DISABLED\n";
echo "🍕 KITCHEN UI UNCHANGED\n";
