<?php
declare(strict_types=1);
/*
 * Peetri Pizza v17.67 — server diagnostic for the owner, run over SSH only:
 *   php tools/diag.php
 * 1) JS errors from the kitchen tablets (private_data/client-errors-*.log), grouped.
 * 2) The real structure of a LIVE order from peetripizza.ee (GET /api/orders, read only):
 *    field names, counts, true/false flags and short product/topping words.
 *    Never prints customer names, phones, addresses, notes, ids, prices or the session.
 * Uses the session of a tablet that is logged in now (private_data/sessions); nothing is written anywhere.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
$priv = $root . '/private_data';
$out = static function (string $s = ''): void { fwrite(STDOUT, $s . "\n"); };

/* ---------- 1: JS errors ---------- */
$out('=== 1. Vead tahvlites (JS) ===');
$files = glob($priv . '/client-errors-*.log') ?: [];
$rows = [];
foreach ($files as $f) {
    $lines = @file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach (array_slice($lines, -400) as $l) { $j = json_decode($l, true); if (is_array($j)) $rows[] = $j; }
}
if (!$rows) {
    $out('Vigu pole (' . count($files) . ' logifaili).');
} else {
    $groups = [];
    foreach ($rows as $r) {
        $k = ($r['message'] ?? '') . ' @ ' . ($r['source'] ?? '') . ':' . ($r['line'] ?? 0);
        $g = $groups[$k] ?? ['n' => 0, 'last' => '', 'rel' => '', 'mode' => ''];
        $g['n']++; $g['last'] = (string)($r['at'] ?? ''); $g['rel'] = (string)($r['release'] ?? ''); $g['mode'] = (string)($r['mode'] ?? '');
        $groups[$k] = $g;
    }
    uasort($groups, static fn($a, $b) => strcmp($b['last'], $a['last']));
    $out(count($rows) . ' kirjet, ' . count($groups) . ' eri viga (uuemad enne):');
    foreach (array_slice($groups, 0, 25, true) as $k => $g) $out(sprintf(' %3d× %s  [viimati %s, v%s, %s]', $g['n'], mb_substr($k, 0, 220), $g['last'], $g['rel'], $g['mode']));
}
$out();

/* ---------- 2: LIVE order structure ---------- */
$out('=== 2. LIVE tellimuse ehitus (ainult väljade nimed) ===');
$token = null; $newest = 0;
foreach (glob($priv . '/sessions/sess_*') ?: [] as $sf) {
    $mt = (int)@filemtime($sf); if ($mt <= $newest) continue;
    $raw = (string)@file_get_contents($sf);
    if (!preg_match('/pp_upstream_session\|s:(\d+):"/', $raw, $m, PREG_OFFSET_CAPTURE)) continue;
    $len = (int)$m[1][0]; $t = substr($raw, $m[0][1] + strlen($m[0][0]), $len);
    if (strlen($t) >= 12) { $token = $t; $newest = $mt; }
}
if (!$token) { $out('Ühtegi sisse logitud tahvlit ei leitud. Ava tahvlis töölaud (LIVE) ja käivita uuesti.'); exit(0); }
if (!function_exists('curl_init')) { $out('PHP curl puudub.'); exit(0); }
$h = curl_init('https://peetripizza.ee/api/orders');
curl_setopt_array($h, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 12,
    CURLOPT_HTTPHEADER => ['Accept: application/json', 'x-session-id: ' . $token], CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_USERAGENT => 'PeetriKitchenReadOnly/1.0']);
$body = curl_exec($h); $code = (int)curl_getinfo($h, CURLINFO_RESPONSE_CODE); curl_close($h);
unset($token);
if ($code !== 200 || !is_string($body)) { $out('peetripizza.ee vastas koodiga ' . $code . ' (tahvli sessioon võib olla aegunud).'); exit(0); }
$data = json_decode($body, true);
$list = is_array($data) ? ($data['orders'] ?? $data['data'] ?? $data) : null;
if (!is_array($list)) { $out('Vastus ei ole tellimuste nimekiri.'); exit(0); }
$list = array_values(array_filter($list, 'is_array'));
$out('Tellimusi praegu: ' . count($list));

const PP1767_PII = '/name|first|last|customer|client|address|street|city|house|apartment|flat|email|phone|tel|mobile|comment|note|instruction|message|coord|lat|lng|lon|ip|token|session|card|iban/i';
const PP1767_ENUM = '/^(status|state|serving|delivery_?type|type|order_?type|service(_type)?|packag(e|ing)|size|pizza_?size|base|dough(_?type)?|rim|crust|cheese|payment(_?type|_?method)?|is[A-Z_].*|has[A-Z_].*)$/';
const PP1767_ITEMS = '/item|product|topping|ingredient|extra|option|modifier|addon|component|removed|excluded|without|added/i';
function pp1767_val(string $key, $v, bool $inItems): string {
    if (is_bool($v)) return $v ? 'true' : 'false';
    if ($v === null) return 'null';
    if (is_int($v) || is_float($v)) return 'number';
    if (!is_string($v)) return gettype($v);
    if (preg_match(PP1767_PII, $key)) return $inItems && preg_match('/^(name|title|label)$/i', $key) && pp1767_word($v) ? '"' . $v . '"' : 'text';
    if ((preg_match(PP1767_ENUM, $key) || $inItems) && pp1767_word($v)) return '"' . $v . '"';
    return 'text';
}
function pp1767_word(string $v): bool { return mb_strlen($v) <= 40 && (bool)preg_match('/^[\p{L} ()\/,.:&+-]*$/u', $v); }
function pp1767_walk(string $path, $v, int $depth, bool $inItems, array &$lines): void {
    if (count($lines) > 220 || $depth > 5) return;
    if (!is_array($v)) return;
    if (array_is_list($v)) {
        $lines[] = $path . '[]  (' . count($v) . ' tk)';
        foreach (array_slice($v, 0, $inItems ? 4 : 2) as $i => $x) {
            if (is_array($x)) pp1767_walk($path . '[' . $i . ']', $x, $depth + 1, $inItems, $lines);
            else $lines[] = $path . '[' . $i . '] = ' . pp1767_val('', $x, $inItems);
        }
        return;
    }
    foreach ($v as $k => $x) {
        if (!is_string($k) || !preg_match('/^[A-Za-z][A-Za-z0-9_]{0,48}$/D', $k)) continue;
        $items = $inItems || (bool)preg_match(PP1767_ITEMS, $k);
        if (is_array($x)) {
            if (!$inItems && preg_match(PP1767_PII, $k)) { $lines[] = $path . '.' . $k . '  {' . implode(', ', array_slice(array_filter(array_keys($x), 'is_string'), 0, 20)) . '}'; continue; }
            pp1767_walk($path . '.' . $k, $x, $depth + 1, $items, $lines);
        } else {
            $lines[] = $path . '.' . $k . ' = ' . pp1767_val($k, $x, $items);
        }
    }
}
// The order with the most product lines tells the most (toppings removed / added, sizes, drinks).
usort($list, static fn($a, $b) => count($b['items'] ?? $b['products'] ?? []) <=> count($a['items'] ?? $a['products'] ?? []));
foreach (array_slice($list, 0, 2) as $n => $o) {
    $lines = [];
    pp1767_walk('tellimus', $o, 0, false, $lines);
    $out(''); $out('--- näide ' . ($n + 1) . ' ---');
    foreach ($lines as $l) $out($l);
}
$out(''); $out('Valmis. Kopeeri see tekst ja saada arendajale (nimesid, telefone ega aadresse siin pole).');
