<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68
 * Official order preflight.
 * Read-only. No upstream mutations.
 */
final class PP1768OfficialPreflight
{
    public static function localId(array $order): ?string
    {
        $native = $order['id']
            ?? $order['orderId']
            ?? $order['order_id']
            ?? null;

        if (!is_scalar($native)) return null;

        $native = trim((string)$native);

        if ($native === '' || strlen($native) > 100) {
            return null;
        }

        return 'live-'.substr(
            hash('sha256', 'id:'.$native),
            0,
            24
        );
    }

    public static function check(
        array $orders,
        string $localId,
        string $action
    ): array {
        if (!preg_match(
            '/^live-[a-f0-9]{24}$/D',
            $localId
        )) {
            return self::deny('invalid_local_id');
        }

        if (!in_array(
            $action,
            ['confirm', 'ready'],
            true
        )) {
            return self::deny('unsupported_action');
        }

        $matches = [];

        foreach ($orders as $order) {
            if (!is_array($order)) continue;

            if (self::localId($order) === $localId) {
                $matches[] = $order;
            }
        }

        if (count($matches) !== 1) {
            return self::deny(
                count($matches) ? 'ambiguous_order' : 'order_not_found'
            );
        }

        $order = $matches[0];

        $secure = $order['secure_id'] ?? null;

        if (!is_string($secure) || trim($secure) === '') {
            return self::deny('secure_id_missing');
        }

        $status = $order['status'] ?? null;
        $serving = $order['serving'] ?? null;

        if (!is_string($status) ||
            !is_string($serving)) {
            return self::deny('invalid_order_schema');
        }

        $serving = strtolower(trim($serving));

        if (!in_array(
            $serving,
            ['takeaway', 'delivery'],
            true
        )) {
            return self::deny('unknown_serving');
        }

        // Candidate transitions based on the official client.
        // Still require controlled integration testing.
        $transitions = [
            'confirm' => [
                'expected' => 'sent',
                'next' => 'confirmed'
            ],
            'ready' => [
                'expected' => 'confirmed',
                'next' => 'ready'
            ]
        ];

        $rule = $transitions[$action];

        if ($status !== $rule['expected']) {
            return self::deny('status_conflict');
        }

        return [
            'ok' => true,
            'action' => $action,
            'current_status' => $status,
            'proposed_status' => $rule['next'],
            'serving' => $serving,
            'official_reference_present' => true,
            'transition_verified' => false,
            'write_enabled' => false
        ];
    }

    private static function deny(string $reason): array
    {
        return [
            'ok' => false,
            'reason' => $reason,
            'write_enabled' => false
        ];
    }
}
