# Changelog

## 17.14.0 — 2026-11-11
- **Smart Print Monitor**: shared print log for all tablets (`api/print-log.php`; order id, number, time, kind, tablet label, outcome — no customer data). Auto-print is done by one tablet only (first claim wins); a blocked/failed print does not count, so another tablet may print it. Manual reprint asks "Juba prinditud … Prindi koopia?" (in-app dialog) and the ticket says KOOPIA / KORDUSPRINT. After printing a bar asks "kas tšekk tuli välja? Jah / Ei, prindi uuesti". A blocked popup shows a red bar with "Prindi nüüd". Seaded: "Printimise jälgimine" tiles + list + "Testi printerit"; order window: "Prinditud 2× · viimati 14:05". `print-v169.js` only got hooks.
- **System Health 2.0** (Seaded): cards for LIVE, Sünkroonimine, Internet, Printer, Salvestus, Versioon, Tahvel (battery, clock vs server, Wake Lock), Laadimiskiirus (are CSS/JS compressed), Server. `system-health.php` also returns private_data size, free disk, files near a read limit and server time. LIVE API test stays a manual button.
- **Tablet Performance**: `assets/.htaccess` turns on gzip for CSS/JS (inside IfModule mod_deflate + mod_filter); 17.14 layers load after the page is shown (`late-v1714.js`) so first paint is not slower; Seaded switch "Tahvli kiirrežiim" (off by default: no blur, no looping animations, lighter shadows, same layout); `content-visibility` for Väljastus lists. Memory checked over time in DEMO: no DOM/listener growth.
- **Taigna tellimine 4.0**: an order can be edited until the first 15:05 after it was created (server enforces, `edit_window_closed`), badge "✎ Muudetav kuni …" / "🔒 Muutmine suletud", edit bar with "Tühista muutmine", "● Salvestamata muudatused" and an in-app question before leaving with unsaved quantities, history open by default with a 7-day summary and per-edit details ("Külmutatud pitsapall 2 → 5"). No delivery calendar.
- **Kitchen Analytics** (Statistika): `api/kitchen-analytics.php` keeps id, number and four times per LIVE order (created, deadline, Võta vastu, Valmis) for 35 days; shows orders, average + median prep time, order→ready time, late orders (+ list), peak hour and load by hour for Täna / Eile / 7 päeva. DEMO computed from the screen. No staff names or ratings.
- Cards: the size chip shows only the code (SÕ, VÕ…); family and medium pizzas now get a code too (PÕ/PP = pere õhuke/paks, KÕ/KP = keskmine), so "õhuke põhi" no longer sits under the name. Ready cards ("Klienti ootavad") are more compact: one footer row, no "N tooterida", "⏱ Ootab 4 h 45 min", "± Lisandid", modifiers spaced ("Juust: mozzarella" no longer glued to the base).
- **Regression Guard**: API battery +27 checks (print claims/duplicates, analytics, dough edit window, health), browser +7 tests (print duplicate + KOOPIA, blocked print, health cards, analytics, speed mode, dough guard, no sideways scroll on 360 / 800 / 1280 px).

## 17.13.0 — 2026-11-11
- Compact, livelier order card (appended to `card-v177.css` so no extra request on slow tablets; CSS only, same markup and buttons): colour stripe on the left (new = orange, cooking = blue, soon = amber, late = red), one header line with a timer pill instead of the big ring (KIIRE / ÜLE AJA inside the pill, no corner ribbon), smaller chips, tight product rows, one footer row with ⓘ / 🔗 icon buttons (48 px) and the main action. Cards are ~25–30 % lower, so more orders fit on the tablet.
- Timer pill: caption (⏱ JÄÄNUD / KIIRE / HILJA), big time, "→ 20:50", thick progress line; late = solid red with "+01:35" (was "−01:35").
- Delivery label is now "KULLERIGA" (card and 80 mm ticket); labels: KAASA · KOHAPEAL · KULLERIGA.
- DEMO: three realistic orders (KAASA, KOHAPEAL, KULLERIGA) with SÕ/VÕ codes, boxes, a note, plus one ready order; "+ demo" rotates the three types. Demo storage key `pp-demo-orders-v2` so tablets get the new demo set.

## 17.12.0 — 2026-11-11
- Taigna tellimine: "Tarnekuupäev" row hidden (owner's request). The hidden input still defaults to tomorrow, so save/edit work as before (`dough-v1712.css`).
- Seaded: "Ekraani seaded / Personaalne töölaud" hidden; "Köögimeeskond" hidden in Seaded and menu even if a script adds it later (`ops-v1712.js/.css`). Hidden, not removed.

## 17.11.0 — 2026-11-11
- Home screen "Klienti ootavad tellimused": full ready cards (name, number, products, sum, "Ootab klienti N min", big Üle antud) for every waiting order, oldest first; red frame after 15 min. Cards are copies of the real `#doneOrders` cards and every button presses the original one. The old 3-row list stays in the DOM (hidden) for other scripts.
- "↶ Tagasi" bar for 10 s after LIVE Võta vastu / Valmis (reverts via `api/kitchen-status.php`) and after Üle antud (LIVE and DEMO). The LIVE "Kas tellimus on valmis?" question is no longer shown; the undo bar replaces it.
- "🧾 Lõpeta vahetus" (Statistika + menu): today's orders, sum, ready / late, average cook time (LIVE), handed over, average wait at the counter, boxes by size, top 5 products; 80 mm print. Read-only.
- New `assets/ops-v1711.js/.css`.

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
