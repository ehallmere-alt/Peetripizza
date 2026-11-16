#!/usr/bin/env bash
# Runs on the remote server before any Peetri Pizza patch. In check mode this is the whole script.
set -euo pipefail
if [[ $# -ne 1 ]]; then echo 'ERROR: expected one application directory' >&2; exit 1; fi
PP_APP="${1%/}"
if [[ "$PP_APP" != /* || "$PP_APP" != */peetripizza ]]; then
  echo 'ERROR: unexpected application directory' >&2
  exit 1
fi
if [[ ! -d "$PP_APP" ]]; then
  echo 'ERROR: application directory does not exist' >&2
  exit 1
fi
PP_APP="$(cd -P -- "$PP_APP" && pwd)"
if [[ "$PP_APP" != */peetripizza ]]; then
  echo 'ERROR: unexpected resolved application directory' >&2
  exit 1
fi
for file in dashboard.php auth/bootstrap.php tools/release-manifest.php tools/release-check.php tools/v17-smoke-check.php; do
  if [[ ! -f "$PP_APP/$file" ]]; then
    echo "ERROR: not a complete Peetri Pizza installation (missing $file)" >&2
    exit 1
  fi
done
if ! command -v php >/dev/null 2>&1; then
  echo 'ERROR: PHP CLI not available on this server' >&2
  exit 1
fi
version=$(grep -oE 'name="peetri-release" content="[0-9.]+"' "$PP_APP/dashboard.php" | head -n 1 | cut -d '"' -f 4 || true)
if [[ -z "$version" ]]; then
  echo 'ERROR: Peetri Pizza release marker not found' >&2
  exit 1
fi
export PP_APP
printf 'Verified Peetri Pizza directory: %s\nCurrent app version: %s\n' "$PP_APP" "$version"
