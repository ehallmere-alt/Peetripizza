#!/usr/bin/env bash
# Usage: ./serve.sh /path/to/unpacked/release   (folder that contains dashboard.php)
# Serves a COPY of the release at http://127.0.0.1:8099/peetripizza/ with a fake session.
set -euo pipefail
SRC="$(cd "$1" && pwd)"; HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(mktemp -d)"; mkdir -p "$WEB/peetripizza"; cp -r "$SRC/." "$WEB/peetripizza/"; mkdir -p "$WEB/peetripizza/private_data"
echo "Serving copy in $WEB on http://127.0.0.1:8099/peetripizza/dashboard.php"
exec php -d auto_prepend_file="$HERE/fake-session.php" -S 127.0.0.1:8099 -t "$WEB"
