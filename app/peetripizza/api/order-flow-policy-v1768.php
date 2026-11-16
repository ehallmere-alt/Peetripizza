<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 20
 * Official serving classification + proposed status flow.
 * No HTTP requests. No official writes.
 */

final class PPFlowPolicy1768
{
    public static function serving(array $order): string
    {
        $value = $order['serving'] ?? null;

        if (!is_string($value)) {
            return 'unknown';
        }

        return match (strtolower(trim($value))) {
            'takeaway' => 'pickup',
            'delivery' => 'delivery',
            default => 'unknown'
        };
    }

    public static function evaluate(
        array $order,
        string $action
    ): array {
        $type = self::serving($order);
        $status = $order['status'] ?? null;

        if ($type === 'unknown') {
            return self::blocked('unknown_serving');
        }

        if (!is_string($status)) {
            return self::blocked('invalid_status');
        }

        if (in_array($status, [
            'completed', 'cancelled', 'abandoned'
        ], true)) {
            return self::blocked('terminal_order');
        }

        $flows = [
            'pickup' => [
                'sent' => [
                    'confirm' => 'confirmed'
                ],
                'confirmed' => [
                    'ready' => 'ready'
                ],
                'ready' => [
                    'complete' => 'completed'
                ]
            ],
            'delivery' => [
                'sent' => [
                    'confirm' => 'confirmed'
                ],
                'confirmed' => [
                    'ready' => 'ready'
                ],
                'ready' => [
                    'dispatch' => 'inDelivery'
                ],
                'inDelivery' => [
                    'complete' => 'completed'
                ]
            ]
        ];

        $next = $flows[$type][$status][$action] ?? null;

        if ($next === null) {
            return self::blocked('invalid_transition');
        }

        return [
            'ok' => true,
            'serving' => $type,
            'current' => $status,
            'proposed_next' => $next,
            'policy_verified_by_official_api' => false,
            'official_write_enabled' => false,
            'mode' => 'ADVISORY_ONLY'
        ];
    }

    private static function blocked(string $reason): array
    {
        return [
            'ok' => false,
            'reason' => $reason,
            'official_write_enabled' => false
        ];
    }
}
