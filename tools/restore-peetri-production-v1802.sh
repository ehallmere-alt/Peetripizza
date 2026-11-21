#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="/www/apache/domains/www.crestudio.ee"
SITE="$ROOT/htdocs/peetripizza"
BACKUP="${1:-}"
[[ "$BACKUP" == "$ROOT"/peetri-backups/v1802-* && -f "$BACKUP/backup-complete" && -f "$BACKUP/manifest.txt" ]] || { echo "STOP: invalid backup"; exit 1; }
[[ -f "$SITE/dashboard.php" ]] || { echo "STOP: missing site"; exit 1; }
while IFS='|' read -r file target old; do
  [[ -n "$file" ]] || continue
  [[ "$file" =~ ^(assets/[a-zA-Z0-9._-]+\.(css|js)|dashboard\.php|index\.php)$ ]] || exit 1
  if [[ -f "$BACKUP/$file" ]]; then cp -p "$BACKUP/$file" "$SITE/$file"
  else rm -f "$SITE/$file"; fi
done < "$BACKUP/manifest.txt"
php -l "$SITE/dashboard.php" && php -l "$SITE/index.php"
echo "ROLLBACK OK: restored $BACKUP"
