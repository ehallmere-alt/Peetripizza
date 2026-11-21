<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 22
 * WebSocket URL validation and polling fallback policy.
 * No network requests or official writes.
 */

final class PPRealtimePolicy1768
{
    public static function inspect(?string $url): array
    {
        $result = [
            'websocket_configured' => false,
            'secure_transport' => false,
            'approved_host' => false,
            'websocket_connection_tested' => false,
            'websocket_enabled' => false,
            'polling_fallback_enabled' => true,
            'polling_interval_seconds' => 15
        ];

        if ($url === null || trim($url) === '') {
            return $result;
        }

        $url = trim($url);

        if (strlen($url) > 2048 ||
            preg_match('/[\x00-\x20\x7f]/', $url)) {
            return $result;
        }

        $parts = parse_url($url);

        if (!is_array($parts)) {
            return $result;
        }

        $scheme = strtolower($parts['scheme'] ?? '');
        $host = strtolower(rtrim($parts['host'] ?? '', '.'));

        $secure = in_array($scheme, ['https', 'wss'], true);

        $approved =
            $host === 'peetripizza.ee' ||
            str_ends_with($host, '.peetripizza.ee');

        $safe =
            $secure &&
            $approved &&
            !isset($parts['user']) &&
            !isset($parts['pass']) &&
            !isset($parts['fragment']) &&
            (!isset($parts['port']) || (int)$parts['port'] === 443);

        $result['websocket_configured'] = true;
        $result['secure_transport'] = $secure;
        $result['approved_host'] = $approved;
        $result['websocket_enabled'] = false;
        $result['configuration_acceptable'] = $safe;

        return $result;
    }

    public static function nextAction(
        bool $socketConnected,
        bool $pageVisible,
        int $secondsSinceLastSync
    ): string {
        if (!$pageVisible) {
            return 'pause';
        }

        if ($socketConnected) {
            return $secondsSinceLastSync >= 60
                ? 'verify_with_get'
                : 'wait_for_event';
        }

        return $secondsSinceLastSync >= 15
            ? 'poll_orders'
            : 'wait';
    }

    public static function eventAction(string $event): string
    {
        return match ($event) {
            'order-sent',
            'order-updated' => 'reload_orders',
            'pizzeria-updated' => 'reload_branch',
            'couriers-updated' => 'reload_couriers',
            default => 'ignore'
        };
    }
}
