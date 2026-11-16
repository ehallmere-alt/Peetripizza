<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 17
 * Order status transitions by fulfillment type.
 * Synthetic tests only. No network or writes.
 */

if (PHP_SAPI !== 'cli') exit(1);

final class PPOrderFlow1768
{
    public static function next(
        string $status,
        string $action,
        string $fulfillment
    ): array {
        if (!in_array($fulfillment, ['pickup','delivery'], true)) {
            return ['ok'=>false,'reason'=>'unknown_fulfillment'];
        }

        if (in_array($status, [
            'completed','cancelled','abandoned'
        ], true)) {
            return ['ok'=>false,'reason'=>'terminal_order'];
        }

        $common = [
            'sent' => ['confirm'=>'confirmed'],
            'confirmed' => ['ready'=>'ready']
        ];

        $pickup = [
            'ready' => ['complete'=>'completed']
        ];

        $delivery = [
            'ready' => ['delivery'=>'inDelivery'],
            'inDelivery' => ['complete'=>'completed']
        ];

        $flow = $common + (
            $fulfillment === 'pickup' ? $pickup : $delivery
        );

        $target = $flow[$status][$action] ?? null;

        if ($target === null) {
            return ['ok'=>false,'reason'=>'invalid_transition'];
        }

        return [
            'ok'=>true,
            'from'=>$status,
            'to'=>$target,
            'fulfillment'=>$fulfillment,
            'official_write_enabled'=>false
        ];
    }
}

function test17(bool $ok, string $name): void {
    static $passed = 0;

    echo ($ok ? '✅ ' : '❌ ').$name.PHP_EOL;

    if (!$ok) exit(1);

    $passed++;
}

echo "=== PEETRI PIZZA v17.68 / STAGE 17 ===\n";

$tests = [
    ['sent','confirm','pickup','confirmed'],
    ['confirmed','ready','pickup','ready'],
    ['ready','complete','pickup','completed'],
    ['sent','confirm','delivery','confirmed'],
    ['confirmed','ready','delivery','ready'],
    ['ready','delivery','delivery','inDelivery'],
    ['inDelivery','complete','delivery','completed']
];

foreach ($tests as [$from,$action,$type,$expected]) {
    $r = PPOrderFlow1768::next($from,$action,$type);

    test17(
        $r['ok'] && $r['to']===$expected,
        "$type: $from -> $expected"
    );
}

$blocked = [
    ['ready','delivery','pickup'],
    ['ready','complete','delivery'],
    ['completed','ready','pickup'],
    ['cancelled','confirm','delivery'],
    ['abandoned','confirm','pickup'],
    ['sent','ready','pickup'],
    ['sent','confirm','unknown']
];

foreach ($blocked as [$status,$action,$type]) {
    $r = PPOrderFlow1768::next($status,$action,$type);

    test17(
        $r['ok'] === false,
        "Blocked: $status / $action / $type"
    );
}

$r = PPOrderFlow1768::next('sent','confirm','pickup');

test17(
    $r['official_write_enabled'] === false,
    'Official writes disabled'
);

echo "\n✅ STAGE 17 COMPLETE — 15/15\n";
echo "🔒 SYNTHETIC TESTS ONLY\n";
echo "🔒 NO REAL ORDERS MODIFIED\n";
