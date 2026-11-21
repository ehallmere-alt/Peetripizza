<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 Stage 5
 * CLI-only, synthetic tests, NO HTTP requests.
 * Official order writing is disabled.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__).'/api/customer-name.php';
require_once dirname(__DIR__).'/api/live-normalize-v150.php';

function pp1768_mapping(array $orders): array {
    $result = [];
    $secureSeen = [];

    foreach ($orders as $order) {
        if (!is_array($order)) {
            throw new RuntimeException('invalid_order');
        }

        $native = $order['id'] ?? null;
        $secure = $order['secure_id'] ?? null;

        if (!is_scalar($native) || (string)$native === '' ||
            !is_string($secure) || $secure === '') {
            throw new RuntimeException('missing_identifier');
        }

        $normalized = pp150_clean_order($order);
        $localId = $normalized['id'] ?? '';

        if (!is_string($localId) ||
            !preg_match('/^live-[a-f0-9]{24}$/D', $localId)) {
            throw new RuntimeException('invalid_local_id');
        }

        $fingerprint = hash('sha256', $secure);

        if (isset($result[$localId]) ||
            isset($secureSeen[$fingerprint])) {
            throw new RuntimeException('duplicate_mapping');
        }

        $secureSeen[$fingerprint] = true;

        $result[$localId] = [
            'secure_id' => $secure,
            'status' => strtolower(
                (string)($order['status'] ?? '')
            )
        ];
    }

    return $result;
}

function pp1768_prepare(
    array $mapping,
    string $localId,
    string $action,
    string $expectedStatus
): array {
    $transitions = [
        'sent' => ['confirm' => 'confirmed'],
        'confirmed' => ['ready' => 'ready'],
        'ready' => [
            'delivery' => 'inDelivery'
        ],
        'inDelivery' => [
            'complete' => 'completed'
        ]
    ];

    if (!isset($mapping[$localId])) {
        throw new RuntimeException('order_not_found');
    }

    $order = $mapping[$localId];

    if ($order['status'] !== $expectedStatus) {
        throw new RuntimeException('status_conflict');
    }

    $next = $transitions[$expectedStatus][$action] ?? null;

    if ($next === null) {
        throw new RuntimeException('transition_not_allowed');
    }

    return [
        'local_order_found' => true,
        'secure_id_valid' => $order['secure_id'] !== '',
        'from' => $expectedStatus,
        'to' => $next,
        'write_enabled' => false,
        'result' => 'DRY_RUN_ONLY'
    ];
}

function pp1768_test(string $name, callable $test): void {
    try {
        $test();
        echo "✅ $name\n";
    } catch (Throwable $e) {
        echo "❌ $name: ".get_class($e)."\n";
        exit(1);
    }
}

function pp1768_assert(bool $condition): void {
    if (!$condition) {
        throw new RuntimeException('assertion_failed');
    }
}

function pp1768_expect_error(callable $callback): void {
    try {
        $callback();
    } catch (RuntimeException $e) {
        return;
    }
    throw new RuntimeException('expected_error_missing');
}

echo "=== PEETRI PIZZA v17.68 / STAGE 5 ===\n";

$sample = [
    [
        'id' => 1001,
        'secure_id' => 'TEST-SECURE-1001',
        'order_number' => 1,
        'status' => 'sent'
    ],
    [
        'id' => 1002,
        'secure_id' => 'TEST-SECURE-1002',
        'order_number' => 2,
        'status' => 'confirmed'
    ]
];

$map = pp1768_mapping($sample);
$ids = array_keys($map);

pp1768_test('Local ID mapping', function() use ($map) {
    pp1768_assert(count($map) === 2);
});

pp1768_test('Secure ID mapping', function() use ($map,$ids) {
    pp1768_assert(
        $map[$ids[0]]['secure_id'] === 'TEST-SECURE-1001'
    );
});

pp1768_test('Confirm order', function() use ($map,$ids) {
    $result = pp1768_prepare(
        $map,$ids[0],'confirm','sent'
    );
    pp1768_assert($result['to'] === 'confirmed');
});

pp1768_test('Mark order ready', function() use ($map,$ids) {
    $result = pp1768_prepare(
        $map,$ids[1],'ready','confirmed'
    );
    pp1768_assert($result['to'] === 'ready');
});

pp1768_test('Block wrong status', function() use ($map,$ids) {
    pp1768_expect_error(function() use ($map,$ids) {
        pp1768_prepare($map,$ids[0],'ready','confirmed');
    });
});

pp1768_test('Block duplicate orders', function() use ($sample) {
    pp1768_expect_error(function() use ($sample) {
        pp1768_mapping([$sample[0],$sample[0]]);
    });
});

pp1768_test('Block unknown order', function() use ($map) {
    pp1768_expect_error(function() use ($map) {
        pp1768_prepare(
            $map,'live-000000000000000000000000',
            'confirm','sent'
        );
    });
});

pp1768_test('Official writing disabled', function() use ($map,$ids) {
    $result = pp1768_prepare(
        $map,$ids[0],'confirm','sent'
    );
    pp1768_assert($result['write_enabled'] === false);
});

echo "\nREAD ONLY / NO REAL ORDERS MODIFIED\n";
echo "STAGE 5 COMPLETE\n";
