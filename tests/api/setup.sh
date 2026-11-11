#!/usr/bin/env bash
# usage: setup.sh <release dir>  -> serves copy on :8097 (no fake session) with upstream faked on :8098
set -e; A="$(cd "$(dirname "$0")" && pwd)"; SRC="$1"
pkill -f "^php -S 127[.]0[.]0[.]1:809[78]" || true
W="$A/web/d1/d2"; rm -rf "$A/web"; mkdir -p "$W"; cp -r "$SRC" "$W/peetripizza"; mkdir -p "$W/peetripizza/private_data"
grep -rl "https://peetripizza.ee/api/" "$W/peetripizza/api" "$W/peetripizza/auth" | xargs sed -i 's#https://peetripizza.ee/api/#http://127.0.0.1:8098/api/#g'
echo ok > "$A/mode.txt"
(cd "$A" && nohup php -S 127.0.0.1:8098 upstream.php >"$A/up.log" 2>&1 &)
(nohup php -S 127.0.0.1:8097 -t "$W" >"$A/web.log" 2>&1 &)
sleep 1; echo "web=$W"
