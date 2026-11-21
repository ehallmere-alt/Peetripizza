#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
BASE=/www/apache/domains/www.crestudio.ee
SITE="$BASE/htdocs/peetripizza"
PIN=4cabe5bcd7dd1d75fc6703ffa659d8af128f73db
SRC="https://raw.githubusercontent.com/ehallmere-alt/Peetripizza/$PIN/app/peetripizza"
TMP="$(mktemp -d "$BASE/.pp1801-XXXXXXXX")"
BACKUP="$BASE/peetri-backups/pp-1801-$(date +%Y%m%d-%H%M%S)"
MANIFEST="$TMP/files.txt"
cat > "$MANIFEST" <<'FILES'
assets/kitchen-design-two-v1799.css 0b8e6ae8a3df718e499f9d81cbd59fedb501b168 f9682b7671850e7edcfc9de5edb54c525c23a768
assets/kitchen-design-switch-v1799.js 9d1c6e923f7c5ec7f74050788595052a183a629f 9bc9e79bf1fcf1fffd61bb472b991acab1efaa3c
assets/order-dedup-v1801.js abb0695b3a049f899f35660c70481cc7528c58c9 -
assets/official-reference-v1801.css 35fff40e62bbda3bb40ee6a0c168268db807813b -
assets/official-reference-v1801.js eb8cc89f9360665179d12cf1f6c49b4138f31743 -
dashboard.php 048f52383eb0999e3bb683ca7b7eabc319a01971 e6f60aa16db5820d49ae3baf00f9598cfb3e3201
index.php b37e86f66e9dc4449327deca300a39a0c7882125 ae114a1d43b704730898fe3209e077bbf3d05fd6
FILES
test -f "$SITE/dashboard.php" && test -f "$SITE/index.php" && test -d "$SITE/assets" || { echo "WRONG SERVER DIRECTORY; STOP"; exit 1; }
command -v curl >/dev/null && command -v git >/dev/null && command -v php >/dev/null || { echo "Missing curl/git/php"; exit 1; }
echo "Checking current production code. No changes yet..."
while read -r file new old; do
  if test -f "$SITE/$file"; then
    current="$(git hash-object "$SITE/$file")"
    if test "$current" != "$new" && test "$current" != "$old"; then
      echo "STOP: unexpected current $file, production left untouched"; exit 1
    fi
  elif test "$old" != "-"; then
    echo "STOP: missing expected $file"; exit 1
  fi
done < "$MANIFEST"
while read -r file new old; do
  mkdir -p "$TMP/download/$(dirname "$file")"
  curl -fLsS --retry 2 --connect-timeout 10 --max-time 35 \
    "$SRC/$file" -o "$TMP/download/$file"
  test "$(git hash-object "$TMP/download/$file")" = "$new" || { echo "STOP: hash mismatch $file"; exit 1; }
done < "$MANIFEST"
php -l "$TMP/download/dashboard.php" >/dev/null
php -l "$TMP/download/index.php" >/dev/null
if command -v node >/dev/null; then
  node --check "$TMP/download/assets/order-dedup-v1801.js"
  node --check "$TMP/download/assets/official-reference-v1801.js"
  node --check "$TMP/download/assets/kitchen-design-switch-v1799.js"
fi
mkdir -p "$BACKUP"
while read -r file new old; do
  if test -f "$SITE/$file"; then
    mkdir -p "$BACKUP/$(dirname "$file")"
    cp -p "$SITE/$file" "$BACKUP/$file"
  fi
done < "$MANIFEST"
cp "$MANIFEST" "$BACKUP/manifest.txt"
INSTALLING=0
recover() {
  code=$?
  trap - ERR
  if test "$INSTALLING" = 1; then
    echo "ERROR: automatically restoring production backup"
    while read -r file new old; do
      if test -f "$BACKUP/$file"; then cp -p "$BACKUP/$file" "$SITE/$file" || true
      else rm -f "$SITE/$file" || true; fi
    done < "$MANIFEST"
  fi
  rm -rf "$TMP"
  exit "$code"
}
trap recover ERR
INSTALLING=1
while read -r file new old; do
  cp "$TMP/download/$file" "$SITE/$file.pp1801-tmp"
  mv -f "$SITE/$file.pp1801-tmp" "$SITE/$file"
done < "$MANIFEST"
php -l "$SITE/dashboard.php" >/dev/null
php -l "$SITE/index.php" >/dev/null
while read -r file new old; do
  test "$(git hash-object "$SITE/$file")" = "$new"
done < "$MANIFEST"
INSTALLING=0
trap - ERR
rm -rf "$TMP"
echo "INSTALLED: v18.01 optional design + dedup + read-only menu and locations."
echo "BACKUP: $BACKUP"
echo "OPEN: https://www.crestudio.ee/peetripizza/"
echo "SETTINGS: Seaded > Kujundus 2 · Premium Clean"
echo "LIVE/printer/audio/order data settings unchanged."
