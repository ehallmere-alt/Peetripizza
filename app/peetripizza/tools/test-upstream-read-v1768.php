<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') exit(1);

require_once dirname(__DIR__).'/api/upstream-read-v1768.php';

$passed = 0;

function check13(bool $ok, string $name): void
{
    global $passed;

    echo ($ok ? '✅ ' : '❌ ') . $name . PHP_EOL;

    if (!$ok) exit(1);

    $passed++;
}

function rejects13(callable $fn, string $expected): bool
{
    try {
        $fn();
    } catch (Throwable $e) {
        return $e->getMessage() === $expected;
    }

    return false;
}

$mock = static function (string $path): array {
    return match ($path) {
        'orders' => [
            'http'=>200,
            'data'=>['orders'=>[
                ['id'=>1001,'status'=>'sent']
            ]]
        ],
        'pizzeria' => [
            'http'=>200,
            'data'=>['id'=>65,'name'=>'TEST']
        ],
        'internal-orders/todays-orders' => [
            'http'=>200,
            'data'=>[]
        ],
        'simple-products' => [
            'http'=>200,
            'data'=>['data'=>[]]
        ],
        'toppings' => [
            'http'=>200,
            'data'=>['data'=>[]]
        ],
        'ping' => [
            'http'=>200,
            'data'=>['websocketUrl'=>'TEST']
        ],
        default => [
            'http'=>404,
            'data'=>null
        ]
    };
};

$api = new PPUpstreamRead1768(
    'TEST-SESSION-123456',
    65,
    $mock
);

echo "=== PEETRI PIZZA v17.68 / STAGE 13 ===\n";

check13(
    count(PPUpstreamRead1768::modules()) === 6,
    'Six official read endpoints'
);

check13(
    count($api->get('orders')['orders']) === 1,
    'Orders response accepted'
);

check13(
    $api->get('branch')['id'] === 65,
    'Correct branch verified'
);

check13(
    $api->get('dough') === [],
    'Dough endpoint accepted'
);

check13(
    isset($api->get('products')['data']),
    'Products endpoint accepted'
);

check13(
    isset($api->get('toppings')['data']),
    'Toppings endpoint accepted'
);

check13(
    isset($api->get('realtime')['websocketUrl']),
    'Realtime discovery accepted'
);

check13(
    rejects13(
        fn()=>$api->get('bonuses'),
        'module_not_allowed'
    ),
    'Unverified bonus API blocked'
);

check13(
    rejects13(
        fn()=>new PPUpstreamRead1768('short',65,$mock),
        'invalid_session'
    ),
    'Invalid session rejected'
);

$wrongBranch = new PPUpstreamRead1768(
    'TEST-SESSION-123456',
    99,
    $mock
);

check13(
    rejects13(
        fn()=>$wrongBranch->get('branch'),
        'branch_mismatch'
    ),
    'Cross-branch mismatch blocked'
);

$unauthorized = new PPUpstreamRead1768(
    'TEST-SESSION-123456',
    65,
    fn($path)=>['http'=>401,'data'=>null]
);

check13(
    rejects13(
        fn()=>$unauthorized->get('orders'),
        'session_expired'
    ),
    'Expired session handled'
);

$invalid = new PPUpstreamRead1768(
    'TEST-SESSION-123456',
    65,
    fn($path)=>['http'=>200,'data'=>null]
);

check13(
    rejects13(
        fn()=>$invalid->get('orders'),
        'invalid_upstream_json'
    ),
    'Invalid response rejected'
);

echo "\n✅ STAGE 13 COMPLETE — {$passed}/12\n";
echo "🔒 TESTS USED MOCK DATA ONLY\n";
echo "🔒 NO REAL API REQUESTS OR WRITES\n";
echo "🍕 KITCHEN UI UNCHANGED\n";
