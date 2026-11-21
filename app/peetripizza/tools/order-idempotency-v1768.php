<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 Stage 6
 * CLI-only tests using synthetic data.
 * No official API requests.
 */

if (PHP_SAPI !== 'cli') exit(1);

function check(bool $ok, string $name): void {
    if (!$ok) {
        echo "❌ $name\n";
        exit(1);
    }
    echo "✅ $name\n";
}

function operation(
    string $file,
    string $key,
    string $order,
    string $action
): string {
    if (!preg_match('/^[a-zA-Z0-9_-]{8,100}$/D', $key)) {
        return 'invalid_key';
    }

    $fp = fopen($file, 'c+');
    if (!$fp) return 'storage_error';

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return 'lock_error';
    }

    rewind($fp);
    $raw = stream_get_contents($fp);
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) $data = [];

    $fingerprint = hash('sha256', $order.'|'.$action);

    if (isset($data[$key])) {
        $result = hash_equals(
            $data[$key],
            $fingerprint
        ) ? 'duplicate_safe' : 'key_conflict';
    } elseif (in_array($fingerprint, $data, true)) {
        $result = 'operation_already_recorded';
    } else {
        $data[$key] = $fingerprint;

        rewind($fp);
        ftruncate($fp, 0);
        $written = fwrite(
            $fp,
            json_encode($data, JSON_THROW_ON_ERROR)
        );
        fflush($fp);

        $result = $written === false
            ? 'storage_error'
            : 'accepted_dry_run';
    }

    flock($fp, LOCK_UN);
    fclose($fp);

    return $result;
}

$file = tempnam(sys_get_temp_dir(), 'pp1768_');

if ($file === false) {
    exit("Cannot create test file\n");
}

try {
    echo "=== PEETRI PIZZA STAGE 6 ===\n";

    check(
        operation($file, 'test-key-0001', 'test-order-1', 'ready')
            === 'accepted_dry_run',
        'First operation accepted'
    );

    check(
        operation($file, 'test-key-0001', 'test-order-1', 'ready')
            === 'duplicate_safe',
        'Repeated request recognized'
    );

    check(
        operation($file, 'test-key-0001', 'test-order-2', 'ready')
            === 'key_conflict',
        'Reused key for another order blocked'
    );

    check(
        operation($file, 'test-key-0002', 'test-order-1', 'ready')
            === 'operation_already_recorded',
        'Same operation with new key blocked'
    );

    check(
        operation($file, 'test-key-0003', 'test-order-2', 'ready')
            === 'accepted_dry_run',
        'Different order accepted'
    );

    check(
        operation($file, 'test-key-0004', 'test-order-1', 'complete')
            === 'accepted_dry_run',
        'Different action accepted'
    );

    check(
        operation($file, 'bad', 'test-order-3', 'ready')
            === 'invalid_key',
        'Invalid request key rejected'
    );

    $stored = json_decode(file_get_contents($file), true);

    check(
        is_array($stored) && count($stored) === 3,
        'Only three unique operations stored'
    );

    echo "\n✅ STAGE 6 COMPLETE — 8/8\n";
    echo "DRY RUN ONLY — NO LIVE ORDERS MODIFIED\n";
} finally {
    @unlink($file);
}
