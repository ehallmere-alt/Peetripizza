# Production 17.95.0 → GitHub synchronization checklist

**Status:** audit-only; no production deployment; do not merge this branch until server sources are reviewed.

## Evidence (read-only, 2026-11-16)

- Production `dashboard.php` meta release: **17.95.0**.
- GitHub `main` meta release: **17.67.0**.
- For files tracked in `main`: **8 modified**, **2 absent** on production: `CHANGELOG.md` and `tools/deploy.sh`. Absence is *not* approval to delete them from GitHub.
- **233 additional server files** absent from `main` (count from filename-only audit, includes many historical `README-v*.md`).
- **46 directly referenced assets** found by parsing `src` and `href` from `dashboard.php`, `index.php`, `dough.php`, and `check.php` (HTML comments excluded). This is **not** a complete dependency graph.
- Runtime observation: LIVE heartbeat on active Windows Chrome had `mode=live` and nonzero `live_at`. No heartbeat change should be committed as part of synchronization.

## Rules

1. Never run `git init`, `git add .`, or `git push` in the live app directory. Clone to an isolated staging folder.
2. Never upload `private_data/`, auth secrets, credentials, tokens, sessions, cookies, device/customer data, backups, or logs. Only explicit allowlisted *source files* are candidates.
3. A zero count from a **filename** filter does not prove files are free of embedded secrets. Inspect/scan actual **contents locally** before a public commit.
4. Rebuild bundled JS/CSS from sources where possible, then verify file hashes and browser tests; source and generated bundles must remain consistent.
5. Do not delete missing tracked files automatically. Review each missing file.
6. Do not overwrite production 17.95.0 with GitHub 17.67.0. Synchronization flows server → reviewed branch → PR. Merge/release/deploy only after approval and regression tests.

## Proposed stages

- [x] Isolate review branch `sync/production-17-95-review-20261116` from `main`.
- [x] Add ignore rules for selected sensitive/runtime files.
- [x] Create tracking issue #11.
- [x] Collect filename-count and direct HTML asset-inventory evidence.
- [ ] Build transitive inventory: bundled sources, scripts loaded dynamically, CSS resources, PHP includes.
- [ ] Classify 233 server-only files as required source, optional historical documentation, generated asset, runtime state, or forbidden secret.
- [ ] Copy **approved allowlist only** to isolated staging and run content/secret checks.
- [ ] Check API/browser tests (read-only/mock data), PHP and JS syntax, release manifest/hash consistency.
- [ ] Commit reviewed sources to this branch; update this draft PR with test evidence.
- [ ] Ask owner approval before merging, tagging, releasing, or deploying.

Ref: issue #11 / draft PR #12.

## Verification evidence, 2026-11-16

- Isolated staging clone built: **308 candidates** (85 new, 6 modified, 217 unchanged); **7 excluded/flagged**.
- Syntax screening of 91 new/modified files: **67 checks, 0 failed, 0 skipped**. The remaining non-code files were not syntax checked.
- Additional staging privacy check on **91 changed/new candidates**: 23 CSS, 1 .htaccess, 26 JS, 41 PHP.
- **0 blocked indicator patterns**, but **2 manual-review matches**: Estonian-phone-like literal in `tests-v150.php`, email-like literal in `tools/test-realtime-v1768.php`. Do not upload these two files before confirming they contain synthetic fixtures.
- The scanner did not establish that the remaining files contain no secrets or real customer data. **No source code uploaded yet**, no merge/deploy.

### Next gates

- [ ] Review both test-file matches privately; exclude them from public commit until confirmed synthetic.
- [ ] Create a local-only staged diff for the 89 other changes; review filenames, additions and compiled-bundle integrity.
- [ ] Audit remaining candidates for secrets, personal data and server-only configuration before any public push.
- [ ] Commit/push only validated source to this draft branch, then run regression tests before requesting review.
