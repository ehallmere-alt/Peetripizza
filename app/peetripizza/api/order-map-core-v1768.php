<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 15
 * Local ID <-> official secure_id mapping.
 * No HTTP requests. No writes.
 */

require_once __DIR__.'/customer-name.php';
require_once __DIR__.'/live-normalize-v150.php';

final class PPOrderMap1768
{
    public static function build(array $orders): array
    {
        if (count($orders) > 3000) {
            throw new RuntimeException('too_many_orders');
        }

        $map = [];
        $seenSecure = [];

        foreach ($orders as $order) {
            if (!is_array($order)) {
                throw new RuntimeException('invalid_order');
            }

            $native = $order['id']
                ?? $order['orderId']
                ?? $order['order_id']
                ?? null;

            $secure = $order['secure_id']
                ?? $order['secureId']
                ?? null;

            if (!is_scalar($native) ||
                (string)$native === '' ||
                !is_string($secure) ||
                $secure === '') {
                throw new RuntimeException('missing_identifier');
            }

            $normalized = pp150_clean_order($order);
            $local = $normalized['id'] ?? '';

            if (!is_string($local) ||
                !preg_match('/^live-[a-f0-9]{24}$/D', $local)) {
                throw new RuntimeException('invalid_local_id');
            }

            $fingerprint = hash('sha256', $secure);

            if (isset($map[$local])) {
                throw new RuntimeException('duplicate_local_id');
            }

            if (isset($seenSecure[$fingerprint])) {
                throw new RuntimeException('duplicate_secure_id');
            }

            $seenSecure[$fingerprint] = true;

            $status = $order['status']
                ?? $order['state']
                ?? null;

            if (!is_string($status) || $status === '') {
                throw new RuntimeException('missing_status');
            }

            $map[$local] = [
                'secure_id' => $secure,
                'status' => $status
            ];
        }

        return $map;
    }

    public static function inspect(
        array $map,
        string $localId,
        string $expectedStatus
    ): array {
        if (!isset($map[$localId])) {
            return [
                'ok'=>false,
                'reason'=>'order_not_found'
            ];
        }

        $order = $map[$localId];

        if (!hash_equals($order['status'], $expectedStatus)) {
            return [
                'ok'=>false,
                'reason'=>'status_conflict'
            ];
        }

        return [
            'ok'=>true,
            'mapping_verified'=>true,
            'official_status'=>$order['status'],
            'write_enabled'=>false,
            'mode'=>'READ_ONLY'
        ];
    }
}
