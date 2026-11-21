<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68 — Stage 13
 * Shared READ-ONLY upstream API adapter.
 * No official write operations.
 * No session storage or customer data logging.
 */

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

final class PPUpstreamRead1768
{
    private const PATHS = [
        'orders'   => 'orders',
        'branch'   => 'pizzeria',
        'dough'    => 'internal-orders/todays-orders',
        'products' => 'simple-products',
        'toppings' => 'toppings',
        'realtime' => 'ping'
    ];

    private string $session;
    private int $branchId;
    private $transport;

    public function __construct(
        string $session,
        int $branchId,
        ?callable $transport = null
    ) {
        if (strlen($session) < 12 || strlen($session) > 512) {
            throw new InvalidArgumentException('invalid_session');
        }

        if ($branchId < 1) {
            throw new InvalidArgumentException('invalid_branch');
        }

        $this->session = $session;
        $this->branchId = $branchId;
        $this->transport = $transport;
    }

    public static function modules(): array
    {
        return array_keys(self::PATHS);
    }

    public function get(string $module): array
    {
        if (!isset(self::PATHS[$module])) {
            throw new InvalidArgumentException('module_not_allowed');
        }

        $path = self::PATHS[$module];

        if ($this->transport !== null) {
            $response = ($this->transport)($path);
        } else {
            $response = $this->request($path);
        }

        if (!is_array($response)) {
            throw new RuntimeException('invalid_transport_response');
        }

        $http = $response['http'] ?? 0;

        if ($http === 401) {
            throw new RuntimeException('session_expired');
        }

        if ($http === 403) {
            throw new RuntimeException('permission_denied');
        }

        if ($http === 429) {
            throw new RuntimeException('rate_limited');
        }

        if ($http !== 200) {
            throw new RuntimeException('upstream_unavailable');
        }

        $data = $response['data'] ?? null;

        if (!is_array($data)) {
            throw new RuntimeException('invalid_upstream_json');
        }

        // A branch response must belong to the logged-in pizzeria.
        if ($module === 'branch') {
            if ((int)($data['id'] ?? 0) !== $this->branchId) {
                throw new RuntimeException('branch_mismatch');
            }
        }

        return $data;
    }

    private function request(string $path): array
    {
        if (!function_exists('curl_init')) {
            throw new RuntimeException('curl_unavailable');
        }

        $url = 'https://peetripizza.ee/api/' . $path;

        $ch = curl_init($url);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_MAXREDIRS => 0,
            CURLOPT_HTTPGET => true,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'X-Session-Id: ' . $this->session
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_USERAGENT => 'PeetriKitchenReadOnly/17.68'
        ]);

        $body = curl_exec($ch);
        $http = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $error = curl_errno($ch);

        curl_close($ch);

        if ($error || !is_string($body) || strlen($body) > 3000000) {
            return ['http'=>502, 'data'=>null];
        }

        if ($http !== 200) {
            return ['http'=>$http, 'data'=>null];
        }

        try {
            $data = json_decode(
                $body,
                true,
                64,
                JSON_THROW_ON_ERROR
            );
        } catch (JsonException $e) {
            throw new RuntimeException('invalid_upstream_json');
        }

        return ['http'=>$http, 'data'=>$data];
    }
}
