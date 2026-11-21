<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') exit(1);

require_once dirname(__DIR__).'/api/order-flow-policy-v1768.php';

$passed = 0;

function test20(bool $condition, string $name): void
{
    global $passed;

    echo ($condition ? '✅ ' : '❌ ') . $name . PHP_EOL;

    if (!$condition) exit(1);

    $passed++;
}

echo "=== PEETRI PIZZA v17.68 / STAGE 20 ===\n";

test20(
    PPFlowPolicy1768::serving([
        'serving' => 'takeaway'
    ]) === 'pickup',
    'Official takeaway recognized'
);

test20(
    PPFlowPolicy1768::serving([
        'serving' => 'delivery'
    ]) === 'delivery',
    'Official delivery recognized'
);

test20(
    PPFlowPolicy1768::serving([
        'serving' => 'unknown-value'
    ]) === 'unknown',
    'Unknown type rejected'
);

test20(
    PPFlowPolicy1768::serving([]) === 'unknown',
    'Missing serving rejected'
);

test20(
    PPFlowPolicy1768::evaluate([
        'serving'=>'takeaway',
        'status'=>'sent'
    ], 'confirm')['proposed_next'] === 'confirmed',
    'Pickup confirmation proposal'
);

test20(
    PPFlowPolicy1768::evaluate([
        'serving'=>'takeaway',
        'status'=>'confirmed'
    ], 'ready')['proposed_next'] === 'ready',
    'Pickup ready proposal'
);

test20(
    PPFlowPolicy1768::evaluate([
        'serving'=>'delivery',
        'status'=>'ready'
    ], 'dispatch')['proposed_next'] === 'inDelivery',
    'Delivery dispatch proposal'
);

test20(
    PPFlowPolicy1768::evaluate([
        'serving'=>'delivery',
        'status'=>'inDelivery'
    ], 'complete')['proposed_next'] === 'completed',
    'Delivery completion proposal'
);

test20(
    !PPFlowPolicy1768::evaluate([
        'serving'=>'takeaway',
        'status'=>'ready'
    ], 'dispatch')['ok'],
    'Pickup cannot use delivery dispatch'
);

test20(
    !PPFlowPolicy1768::evaluate([
        'serving'=>'delivery',
        'status'=>'ready'
    ], 'complete')['ok'],
    'Delivery cannot skip dispatch'
);

test20(
    !PPFlowPolicy1768::evaluate([
        'serving'=>'unknown',
        'status'=>'confirmed'
    ], 'ready')['ok'],
    'Unknown serving blocks action'
);

test20(
    !PPFlowPolicy1768::evaluate([
        'serving'=>'takeaway',
        'status'=>'cancelled'
    ], 'ready')['ok'],
    'Cancelled order protected'
);

test20(
    !PPFlowPolicy1768::evaluate([
        'serving'=>'delivery',
        'status'=>'completed'
    ], 'complete')['ok'],
    'Completed order protected'
);

$result = PPFlowPolicy1768::evaluate([
    'serving'=>'takeaway',
    'status'=>'sent'
], 'confirm');

test20(
    $result['official_write_enabled'] === false,
    'Official writes remain disabled'
);

test20(
    $result['policy_verified_by_official_api'] === false,
    'Unverified rules clearly marked'
);

echo "\n✅ STAGE 20 COMPLETE — {$passed}/15\n";
echo "🔒 NO NETWORK REQUESTS\n";
echo "🔒 NO REAL ORDERS MODIFIED\n";
echo "🍕 KITCHEN UI UNCHANGED\n";
