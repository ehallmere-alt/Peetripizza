# Changelog

## 17.10.0 — 2026-11-11
- Seaded → "Versioon": version shown on this tablet, version installed on the server (+ file checksum check against `tools/release-manifest.php`) and the newest version in GitHub (latest Release, else `main`). Tells you to reload the page, finish the install or install the new release.
- New read-only `api/version.php` (login required). GitHub is asked by the server (page CSP stays `connect-src 'self'`), cached 10 min in `private_data/github-latest.json`.
- New `assets/ops-v1710.js/.css`.

## 17.9.0 — 2026-11-11
- New order you can see without sound: big green "UUS TELLIMUS #… name" banner + flashing screen edge until tapped or accepted (`ops-v179.js/.css`).
- Urgent orders (< 5 min or late) move to the top of their column, pulse and give one short "urgent" signal per order.
- Dough reminder on every tablet from 14:00 until the 15:05 cut-off when this pizzeria has no dough order created today; "15 min pärast" snooze, red in the last 20 min. Local only.

## 17.8.0 — 2026-11-11
- One order parser for card, print, Väljastus and Statistika: `window.PPOrderInfo` (parse, boxes) in `app-core-v141.js`.
- 80 mm ticket (`print-v169.js`): big system number, name, phone, KAASA/KOHALE/KOHAPEAL, ready time, box line, SÕ/VÕ codes, only non-default modifiers, extras, note.
- Väljastus (`kitchen-v155.js`): number + big name + phone + boxes per order; done cards carry `data-phone` / `data-boxes`.
- Statistika: "Karbid täna" (boxes by size, branded separately, dine-in count).
- `api/order-shape.php?view=html`: readable field check (keys + short code-like values only, no customer data); link in Seaded.
- New `assets/ops-v178.css`.

## 17.7.0 — 2026-11-11
- New order card: big name, number YYMMDD-N (261111-2), customer phone, box summary, only non-default modifiers, SÕ/VÕ captions, orange qty > 1, one big action button (`card-v177.css`).

## 17.6.0 — 2026-11-11
- Adaptive polling, site wait time / closed badge, "Kodulehel otsas" in Tooted, menu lock in Seaded, offline service worker, "Täna köögis" in Statistika.

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
