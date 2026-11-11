#!/usr/bin/env bash
# Restart the fake-session server on :8099 with a fresh copy of app/peetripizza (used by shot.js).
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."
pkill -f "^php -d auto_prepend_file=.* -S 127[.]0[.]0[.]1:8099"; sleep 1
(cd "$ROOT/tests/browser" && nohup bash serve.sh "$ROOT/app/peetripizza" >/tmp/pp-serve.log 2>&1 &); sleep 1.5
