<?php
declare(strict_types=1);

/*
 * Peetri Pizza v17.68
 * Official status gateway.
 *
 * DRY RUN by default.
 * Real upstream PUT requests are disabled.
 */

require_once dirname(__DIR__).'/auth/bootstrap.php';
require_once __DIR__.'/official-order-preflight-v1768.php';

const PP1768_OFFICIAL_WRITES = false;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function respond68(int $code,array $data): never {
    http_response_code($code);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

if (($_SERVER['REQUEST_METHOD']??'') !== 'POST') {
    respond68(405,[
        'ok'=>false,
        'error'=>'method_not_allowed'
    ]);
}

pp_require_login();

if (!pp_csrf_valid(
    (string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')
)) {
    respond68(403,[
        'ok'=>false,
        'error'=>'invalid_csrf'
    ]);
}

if ((int)($_SERVER['CONTENT_LENGTH']??0)>2048) {
    respond68(413,[
        'ok'=>false,
        'error'=>'body_too_large'
    ]);
}

if (!preg_match(
    '~^application/json(?:\s*;|\s*$)~i',
    (string)($_SERVER['CONTENT_TYPE']??'')
)) {
    respond68(415,[
        'ok'=>false,
        'error'=>'json_required'
    ]);
}

$body=json_decode(
    (string)file_get_contents('php://input'),
    true
);

if (!is_array($body)) {
    respond68(422,[
        'ok'=>false,
        'error'=>'invalid_json'
    ]);
}

$localId=$body['id']??null;
$action=$body['action']??null;
$waitTime=$body['waitTime']??null;

if (
    !is_string($localId) ||
    !preg_match('/^live-[a-f0-9]{24}$/D',$localId) ||
    !is_string($action) ||
    !in_array($action,['confirm','ready'],true)
) {
    respond68(422,[
        'ok'=>false,
        'error'=>'invalid_action'
    ]);
}

// Confirmation needs a valid preparation time.
// Ready action must not supply unrelated parameters.
if ($action==='confirm' &&
    (PP1768_OFFICIAL_WRITES || $waitTime!==null) &&
    (!is_int($waitTime) || $waitTime<5 || $waitTime>180)) {
    respond68(422,[
        'ok'=>false,
        'error'=>'invalid_wait_time'
    ]);
}

if ($action==='ready' && $waitTime!==null) {
    respond68(422,[
        'ok'=>false,
        'error'=>'unexpected_wait_time'
    ]);
}

pp_start();

$branch=$_SESSION['pp_pizzeria']??null;
$token=$_SESSION['pp_upstream_session']??null;

$branchId=is_array($branch)
    ? (int)($branch['id']??0)
    : 0;

session_write_close();

if (
    $branchId<1 ||
    !is_string($token) ||
    strlen($token)<12
) {
    respond68(401,[
        'ok'=>false,
        'error'=>'kitchen_session_required'
    ]);
}

if (!function_exists('curl_init')) {
    respond68(503,[
        'ok'=>false,
        'error'=>'curl_unavailable'
    ]);
}

function officialGet68(
    string $path,
    string $token
): array {
    $ch=curl_init(
        'https://peetripizza.ee/api/'.$path
    );

    curl_setopt_array($ch,[
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_HTTPGET=>true,
        CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>5,
        CURLOPT_TIMEOUT=>12,
        CURLOPT_SSL_VERIFYPEER=>true,
        CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_HTTPHEADER=>[
            'Accept: application/json',
            'X-Session-Id: '.$token
        ]
    ]);

    $result=curl_exec($ch);
    $http=(int)curl_getinfo(
        $ch,CURLINFO_RESPONSE_CODE
    );
    $error=curl_errno($ch);

    curl_close($ch);

    if (
        $error ||
        $http!==200 ||
        !is_string($result) ||
        strlen($result)>4000000
    ) {
        throw new RuntimeException('upstream_failed');
    }

    $json=json_decode(
        $result,true,64,JSON_THROW_ON_ERROR
    );

    if (!is_array($json)) {
        throw new RuntimeException('invalid_response');
    }

    return $json;
}

// Fail-closed production writer.
// Not reachable while PP1768_OFFICIAL_WRITES=false.
function officialPut68(
    string $secureId,
    string $action,
    ?int $waitTime,
    string $token
): array {
    if (!PP1768_OFFICIAL_WRITES) {
        throw new RuntimeException('writes_disabled');
    }

    if (
        !preg_match('/^[A-Za-z0-9_-]{1,256}$/D',$secureId)
    ) {
        throw new RuntimeException('invalid_secure_id');
    }

    $endpoint=$action==='confirm'
        ? 'confirmed'
        : 'ready';

    $url='https://peetripizza.ee/api/orders/'.
        rawurlencode($secureId).'/'.$endpoint;

    $headers=[
        'Accept: application/json',
        'X-Session-Id: '.$token
    ];

    $payload=null;

    if ($action==='confirm') {
        $headers[]='Content-Type: application/json';
        $payload=json_encode(['waitTime'=>$waitTime]);
    }

    $ch=curl_init($url);

    $opts=[
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_CUSTOMREQUEST=>'PUT',
        CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>5,
        CURLOPT_TIMEOUT=>12,
        CURLOPT_SSL_VERIFYPEER=>true,
        CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_HTTPHEADER=>$headers
    ];

    if ($payload!==null) {
        $opts[CURLOPT_POSTFIELDS]=$payload;
    }

    curl_setopt_array($ch,$opts);

    $response=curl_exec($ch);
    $http=(int)curl_getinfo(
        $ch,CURLINFO_RESPONSE_CODE
    );
    $error=curl_errno($ch);

    curl_close($ch);

    // Timeout is an UNKNOWN result, never safe
    // to retry blindly.
    if ($error) {
        return [
            'accepted'=>false,
            'outcome'=>'unknown'
        ];
    }

    return [
        'accepted'=>$http>=200 && $http<300,
        'outcome'=>$http>=200 && $http<300
            ? 'acknowledged'
            : 'rejected'
    ];
}

$lock=null;

try {
    // Serialize concurrent attempts for the same order.
    $lockPath=dirname(__DIR__).
        '/private_data/official-action-'.
        $branchId.'-'.hash('sha256',$localId).'.lock';

    $lock=fopen($lockPath,'c');

    if (!$lock || !flock($lock,LOCK_EX|LOCK_NB)) {
        respond68(409,[
            'ok'=>false,
            'error'=>'action_in_progress'
        ]);
    }

    $officialBranch=officialGet68('pizzeria',$token);

    if ((int)($officialBranch['id']??0)!==$branchId) {
        respond68(403,[
            'ok'=>false,
            'error'=>'branch_mismatch'
        ]);
    }

    $data=officialGet68('orders',$token);

    $orders=$data['orders']
        ??$data['data']
        ??$data;

    if (!is_array($orders)) {
        throw new RuntimeException('invalid_orders');
    }

    if (!array_is_list($orders)) {
        $orders=array_values($orders);
    }

    if (count($orders)>3000) {
        throw new RuntimeException('too_many_orders');
    }

    $preflight=PP1768OfficialPreflight::check(
        $orders,$localId,$action
    );

    if (!$preflight['ok']) {
        respond68(409,[
            'ok'=>false,
            'error'=>$preflight['reason'],
            'official_write'=>false
        ]);
    }

    // The upstream secure ID is intentionally
    // never returned to the browser.
    $matched=null;
    foreach ($orders as $order) {
        if (
            is_array($order) &&
            PP1768OfficialPreflight::localId($order)
                ===$localId
        ) {
            $matched=$order;
            break;
        }
    }

    if (!is_array($matched)) {
        throw new RuntimeException('mapping_failed');
    }

    $secure=$matched['secure_id']??null;

    if (!is_string($secure) || $secure==='') {
        throw new RuntimeException('secure_id_missing');
    }

    if (!PP1768_OFFICIAL_WRITES) {
        // PP1768_GATEWAY_AUDIT_V1
        // No order IDs, secure IDs or customer data.
        $log=dirname(__DIR__).
            '/private_data/official-gateway-v1768.jsonl';

        $entry=json_encode([
            'at'=>date('c'),
            'action'=>$action,
            'result'=>'eligible_dry_run',
            'wait_time_supplied'=>is_int($waitTime),
            'official_write'=>false
        ]);

        if (is_string($entry)) {
            @file_put_contents(
                $log,$entry.PHP_EOL,
                FILE_APPEND|LOCK_EX
            );
            @chmod($log,0600);
        }

        respond68(200,[
            'ok'=>true,
            'mode'=>'DRY_RUN',
            'action'=>$action,
            'current_status'=>$preflight['current_status'],
            'proposed_status'=>$preflight['proposed_status'],
            'branch_verified'=>true,
            'order_verified'=>true,
            'official_write'=>false
        ]);
    }

    $write=officialPut68(
        $secure,$action,
        $action==='confirm'?$waitTime:null,
        $token
    );

    if (!$write['accepted']) {
        respond68(409,[
            'ok'=>false,
            'error'=>'write_'.$write['outcome'],
            'retry_safe'=>false
        ]);
    }

    // Confirm the result with a fresh official GET.
    $fresh=officialGet68('orders',$token);
    $freshOrders=$fresh['orders']??$fresh['data']??$fresh;

    $verified=false;

    if (is_array($freshOrders)) {
        foreach ($freshOrders as $order) {
            if (
                is_array($order) &&
                ($order['secure_id']??null)===$secure &&
                ($order['status']??null)
                    ===$preflight['proposed_status']
            ) {
                $verified=true;
                break;
            }
        }
    }

    respond68($verified?200:202,[
        'ok'=>$verified,
        'mode'=>'LIVE',
        'official_write'=>true,
        'verified'=>$verified,
        'retry_safe'=>false
    ]);

} catch (Throwable $e) {
    respond68(502,[
        'ok'=>false,
        'error'=>'official_action_unavailable',
        'official_write_confirmed'=>false,
        'retry_safe'=>false
    ]);
} finally {
    if (is_resource($lock)) {
        flock($lock,LOCK_UN);
        fclose($lock);
    }
}
