# Peetri Pizza CSS cleanup — review gate (17 Nov 2026)

Source: GitHub branch `perf/ready-card-event-updates-20261117`. This is **not** a production CSS deployment.

## Findings
- `assets/app-v1767.css` is about 488 KB, with 14 embedded CSS sections. The first nested `assets/app-v1748.css` contains 35 further sections.
- `assets/kitchen-release-v1715.css` is about 302 KB and contains roughly 2812 occurrences of `!important`. The nested `app-v1748.css` has roughly 4595 and top-level `app-v1767.css` roughly 5198.
- A conservative signature scan found 9 repeated selector+declaration signatures within `app-v1767.css`: e.g. `.topbar`, `.drawer nav .pp-planned small`, `.topbar .brandgroup`, `.topbar .top-right`, `#ordersPage .pp110-card .cardfoot`, and several order-card footer selectors.
- The count alone does not establish redundancy. Same declarations can intentionally recur across `@media` scopes or between higher-priority rules.
- `assets/ops-v1766.css` was scanned for exact repeated blocks; none were found with the simple heuristic.

## Safe approval gates for actual CSS deletion
1. Capture the exact active CSS files and hashes from production. GitHub is not necessarily identical to current Termius edits.
2. Use browser computed styles and screenshots at phone and tablet/desktop widths, across approved kitchen themes, new/active/done orders, settings and drawers.
3. Keep cascading order and mobile behavior. Delete **only** exact rules proven redundant in the same media/support/layer context, then recompare screenshots.
4. Rebuild the nested CSS through a documented deterministic build process rather than hand-editing a generated file.
5. Run local static checks and browser regression tests, then obtain approval before any server change.

## Read-only tools created
- `tools/css-cascade-inventory.py`: hotspot count.
- `tools/css-nesting-audit.py`: nested CSS section map.
- `tools/css-duplicate-candidates.py`: possible duplicate declarations; **does not remove them**.
- Unit tests for structure and candidate detection; no CI or browser verification has been claimed.

**No CSS style rules were removed by this PR.**

## 17 Nov follow-up: scoped duplicate recheck
The original simple regex identified **nine** selector+declaration repeats but ignored at-rule context. The new read-only `tools/css-duplicate-candidates.py` parses nested braces, quoted braces and @-rule ancestry; when applied to the same GitHub `app-v1767.css` snapshot, it found **one** repeat in identical at-rule context:
- `.drawer nav .pp-planned small { font-size:11px; margin-left:auto }` (twice at top level).

This remains only a **candidate**, not a proven safe deletion. The rules may be separated by intentional overrides, and the scanner is not a complete CSS parser (CSS nesting, layer behavior and runtime selector specificity have not been verified). No CSS rules were removed.

Added unit cases for repeats in different `@media` blocks, quoted braces, comments, and exact top-level matches. Before any deletion, compare computed styles and screenshots on approved themes at mobile/tablet/desktop widths.
