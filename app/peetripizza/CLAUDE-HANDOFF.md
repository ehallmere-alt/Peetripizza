# HANDOFF TO CLAUDE — Peetri Pizza Service App v17.2

You are receiving the existing Peetri Pizza kitchen application. **Preserve behavior and the approved homepage exactly.** The user works in Russian; the UI is in Estonian. Build on the supplied files; do not redesign the kitchen homepage without explicit approval.

## Stack and deployment
- PHP + vanilla JavaScript + CSS, hosted at `www.crestudio.ee`, real project dir: `/www/apache/domains/www.crestudio.ee/htdocs/peetripizza/`.
- User uploads ZIP to `/www/apache/domains/www.crestudio.ee`, then installs using `unzip -o <archive> -d htdocs/peetripizza/`.
- Release `17.2.0` (see CHANGELOG.md); directory for bundled code includes `dashboard.php`, `index.php`, `auth/`, `api/`, `assets/`, `tools/`, `dough.php`.
- Authentication: `auth/bootstrap.php`; actual credentials are external to document root, not included in archive. Never embed passwords or API secrets.

## Product contract (non-negotiable)
1. Homepage design is frozen, including original logo, light palette, existing order cards and timers. No new hero, statistics panels, diagnostic badges, green summary panel, or kitchen search. `Ooteaeg` stays **only in the header**.
2. Removed `LIVE Engine 3.0` / `4.0` diagnostic badges must not reappear; actual LIVE error warnings can remain. Keep a functional LIVE button.
3. Navigation `Tellimused`, `Tooted`, `Statistika`, `Taigna tellimine`, `Boonused`, `Seaded`: selecting other sections MUST hide order queue completely. Sidebar must scroll on tablets.
4. `Tarnekalender` block and `Köögimeeskond` module must remain removed, and no shift-management functionality.
5. `Boonused` links to existing customer program https://peetripizza.ee/bonus/ — do not create employee bonuses or duplicate loyalty service.
6. `Tooted` has `Saadaval / Otsas` local state; no inventory ledger, purchase lists, or low-stock inventory alerts.
7. `Taigna tellimine` is a separate local dough-order feature. Do not claim it sends data to supplier without implementation.
8. The official LIVE feed is read-only. Local kitchen status changes use internal API; do not imply upstream orders are updated.
9. Customer data, authentication, authorization, and live order IDs are sensitive. No logs or archives should leak secrets/private_data.

## Architecture and critical dependencies
- `dashboard.php` contains initial server-rendered layout. Home v15.7 `assets/home-v157.js` reparents existing controls into `.pp157-home-shell`. `assets/home-v158.js`, `assets/peetri-v160.js` to `peetri-v164.js` customize behavior. Avoid disabling any script without dependency analysis.
- `assets/kitchen-release-v166.css` is an ordered consolidated legacy stylesheet. CSS includes many `!important` rules. Avoid global selector changes that break `.page.active` navigation.
- `assets/boot-v170.js` prevents the legacy PHP dashboard flashing before hydration, with a 3s fail-safe. Appending it as a deferred script at the end preserves the order of previous scripts.
- `assets/menu-live-v1692.js` moves the actual LIVE button to the visible header area; keep its original click handler.
- `assets/operations-v168.js` augments order history and status UI; `assets/print-v169.js` handles browser-based 80mm printing; `assets/health-v169.js` manages diagnostics.
- `api/kitchen-status.php`, `api/kitchen-history.php`, `api/live.php`, `api/live-health.php`, `api/dough.php` implement server actions. Auth/CSRF and pizzeria isolation are important.
- `tools/release-manifest.php` (SHA256 map), `tools/release-check.php`, `tools/v17-smoke-check.php` are read-only deployment checks.

## Current status / verification caveats
- v17.0 is built from the last attached server archive plus the v16.9.3 stabilization patch; the **production server has not been changed by ChatGPT**.
- Local syntactic and link/static checks can be performed, but LIVE API, real printer hardware, authenticated sessions and real dough supplier integration need onsite tests.
- Last report: old UI flashed on refresh. v16.9.3 added boot gate; v17.0 refines and standardizes that. Verify actual result with user before claiming issue resolved in production.
- Old CSS and JavaScript artifacts were moved by user to quarantine using cleanup tool: 143 files moved, 17 referenced legacy files preserved. Do not delete those remaining on the server without mapping references.

## Immediate priorities after deployment
1. Confirm live `meta[name="peetri-release"]` is 17.0.0; run release checker and smoke checker.
2. Verify initial page paint on iOS Safari and Android tablet, then navigate through every menu item with queue hidden on other pages; check browser console for errors.
3. Confirm demo and real LIVE toggling (read-only), audible alerts, timer transitions, return to `Tellimused`, local kitchen statuses, 80mm printing, and `Taigna tellimine` history.
4. Only then plan source modularization. Avoid risky mass refactors of 35+ layered JS files before establishing a repeatable browser test suite.
5. Provide exactly **six** numbered proposals for future upgrades; user chooses options before implementing.

## Developer acceptance criteria
- No old flash or duplicated order components on refresh and navigation.
- Same accepted homepage presentation and clean Estonian UI; no search on kitchen.
- No regression in LIVE read-only, statuses, Tooted, dough, settings or auth.
- Updater preserves data and offers rollback.
- Document all changes and supply full deploy ZIP with exact SSH command.

## v17.1 notes
- Boot guard covers `body>.shell`. Header shortcuts `#pp171-stats` / `#pp171-ready` (approved by user 2026-11-11) live in `assets/header-v171.*` and must keep delegating to the drawer Statistika item and `#toggleHistory`.
- Several decorators observe `#newOrders/#activeOrders` with `subtree:true`; the 1s countdown mutates them. Any new observer there must ignore countdown-only records and write DOM only on change, or it re-creates the per-second cascade.
- Deploy with `tools/deploy.sh` (backup + checks + rollback; never restores private_data).
- A Playwright regression suite exists outside the release (dev harness with a fake CLI-server session); run it before every release.

## v17.2 notes
- `assets/ui-v172.css` contains a GENERATED block: every `.pp-orders-view` header rule of kitchen-release-v166.css re-applied with `:is(.pp-orders-view,:not(.pp-orders-view))` so the header is identical on all pages. If header CSS changes, regenerate rather than hand-edit.
- `#pp157-more` (Tööriistad ja ülevaated) is hidden by CSS only, user-approved 2026-11-11. Do not delete its DOM: it hosts pp154-stale, pp155 health, pp156 reconcile, kitchen filters and undoBar used by scripts.
- `#pp172-mode` DEMO/LIVE switch delegates to the native read-only LIVE button; `#pp160-live-chip` is hidden but still updated.
- Updates are delivered to the user as one SSH paste (patch script with SHA-256 verification), not ZIPs.
