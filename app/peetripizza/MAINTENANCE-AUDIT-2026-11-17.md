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
