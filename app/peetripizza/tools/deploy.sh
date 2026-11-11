#!/usr/bin/env bash
# Peetri Pizza Service App — safe updater with backup and rollback (v17.1).
#
#   Install:   bash deploy.sh <release.zip> [app_dir]
#   Rollback:  bash deploy.sh --rollback [backup.tar.gz] [app_dir]
#   List:      bash deploy.sh --list
#
# What it does on install:
#   1. Checks the ZIP (dashboard.php at the top, no "..", no absolute paths, no private_data inside).
#   2. Backs up the WHOLE app folder (including private_data) + the external auth/location
#      configs into $BACKUP_DIR (outside the web root, chmod 700).
#   3. Unpacks the ZIP over the app folder (unzip -o: nothing is deleted).
#   4. Runs tools/release-check.php and tools/v17-smoke-check.php.
#   5. If a check fails, restores the program files from the backup automatically.
#      private_data is NEVER overwritten by a rollback, so kitchen statuses/dough orders
#      saved in the meantime are kept.
#
# It never deletes data, never touches LIVE/upstream systems, and prints no secrets.
set -euo pipefail

DOMAIN_ROOT="${DOMAIN_ROOT:-/www/apache/domains/www.crestudio.ee}"
APP_DIR_DEFAULT="$DOMAIN_ROOT/htdocs/peetripizza"
BACKUP_DIR="${BACKUP_DIR:-$DOMAIN_ROOT/peetri-backups}"
EXTERNAL_FILES=("$DOMAIN_ROOT/peetri_staff_auth.php" "$DOMAIN_ROOT/peetri_locations.php")
KEEP_BACKUPS="${KEEP_BACKUPS:-10}"

say(){ printf '%s\n' "$*"; }
die(){ printf 'ОШИБКА: %s\n' "$*" >&2; exit 1; }
need(){ command -v "$1" >/dev/null 2>&1 || die "не найдена команда '$1'"; }

latest_backup(){ ls -1t "$BACKUP_DIR"/peetripizza-*.tar.gz 2>/dev/null | head -n1 || true; }

run_checks(){
  local app="$1" ok=0
  say "— Проверка файлов релиза (release-check)…"
  php "$app/tools/release-check.php" || ok=1
  if [ -f "$app/tools/v17-smoke-check.php" ]; then
    say "— Проверка разметки и ссылок (smoke-check)…"
    php "$app/tools/v17-smoke-check.php" || ok=1
  fi
  return $ok
}

restore_code(){
  # Restore program files from a backup; private_data stays as it is now.
  local backup="$1" app="$2" parent name
  parent="$(dirname "$app")"; name="$(basename "$app")"
  [ -f "$backup" ] || die "резервная копия не найдена: $backup"
  say "— Откат программных файлов из $(basename "$backup") (private_data не трогаю)…"
  tar -xzf "$backup" -C "$parent" --exclude="$name/private_data" --exclude="$name/private_data/*" "$name"
}

backup_now(){
  local app="$1" stamp file parent name
  stamp="$(date +%Y%m%d-%H%M%S)"; parent="$(dirname "$app")"; name="$(basename "$app")"
  mkdir -p "$BACKUP_DIR"; chmod 700 "$BACKUP_DIR"
  file="$BACKUP_DIR/peetripizza-$stamp.tar.gz"
  say "— Резервная копия приложения и private_data → $file"
  tar -czf "$file" -C "$parent" "$name"
  chmod 600 "$file"
  local ext="$BACKUP_DIR/external-config-$stamp.tar.gz" have=()
  for f in "${EXTERNAL_FILES[@]}"; do [ -f "$f" ] && have+=("$(basename "$f")"); done
  if [ "${#have[@]}" -gt 0 ]; then
    tar -czf "$ext" -C "$DOMAIN_ROOT" "${have[@]}"; chmod 600 "$ext"
    say "— Внешние конфиги (пароли/пиццерии) сохранены отдельно → $(basename "$ext")"
  fi
  # Keep only the newest $KEEP_BACKUPS app backups (oldest are removed, never the new one).
  ls -1t "$BACKUP_DIR"/peetripizza-*.tar.gz 2>/dev/null | tail -n +"$((KEEP_BACKUPS+1))" | xargs -r rm -f --
  LAST_BACKUP="$file"
}

check_zip(){
  local zip="$1" list
  list="$(unzip -Z1 "$zip")" || die "не удалось прочитать ZIP"
  grep -qx 'dashboard.php' <<<"$list" || die "в корне ZIP нет dashboard.php — это не релиз Peetri Pizza"
  if grep -Eq '(^/|(^|/)\.\.(/|$))' <<<"$list"; then die "ZIP содержит опасные пути (.. или абсолютные)"; fi
  if grep -Eq '^private_data(/|$)' <<<"$list"; then die "ZIP содержит private_data — так не должно быть"; fi
}

case "${1:-}" in
  --list)
    ls -1t "$BACKUP_DIR"/peetripizza-*.tar.gz 2>/dev/null || say "Резервных копий нет в $BACKUP_DIR"
    ;;
  --rollback)
    need tar; need php
    BACKUP="${2:-$(latest_backup)}"; APP="${3:-$APP_DIR_DEFAULT}"
    [ -n "$BACKUP" ] || die "нет резервных копий в $BACKUP_DIR"
    [ -d "$APP" ] || die "папка приложения не найдена: $APP"
    restore_code "$BACKUP" "$APP"
    run_checks "$APP" || say "ВНИМАНИЕ: после отката проверка показала отличия (новые файлы релиза остаются на месте, но не подключены)."
    say "Готово. Обнови страницу на планшетах без кеша."
    ;;
  ""|-h|--help)
    sed -n '2,20p' "$0"
    ;;
  *)
    need unzip; need tar; need php
    ZIP="$1"; APP="${2:-$APP_DIR_DEFAULT}"
    [ -f "$ZIP" ] || die "ZIP не найден: $ZIP"
    [ -d "$APP" ] || die "папка приложения не найдена: $APP"
    [ -f "$APP/dashboard.php" ] || die "в $APP нет dashboard.php — проверь путь"
    check_zip "$ZIP"
    backup_now "$APP"
    say "— Распаковка $(basename "$ZIP") → $APP"
    unzip -o -q "$ZIP" -d "$APP"
    if run_checks "$APP"; then
      say ""
      say "УСТАНОВЛЕНО. Релиз: $(grep -o 'name="peetri-release" content="[^"]*"' "$APP/dashboard.php" | sed 's/.*content="//;s/"//')"
      say "Резервная копия: $LAST_BACKUP"
      say "Откат при проблемах:  bash $APP/tools/deploy.sh --rollback"
      say "Обнови страницу на планшетах без кеша."
    else
      say ""
      say "ПРОВЕРКА НЕ ПРОШЛА — возвращаю прежнюю версию."
      restore_code "$LAST_BACKUP" "$APP"
      die "релиз не установлен, прежняя версия восстановлена. Данные не тронуты."
    fi
    ;;
esac
