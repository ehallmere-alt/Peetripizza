#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
ROOT="/www/apache/domains/www.crestudio.ee"
SITE="$ROOT/htdocs/peetripizza"
PIN="c7e2c16c785f9b4ade6971cb6dcc138b39dc9953"
SOURCE="https://raw.githubusercontent.com/ehallmere-alt/Peetripizza/$PIN/app/peetripizza"
test -f "$SITE/dashboard.php" && test -f "$SITE/index.php" && test -d "$SITE/assets" || { echo "STOP: wrong server folder"; exit 1; }
command -v git >/dev/null && command -v php >/dev/null && command -v curl >/dev/null || { echo "STOP: missing git/php/curl"; exit 1; }
TMP="$(mktemp -d "$ROOT/.pp1802-XXXXXXXX")"
MANIFEST="$TMP/manifest"
cat > "$MANIFEST" <<'FILES'
assets/kitchen-design-two-v1799.css|0b8e6ae8a3df718e499f9d81cbd59fedb501b168|f9682b7671850e7edcfc9de5edb54c525c23a768
assets/kitchen-design-switch-v1799.js|9d1c6e923f7c5ec7f74050788595052a183a629f|9bc9e79bf1fcf1fffd61bb472b991acab1efaa3c
assets/order-dedup-v1801.js|5509207e8061cdbc20668f5855b7aa74a6cb370d|abb0695b3a049f899f35660c70481cc7528c58c9
assets/official-reference-v1801.css|35fff40e62bbda3bb40ee6a0c168268db807813b|-
assets/official-reference-v1801.js|eb8cc89f9360665179d12cf1f6c49b4138f31743|-
assets/app-core-v141.js|45fc551cf7a93672f9e8b1c92386e5a0e5e3cfe0|1b57baaa57d02d943692c323ec682fbc71f16b72
dashboard.php|d312c7ab2699eaa77e0bbf34240be21bb47efb43|e6f60aa16db5820d49ae3baf00f9598cfb3e3201 048f52383eb0999e3bb683ca7b7eabc319a01971
index.php|b37e86f66e9dc4449327deca300a39a0c7882125|ae114a1d43b704730898fe3209e077bbf3d05fd6
FILES
echo "Checking that current production is a reviewed version..."
while IFS='|' read -r file new old; do
  if test -f "$SITE/$file"; then
    actual="$(git hash-object "$SITE/$file")"
    case " $new $old " in *" $actual "*) ;; *) echo "STOP: unexpected $file hash ($actual); nothing installed"; exit 1;; esac
  elif test "$old" != "-"; then
    echo "STOP: missing $file"; exit 1
  fi
done < "$MANIFEST"
echo "Downloading eight reviewed files..."
while IFS='|' read -r file new old; do
  mkdir -p "$TMP/in/$(dirname "$file")"
  curl -fLsS --retry 2 --connect-timeout 8 --max-time 30 "$SOURCE/$file" -o "$TMP/in/$file"
  test "$(git hash-object "$TMP/in/$file")" = "$new" || { echo "STOP: downloaded $file hash mismatch"; exit 1; }
done < "$MANIFEST"
php -l "$TMP/in/dashboard.php" >/dev/null
php -l "$TMP/in/index.php" >/dev/null
if command -v node >/dev/null; then
  for file in assets/order-dedup-v1801.js assets/official-reference-v1801.js assets/app-core-v141.js assets/kitchen-design-switch-v1799.js; do
    node --check "$TMP/in/$file"
  done
fi
BACKUP="$ROOT/peetri-backups/ui-1802-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"
while IFS='|' read -r file new old; do
  if test -f "$SITE/$file"; then
    mkdir -p "$BACKUP/$(dirname "$file")"
    cp -p "$SITE/$file" "$BACKUP/$file"
  fi
done < "$MANIFEST"
cp "$MANIFEST" "$BACKUP/manifest"
INSTALLING=0
undo_on_error() {
  code=$?
  trap - ERR
  if test "$INSTALLING" -eq 1; then
    echo "RESTORING ORIGINAL FILES..."
    while IFS='|' read -r file new old; do
      if test -f "$BACKUP/$file"; then cp -p "$BACKUP/$file" "$SITE/$file" || true
      else rm -f "$SITE/$file" || true; fi
    done < "$MANIFEST"
  fi
  rm -rf "$TMP"
  exit "$code"
}
trap undo_on_error ERR
INSTALLING=1
while IFS='|' read -r file new old; do
  cp "$TMP/in/$file" "$SITE/$file.pp1802-new"
  mv -f "$SITE/$file.pp1802-new" "$SITE/$file"
done < "$MANIFEST"
php -l "$SITE/dashboard.php" >/dev/null
php -l "$SITE/index.php" >/dev/null
while IFS='|' read -r file new old; do
  test "$(git hash-object "$SITE/$file")" = "$new"
done < "$MANIFEST"
INSTALLING=0
trap - ERR
rm -rf "$TMP"
echo "SUCCESS: Peetri Pizza v18.02 UI files installed"
echo "Backup: $BACKUP"
echo "Go to https://www.crestudio.ee/peetripizza/ and open Tooted"
echo "If the installation says STOP, nothing was changed."
