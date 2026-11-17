# Peetri Pizza — initial read-only source audit (17 Nov 2026)

Basis: GitHub branch `sync/production-17-95-review-20261116`. The production server has later manual changes and has **not** been captured here. Do not deploy this branch as a complete site.

## Confirmed source observations
- `dashboard.php` actually loads 3 CSS files and 16 JS files after excluding the historical HTML comment. The comment contains hundreds of legacy references; raw grep or smoke checks can overcount them.
- `assets/app-v1767.css` is ~488 KB, embeds 14 CSS source sections and has approximately 5,198 `!important` tokens. Merging/removing selectors without screenshot regression checks is unsafe.
- `assets/app-b-v1767.js` is ~293 KB with 64 embedded source modules, ~43 `new MutationObserver` constructs and ~54 `setInterval(...)` expressions. Those are *static counts*, not proof of simultaneous runtime activity.
- `ops-v1740.js` (within the JS bundle) decorates ready cards via a 1,500 ms interval; `ops-v1766.js` adds pizza-count chips via a 1,200 ms interval. Audit which can become event-driven after confirming observed behavior.
- `tools/v17-smoke-check.php` searches `dashboard.php` as raw text, so it can interpret references in the historical HTML comment as loaded assets. Replace with an HTML-aware inventory before using it as a release gate.
- `tools/release-check.php` and `tools/release-manifest.php` still use 17.67-era labels; `README-RU.md` begins with 17.0. Treat these as stale until updated from verified deployment.
- GitHub `main` and this branch diverge (14 commits ahead, 4 behind). Do not blindly deploy or merge `main` into production.

## Recommended sequence (not yet implemented)
1. Capture current production hashes, path/symlink target, real browser HTML assets, and a rollback snapshot. Do not copy order/customer data to public files.
2. Make a browser regression checklist for LIVE order refresh, sound, Smart Print, handover status, kitchen layout, mobile/tablet, and `Tooted`.
3. Replace the old smoke checker with the read-only `tools/source-audit.py` inventory; then add PHP/JS syntax checks and stable screenshots.
4. Refactor the lowest-risk polling-only presentation modules into event-driven code, one module per PR, comparing rendered output before/after.
5. Consolidate CSS only after preserving cascade order, test both themes and viewport sizes. Never remove `!important` in bulk.
6. Rebuild bundles deterministically, refresh manifests, and stage-test before deployment.

This branch contains **audit tooling and documentation only**. No production, order, LIVE, print, or sound changes.

## 17 November — additional verification
- Rechecked the **actual active** `dashboard.php` HTML (not raw grep). It loads 3 CSS files and 16 JS files in the GitHub sync branch; this does not establish what is live on the server after subsequent Termius changes.
- Compared five representative original scripts against embedded sections of `app-b-v1767.js`: `ops-v1740.js`, `ops-v1766.js`, `ops-v1754.js` and `pickup-v155.js` matched byte-for-byte after trimming generated trailing whitespace; `kitchen-v155.js` differed in `audioStatus()`. Bundled code tests for an unavailable diagnostics object first (`!d`) whereas the standalone source begins with `!d?.supported`; blindly rebuilding would change the displayed sound-readiness message.
- The deterministic builder scripts **do exist** at repository root: `tools/js-bundle.js`, `tools/css-bundle.py`. They expect the original unbundled HTML template. Do **not** run either against the already-bundled `dashboard.php`: the JS builder sees the existing app-a/core/app-b tags and could rebundle them again instead of reconstructing the original source grouping. Restore an approved unbundled baseline or implement a safe explicit build manifest first.
- Added `tools/bundle-drift.py` to compare both generated JS bundles against their original source modules. It is read-only and returns a nonzero exit status if source drift or unrecognized bundle format is found. This is a prerequisite for safe future refactoring.
- Added Python unit tests for asset inventory and bundle-drift checks, but tests **have not yet been executed against a full checkout**. Do not treat draft PR #20 as release-ready.

### Local read-only commands for a checked-out repo
```bash
python3 app/peetripizza/tools/test-source-audit.py
python3 app/peetripizza/tools/test-bundle-drift.py
cd app/peetripizza
python3 tools/source-audit.py
python3 tools/bundle-drift.py
```

No production or main branch files were modified by this audit.

## Full JS bundle-source comparison — completed, 17 November 2026
Using the source contents on `sync/production-17-95-review-20261116`, inspected **all 70** bundled scripts: 6 in `app-a-v1767.js`, 64 in `app-b-v1767.js`. **65 identical**, **5 drifted** after removing generated trailing whitespace.
- `assets/sound-v141.js` (app-a): major source/bundle difference (about 3.4 KB), including audio readiness/reliable context handling. **High risk**; do not rebuild sound.
- `assets/kitchen-v155.js` (app-b): different wording/guard for missing sound diagnostics (25 characters delta).
- `assets/kitchen-v156.js` (app-b): different missing-diagnostics sound status guard (25 characters delta).
- `assets/ops-v1735.js` (app-b): different sound state label logic (317 characters delta).
- `assets/ops-v1749.js` (app-b): **heartbeat semantics differ**. Embedded build updates `liveAt` from `pp150:live-synced` and resets on `pp150:live-stopped`; standalone source updates `liveAt` on `pp145:orders`. Rebundling from source would change the semantics and could impact `live_at:0`. Do not infer a production failure from static analysis alone.

### Deployment gate
Before any production refactor: compare real production JS/CSS hashes to the GitHub baseline, identify the active heartbeat script, and record the approved desired behavior. Preserve the bundled behavior until a regression-tested replacement is approved. Run `python3 tools/bundle-drift.py` to stop unsafe bundling.

This remains a read-only review; none of the five differences has been automatically overwritten or "fixed".
