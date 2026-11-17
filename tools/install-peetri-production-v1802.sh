#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
ROOT="/www/apache/domains/www.crestudio.ee"
SITE="$ROOT/htdocs/peetripizza"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$HERE/manifest.txt"
ACTION="${1:---check}"
[[ "$ACTION" == "--check" || "$ACTION" == "--install" ]] || { echo "Usage: bash install.sh --check|--install"; exit 2; }
[[ -r "$MANIFEST" && -d "$HERE/payload" && -f "$SITE/dashboard.php" && -f "$SITE/index.php" ]] || { echo "STOP: wrong package/site"; exit 1; }
command -v git >/dev/null && command -v php >/dev/null || { echo "STOP: need git/php"; exit 1; }
[[ "$(readlink -f "$SITE")" == "$ROOT/htdocs/peetripizza" ]] || { echo "STOP: site realpath differs"; exit 1; }
count=0
while IFS='|' read -r file target old; do
  [[ -n "$file" ]] || continue
  [[ "$file" =~ ^(assets/[a-zA-Z0-9._-]+\.(css|js)|dashboard\.php|index\.php)$ ]] || { echo "STOP: unsafe path $file"; exit 1; }
  [[ -f "$HERE/payload/$file" ]] || { echo "STOP: missing payload $file"; exit 1; }
  got="$(git hash-object "$HERE/payload/$file")"
  [[ "$got" == "$target" ]] || { echo "STOP: corrupt payload $file ($got)"; exit 1; }
  if [[ -f "$SITE/$file" ]]; then
    actual="$(git hash-object "$SITE/$file")"
    if [[ "$actual" != "$target" && " $old " != *" $actual "* ]]; then
      echo "STOP: unexpected current $file ($actual). No changes."; exit 1
    fi
  elif [[ "$old" != "-" ]]; then
    echo "STOP: missing existing file $file. No changes."; exit 1
  fi
  ((count+=1))
done < "$MANIFEST"
[[ "$count" -eq 8 ]] || { echo "STOP: manifest length $count"; exit 1; }
php -l "$HERE/payload/dashboard.php" >/dev/null
php -l "$HERE/payload/index.php" >/dev/null
if command -v node >/dev/null; then
  for f in "$HERE"/payload/assets/*.js; do node --check "$f" >/dev/null; done
fi
echo "CHECK OK: 8 reviewed files, PHP syntax good; target=$SITE"
if [[ "$ACTION" == "--check" ]]; then exit 0; fi
BACKUP="$ROOT/peetri-backups/v1802-$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$BACKUP"
cp "$MANIFEST" "$BACKUP/manifest.txt"
while IFS='|' read -r file target old; do
  [[ -n "$file" ]] || continue
  if [[ -f "$SITE/$file" ]]; then
    mkdir -p "$BACKUP/$(dirname "$file")"
    cp -p "$SITE/$file" "$BACKUP/$file"
  else
    printf '%s\n' "$file" >> "$BACKUP/created.txt"
  fi
done < "$MANIFEST"
touch "$BACKUP/backup-complete"
installing=1
restore() {
  status=$?
  trap - ERR INT TERM
  if [[ "${installing:-0}" -eq 1 ]]; then
    echo "FAIL: restoring from $BACKUP"
    while IFS='|' read -r file target old; do
      [[ -n "$file" ]] || continue
      if [[ -f "$BACKUP/$file" ]]; then cp -p "$BACKUP/$file" "$SITE/$file" || true
      else rm -f "$SITE/$file" || true; fi
    done < "$MANIFEST"
  fi
  exit "$status"
}
trap restore ERR INT TERM
while IFS='|' read -r file target old; do
  [[ -n "$file" ]] || continue
  cp -p "$HERE/payload/$file" "$SITE/$file.pp1802-tmp"
  mv -f "$SITE/$file.pp1802-tmp" "$SITE/$file"
done < "$MANIFEST"
php -l "$SITE/dashboard.php" >/dev/null
php -l "$SITE/index.php" >/dev/null
while IFS='|' read -r file target old; do
  [[ -n "$file" ]] || continue
  [[ "$(git hash-object "$SITE/$file")" == "$target" ]] || false
done < "$MANIFEST"
installing=0
trap - ERR INT TERM
echo "SUCCESS: v18.02 installed; backup=$BACKUP"
echo "ROLLBACK (if needed): bash $HERE/restore.sh '$BACKUP'"
