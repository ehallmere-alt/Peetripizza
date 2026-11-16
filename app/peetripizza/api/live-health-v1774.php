<?php
declare(strict_types=1);

/*
 * Read-only LIVE cache freshness check.
 * No orders, identities, credentials or customer data returned.
 */
require_once dirname(__DIR__).'/auth/bootstrap.php';

pp_require_login();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD']??'')!=='GET') {
    header('Allow: GET');
    http_response_code(405);
    echo '{"ok":false,"error":"method_not_allowed"}';
    exit;
}

pp_start();
$branch=$_SESSION['pp_pizzeria']??null;
$id=is_array($branch)?(int)($branch['id']??0):0;
session_write_close();

if ($id<1 || $id>9999999) {
    http_response_code(403);
    echo '{"ok":false,"error":"branch_required"}';
    exit;
}

$file=dirname(__DIR__).'/private_data/live-index-'.$id.'.json';

$result=[
    'ok'=>true,
    'read_only'=>true,
    'source'=>'server_live_cache',
    'state'=>'no_data',
    'age_seconds'=>null,
    'order_count'=>null,
    'official_api_checked'=>false
];

if (is_file($file)) {
    $size=@filesize($file);

    if (is_int($size) && $size>=0 && $size<=600000) {
        $data=json_decode((string)@file_get_contents($file),true);

        if (is_array($data)) {
            $updated=(int)($data['updated_at']??0);
            $orders=$data['orders']??null;
            $now=time();

            if ($updated>0 && $updated<=$now+5) {
                $age=max(0,$now-$updated);

                $result['age_seconds']=$age;
                $result['order_count']=is_array($orders)
                    ? count($orders) : null;

                $result['state']=$age<=45
                    ? 'fresh'
                    : ($age<=120 ? 'delayed' : 'stale');
            }
        }
    }
}

echo json_encode($result,JSON_UNESCAPED_UNICODE);
