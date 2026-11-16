<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 8
 * Persistent operation journal.
 * CLI-only synthetic tests.
 * NO official API requests.
 */

if (PHP_SAPI !== 'cli') exit(1);

function test(bool $ok, string $name): void {
    echo ($ok ? '✅ ' : '❌ ') . $name . PHP_EOL;
    if (!$ok) exit(1);
}

function journal(string $file, callable $callback): mixed {
    $fp = fopen($file, 'c+');
    if (!$fp) throw new RuntimeException('storage_error');

    try {
        if (!flock($fp, LOCK_EX)) {
            throw new RuntimeException('lock_error');
        }

        rewind($fp);
        $raw = stream_get_contents($fp);
        if ($raw === false) {
            throw new RuntimeException('read_error');
        }

        $data = $raw === ''
            ? ['operations'=>[]]
            : json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($data) ||
            !isset($data['operations']) ||
            !is_array($data['operations'])) {
            throw new RuntimeException('invalid_journal');
        }

        $result = $callback($data);

        $json = json_encode($data, JSON_THROW_ON_ERROR);

        rewind($fp);
        if (!ftruncate($fp, 0)) {
            throw new RuntimeException('truncate_error');
        }

        $length = strlen($json);
        $written = 0;

        while ($written < $length) {
            $n = fwrite($fp, substr($json, $written));
            if ($n === false || $n === 0) {
                throw new RuntimeException('write_error');
            }
            $written += $n;
        }

        if (!fflush($fp)) {
            throw new RuntimeException('flush_error');
        }

        return $result;
    } finally {
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

function createOperation(
    string $file,
    string $key,
    string $order,
    string $action
): string {
    return journal($file, function(array &$data) use (
        $key, $order, $action
    ): string {
        if (!preg_match('/^[a-zA-Z0-9_-]{8,100}$/D', $key)) {
            return 'invalid_key';
        }

        $fingerprint = hash('sha256', $order.'|'.$action);

        if (isset($data['operations'][$key])) {
            $old = $data['operations'][$key];

            if ($old['fingerprint'] !== $fingerprint) {
                return 'key_conflict';
            }

            return $old['state'] === 'confirmed'
                ? 'already_confirmed'
                : 'duplicate_blocked';
        }

        foreach ($data['operations'] as $old) {
            if ($old['fingerprint'] === $fingerprint) {
                return 'duplicate_blocked';
            }
        }

        $data['operations'][$key] = [
            'fingerprint'=>$fingerprint,
            'state'=>'pending',
            'created_at'=>time()
        ];

        return 'created_dry_run';
    });
}

function setState(
    string $file,
    string $key,
    string $state
): string {
    return journal($file, function(array &$data) use (
        $key, $state
    ): string {
        if (!isset($data['operations'][$key])) {
            return 'not_found';
        }

        $old = $data['operations'][$key]['state'];

        $allowed = [
            'pending'=>['unknown','confirmed'],
            'unknown'=>['confirmed'],
            'confirmed'=>[]
        ];

        if (!in_array($state, $allowed[$old] ?? [], true)) {
            return 'transition_blocked';
        }

        $data['operations'][$key]['state'] = $state;
        $data['operations'][$key]['updated_at'] = time();

        return 'state_saved';
    });
}

function recover(string $file): array {
    return journal($file, function(array &$data): array {
        $result = [
            'confirmed'=>0,
            'manual_review'=>0
        ];

        foreach ($data['operations'] as &$op) {
            if ($op['state'] === 'confirmed') {
                $result['confirmed']++;
                continue;
            }

            // Any unfinished operation needs reconciliation.
            // Never assume an upstream write failed.
            $op['state'] = 'unknown';
            $result['manual_review']++;
        }
        unset($op);

        return $result;
    });
}

echo "=== PEETRI PIZZA v17.68 / STAGE 8 ===\n";

$file = tempnam(sys_get_temp_dir(), 'pp1768_');

if ($file === false) exit("Cannot create test journal\n");

try {
    test(
        createOperation(
            $file,'test-key-1001','TEST-ORDER-1','ready'
        ) === 'created_dry_run',
        'Operation stored on disk'
    );

    test(
        createOperation(
            $file,'test-key-1001','TEST-ORDER-1','ready'
        ) === 'duplicate_blocked',
        'Duplicate blocked'
    );

    test(
        createOperation(
            $file,'test-key-1002','TEST-ORDER-1','ready'
        ) === 'duplicate_blocked',
        'New key cannot bypass protection'
    );

    test(
        createOperation(
            $file,'test-key-1003','TEST-ORDER-2','ready'
        ) === 'created_dry_run',
        'Second order stored'
    );

    test(
        setState(
            $file,'test-key-1003','confirmed'
        ) === 'state_saved',
        'Confirmed state persisted'
    );

    // Simulate a restart by reading the journal again.
    $result = recover($file);

    test(
        $result['manual_review'] === 1,
        'Pending operation recovered as unknown'
    );

    test(
        $result['confirmed'] === 1,
        'Confirmed operation preserved'
    );

    test(
        createOperation(
            $file,'test-key-1001','TEST-ORDER-1','ready'
        ) === 'duplicate_blocked',
        'Restart does not permit duplicate'
    );

    test(
        setState(
            $file,'test-key-1001','pending'
        ) === 'transition_blocked',
        'Unknown state cannot return to pending'
    );

    test(
        createOperation(
            $file,'test-key-1003','TEST-ORDER-2','ready'
        ) === 'already_confirmed',
        'Confirmed action cannot run again'
    );

    $stored = json_decode(
        file_get_contents($file), true
    );

    test(
        count($stored['operations'] ?? []) === 2,
        'Journal contains exactly two operations'
    );

    echo "\n✅ STAGE 8 COMPLETE — 11/11\n";
    echo "🔒 NO LIVE ORDERS MODIFIED\n";
    echo "🔒 AUTOMATIC RETRIES DISABLED\n";
} finally {
    @unlink($file);
}
