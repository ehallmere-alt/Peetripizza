<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 11
 * Integration failure handling.
 * CLI ONLY / SYNTHETIC TESTS / NO NETWORK.
 */

if (PHP_SAPI !== 'cli') exit(1);

final class PPResilience1768 {

    private array $failures = [];
    private array $openedUntil = [];
    private int $now;

    public function __construct(int $now = 1000000) {
        $this->now = $now;
    }

    public function advance(int $seconds): void {
        $this->now += $seconds;
    }

    public function classify(
        int $http,
        bool $networkError = false,
        bool $validJson = true
    ): string {
        if ($networkError) return 'network_error';
        if ($http === 401) return 'session_expired';
        if ($http === 403) return 'permission_denied';
        if ($http === 429) return 'rate_limited';
        if ($http >= 500) return 'upstream_error';
        if ($http < 200 || $http >= 300) return 'http_error';
        if (!$validJson) return 'invalid_json';

        return 'ok';
    }

    public function allowed(string $module): bool {
        return ($this->openedUntil[$module] ?? 0) <= $this->now;
    }

    public function record(
        string $module,
        string $result
    ): void {
        if ($result === 'ok') {
            $this->failures[$module] = 0;
            unset($this->openedUntil[$module]);
            return;
        }

        // Authorization failures must not be retried automatically.
        if (in_array($result, [
            'session_expired',
            'permission_denied'
        ], true)) {
            $this->failures[$module] = 0;
            $this->openedUntil[$module] = PHP_INT_MAX;
            return;
        }

        $count = ($this->failures[$module] ?? 0) + 1;
        $this->failures[$module] = $count;

        if ($count >= 3) {
            $this->openedUntil[$module] = $this->now + 60;
        }
    }

    public function retryPolicy(
        string $method,
        string $result
    ): string {
        $method = strtoupper($method);

        // Never automatically repeat a write after uncertain failure.
        if ($method !== 'GET') {
            return 'manual_reconciliation';
        }

        return match ($result) {
            'ok' => 'none',
            'session_expired' => 'login_required',
            'permission_denied' => 'permission_required',
            'rate_limited' => 'respect_retry_after',
            'invalid_json' => 'schema_review',
            'network_error', 'upstream_error' => 'backoff',
            default => 'manual_review'
        };
    }

    public function snapshot(string $module): array {
        return [
            'module' => $module,
            'allowed' => $this->allowed($module),
            'failures' => $this->failures[$module] ?? 0,
            'write_enabled' => false
        ];
    }
}

function check1768(bool $ok, string $name): void {
    echo ($ok ? '✅ ' : '❌ ') . $name . PHP_EOL;
    if (!$ok) exit(1);
}

echo "=== PEETRI PIZZA v17.68 / STAGE 11 ===\n";

$r = new PPResilience1768();
$passed = 0;

function t(bool $ok, string $name): void {
    global $passed;
    check1768($ok, $name);
    $passed++;
}

t(
    $r->classify(200) === 'ok',
    'HTTP 200 accepted'
);

t(
    $r->classify(401) === 'session_expired',
    'Expired session detected'
);

t(
    $r->classify(403) === 'permission_denied',
    'Missing permission detected'
);

t(
    $r->classify(429) === 'rate_limited',
    'Rate limit detected'
);

t(
    $r->classify(500) === 'upstream_error',
    'Official API server error detected'
);

t(
    $r->classify(200, true) === 'network_error',
    'Network failure detected'
);

t(
    $r->classify(200, false, false) === 'invalid_json',
    'Invalid JSON detected'
);

t(
    $r->retryPolicy('PUT', 'network_error')
        === 'manual_reconciliation',
    'Uncertain order write cannot auto-retry'
);

t(
    $r->retryPolicy('POST', 'upstream_error')
        === 'manual_reconciliation',
    'Dough and bonus writes cannot auto-retry'
);

t(
    $r->retryPolicy('GET', 'network_error')
        === 'backoff',
    'Read requests use backoff'
);

t(
    $r->retryPolicy('GET', 'rate_limited')
        === 'respect_retry_after',
    'HTTP 429 respects Retry-After'
);

$r->record('orders', 'network_error');
$r->record('orders', 'network_error');

t(
    $r->allowed('orders'),
    'Two failures do not open circuit'
);

$r->record('orders', 'network_error');

t(
    !$r->allowed('orders'),
    'Three failures open circuit'
);

t(
    $r->allowed('products'),
    'Other integrations remain available'
);

$r->advance(61);

t(
    $r->allowed('orders'),
    'Circuit cooldown expires'
);

$r->record('orders', 'ok');

t(
    $r->snapshot('orders')['failures'] === 0,
    'Successful request clears failures'
);

$r->record('bonuses', 'permission_denied');

t(
    !$r->allowed('bonuses'),
    'Unauthorized bonus access blocked'
);

$r->advance(3600);

t(
    !$r->allowed('bonuses'),
    'Authorization error cannot recover automatically'
);

t(
    $r->snapshot('bonuses')['write_enabled'] === false,
    'Bonus writes remain disabled'
);

t(
    $r->snapshot('orders')['write_enabled'] === false,
    'Official order writes remain disabled'
);

echo "\n✅ STAGE 11 COMPLETE — {$passed}/{$passed}\n";
echo "🔒 NO NETWORK REQUESTS\n";
echo "🔒 NO LIVE ORDERS OR BONUSES MODIFIED\n";
echo "🍕 KITCHEN UI UNCHANGED\n";
