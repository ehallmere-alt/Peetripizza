# Changelog

## 17.2.0 — 2026-11-11
- Header is identical on every page (orders-view header rules re-applied to all pages via generated block in `assets/ui-v172.css`); never wraps; duplicate Uued/Töös totals hidden below 1500 px; stale "v16" sub-label removed.
- DEMO / LIVE switch in the header (`#pp172-mode`), replaces the read-only status chip; it clicks the original read-only LIVE button. Phones: one pill that toggles.
- "Tööriistad ja ülevaated" hidden on the home page (approved by user). DOM kept: health, reconcile, stale alert, filters and undo elements are still used by scripts.
- Drawer backdrop now dims the header.
- Settings: single heading scale, no double dividers, green form controls, one secondary button size, three bare checkboxes ("Sees" label shown even when off) now use the same switch look; emoji removed from two headings.

## 17.1.0 — 2026-11-11
- Boot guard now hides the whole `.shell` (legacy topbar flashed on slow tablets in 17.0).
- Timer tick cascade removed: `header-v132`, `home-v157`, `peetri-v160` write DOM only on change; `peetri-v160`/`peetri-v164` observers ignore countdown-only mutations and react to `.ordercard` class (urgency) changes.
- New `assets/header-v171.js|css`: Statistika and Valmis (N) header shortcuts reusing existing handlers; hidden on phones.
- Header no longer overflows at 768–1100 px.
- `tools/deploy.sh`: backup (app + private_data + external configs), unzip, checks, automatic code rollback; `--rollback`, `--list`.
- `tools/.htaccess`: deny web access to tools.
- Cache-busting `?v=17.1.0` on every changed asset; manifest regenerated.
- Browser regression suite kept outside the release (dev only): 9 Playwright tests.
