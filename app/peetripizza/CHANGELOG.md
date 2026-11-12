# Changelog

## 17.45.0 — 2026-11-12
- Owner picked 1, 3, 6 (`assets/ops-v1745.js/.css`, loaded before boot-v170): (1) thin bar at the bottom of the JÄÄNUD box shrinks from order time to deadline, orange when ≤5 min, hidden when late or pre-order; (3) ETTETELLIMUS cards in "Uued" fold into one line at the bottom (name, day+time, N pitsat), open by tap (sessionStorage `pp1745-open`) or by themselves when under an hour (state `pre` from ops-v1728 ends); (6) long customer/product names: font steps down to 62 %, then two lines at 72 % instead of "…"; name column may shrink next to the time box (it used to run under it). Off switch: `html.pp1745-off`.

## 17.44.0 — 2026-11-12
- Owner: time box shows minutes left big ("JÄÄNUD / 18 min") and the ready time small ("valmis 17:12"). Late stays "HILJA / +8 min / pidi 17:48", far pre-order stays "Homme / 17:30" (`assets/ops-v1728.js` timers).

## 17.43.0 — 2026-11-12
- Owner: "выровняй, чтобы не накладывалось". Card spacing by gaps instead of margins/divider bars: meta row (#id, type, N pitsat) and footer (price, payment, button) wrap cleanly, chips never touch the button, qty and size chips centred in their columns, Lisaks row aligned. Checked at 1024/1280/1366 for overlaps (`assets/ops-v1741.css`).

## 17.42.0 — 2026-11-12
- Owner: the picture was meant for the order cards only. Header (logo + KOLDE, Ootaeg, Statistika, Valmis, DEMO/LIVE), side menu and column heads are back exactly as in 17.40; the new card from 17.41 stays (`assets/ops-v1741.js/.css`).

## 17.41.0 — 2026-11-12
- Owner's picture of the main screen ("Давай сделаем вот так"). Header: "Kolde / Peetri Pizza" text instead of the logo, Ootaeg as a wide pill in the middle, status dot + clock + fullscreen on the right; Statistika / Valmis / DEMO-LIVE hidden from the header (elements kept) and reachable from the side menu (new items "Valmis tellimused" and "DEMO · vaheta LIVE peale" click the hidden buttons). Columns "Uued" / "Valmistamisel" with round counters. Card: white, no type stripe, outline handset + big name, meta row "#id | KAASA | N pitsat", soft time box (green; amber ≤5 min; red HILJA +N min / pidi; pre-order shows Täna/Homme + time, chip just ETTETELLIMUS), item rows qty | size | name with notes in grey and JUUST / ILMA as outlined chips, KARBID row with ⓘ (details) at its end, yellow Kliendi märkus, footer price | MAKSTUD | big green button; "Võta vastu" reads "Alusta valmistamist" (same button, same time sheet). Print mark and "saabus" hidden from the card (`assets/ops-v1741.js/.css`, small edits in `ops-v1728.js`, `ops-v1729.js`, `ops-v1725.js`).

## 17.40.0 — 2026-11-12
- Owner picked 1,2,3,4,6 (not the ticket logo). 1: `api/site-status.php` collects names from nested catalog answers (categories → items), keeps a nameless catalog only 5 min, `?debug=names` shows the answer shape (logged in, no secrets). 2: finished orders on Valmis styled like kitchen cards (`ops-v1740.js/.css`). 3: Taigna tellimine with a white sticky header (back, logo + location, clock), app buttons and history cards (`dough-v1740.css/.js`). 4: login in brand green with the square logo and wide pizzeria tile (`login-v1740.css`). 6: web app manifest + icons (home screen icon, green Android splash) and a 1-second green logo screen on load (fades by itself, not shown with reduced motion or Tahvli kiirrežiim). `tools/gen_patch.py` can ship binary files (base64).

## 17.39.0 — 2026-11-12
- Owner design pass ("ровно, в одном стиле, под бренд"): Tooted → "Kodulehel otsas" moved to the bottom and folded (tap the title, "N otsas · Näita"). Order details window like the card (no letter circle, no loud top badge, green phone chip, red-tinted ILMA chip). Statistika period tabs like Seaded tabs, Kaasa/Kulleriga/Kohapeal tiles tinted instead of solid colours. Side menu items one weight, footer shows the real version (was v17.15). Native selects styled. Valmis section title left. Taigna tellimine header uses the real logo and the location badge (`assets/ops-v1739.js/.css`, `assets/dough-v1739.css`, `dough.php`).

## 17.38.0 — 2026-11-12
- Owner: KOLDE centred under the logo, Uued/Töös counters hidden from the header (`#pp1722-counts`, element kept). Seaded → Köök: "Ekraani suurus" 80–130 % (A− / slider / A+ / tap the % to reset), CSS zoom on <html>, saved per tablet in localStorage `pp1738-zoom` (`assets/ops-v1738.js/.css`).

## 17.37.0 — 2026-11-12
- Owner: preparation time is chosen when a new order is accepted. "Võta vastu" opens a sheet (10–60 min, default = Ooteaeg); the card timer becomes now + N min. LIVE: `api/kitchen-status.php` takes optional `prep_minutes` (5–180) on new→active and stores `prep_minutes`/`prep_until` in the kitchen record (shared by tablets, never sent upstream); `live-status-v155.js` overlay uses it as the deadline until the order is done. DEMO: sets the demo order's deadline (`assets/ops-v1737.js/.css`).

## 17.36.0 — 2026-11-12
- Owner: green phone handset in front of the customer name ; the number is hidden until the handset is tapped, then shown next to the name (tap the number = call) (`assets/ops-v1736.js/.css`). No handset when the order has no phone.

## 17.35.0 — 2026-11-12
- Owner: "TOPELT JUUST" chip is now "JUUST", "Äär: juustuäär" is "Juustuäär" (app-core `pp178Parse`, + sign on card and ticket). Round initial at the name hidden. KOLDE under the Peetri Pizza logo. Fullscreen button in the header where the sound button was; sound on/off is a side-menu item that clicks the hidden `#soundBtn`. "Lõpeta vahetus" and the duplicate "Täisekraan" hidden from the menu (`assets/ops-v1735.js/.css`).

## 17.34.0 — 2026-11-12
- Owner: pizza lines ordered several at a time go first, then by size (Pere, Suur, Keskmine, Väike); same pizzas end up next to each other (`assets/ops-v1734.js`, DOM reorder only, LIVE/print untouched). Whole grain dough is shown as "FITLAP" (`pp178Parse` in app-core, also on the ticket). Customer phone sits right next to the name (`assets/ops-v1734.css`). Demo orders got phones and a Fitlap pizza.

## 17.33.0 — 2026-11-12
- Owner: print mark hidden on cards, the ILMA/allergy badge in the card header hidden (the "−" chip at the pizza stays), name 25 px with a round initial in the order-type colour (`assets/ops-v1733.js`), 18 px between order cards with a slightly stronger border and shadow (`assets/ops-v1733.css`).

## 17.32.0 — 2026-11-12
- Owner: payment chip moved to the sum in the card footer, "saabus" under the timer box, Kliendi märkus under the boxes (`assets/ops-v1732.js`, DOM move once per card). Additions / removals as round chips with a green "+" or red "−" badge, info (põhi, karp) quiet grey (`assets/ops-v1732.css`).

## 17.31.0 — 2026-11-12
- Owner: all size codes (SÕ, VÕ, SP, VP, Pere Õ/P, KÕ/KP) green with white text, also in details, Klienti ootavad and Väljastus (`assets/ops-v1731.css`). Thick-dough orange underline removed.

## 17.30.0 — 2026-11-12
- Owner picked 1, 2, 3, 6 (not Puhasta ekraan, not OTSAS on the card):
  1. "Klienti ootavad tellimused": copies decorated by `assets/ops-v1730.js` — type strip, type + payment chips, "ootab N min" (red from 15 min), bigger Üle antud. Buttons still forward to the real card (ops-v1711).
  2. 80 mm ticket (`assets/print-v169.js`): pizzas first, "LISAKS" for the rest, − / + on modifiers, KARBID moved under the products, "MAKSE: …" line. `late-v1714.js` version bumped so tablets reload the print module.
  3. Seaded → Köök → "Tellimuse kaart": switches for price, payment, print mark, summary, arrival time (localStorage `pp1730-card`, html.pp1730-no-*).
  6. Details sheet: time line saabus → vastu võetud → prinditud → valmis with minutes between steps (only the steps we know).

## 17.29.0 — 2026-11-12
- Order card pack 2 (owner: "Давай", all six), `assets/ops-v1729.js/css` + summary change in `ops-v1728.js`:
  1. Summary chip by size code: "1× SÕ · 2× VP · 1 lisa".
  2. Print mark in the card footer from PPPrintMonitor.record(id): "⎙ prinditud 13:05" (green) / "⎙ ei prinditud".
  3. Tap on the customer name folds the card to header + buttons (▸), again unfolds; remembered per order until reload.
  4. "ETTETELLIMUS · HH:MM" line when the official ready time is ≥ 90 min after the order arrived (no separate pre-order field known).
  5. Footer: small price, 40 px ⓘ, the action button takes the rest of the width.
  6. The Valmis sheet (17.24) lists "Ära unusta": non-pizza products and boxes.

## 17.28.0 — 2026-11-12
- Order cards clearer (owner: "Го все"), `assets/ops-v1728.js/css`, works on the DOM only (data, print, LIVE untouched); `html.pp1728-off` switches it off:
  1. Pizzas first; non-pizza lines (no size in the name) hidden and shown as one "Lisaks" row of chips.
  2. Timer box: "VALMIS / 13:22 / veel 17 min", late "HILJA / +3 min / pidi 13:22". Old label/timer only hidden, refreshTimers keeps running.
  3. Summary chip "3 pitsat · 1 lisa".
  4. Payment chip from `payment` (online/paid → MAKSTUD, cash → SULARAHA, card → KAART, other value shown as is). LIVE value of payment_type not yet seen on a real order.
  5. Modifiers: "ilma/vähem" get "−", "topelt/lisa/äär" and extras get "+" in green.
  6. KARBID / KOHAPEAL row moved to the bottom, above the buttons.

## 17.27.0 — 2026-11-12
- Calmer (owner: "как на ёлке все горит"), `assets/ops-v1727.css` only: no pulsing on Uued, new cards (plain orange border 10 s) or late cards (steady red border); type chips light with coloured text; sound-off flash is one soft thin blink; dough bar stays yellow, urgent = red title only.

## 17.26.0 — 2026-11-12
- Design pack 5, owner picked 1, 3, 5, 6 (not 2 queue numbers, not 4 empty screen) — `assets/ops-v1726.js/css`:
  1. Header sticky on every screen (`.shell>header.topbar.topbar.topbar` beats the old `position:relative!important`), 54 px with a shadow after 40 px of scroll.
  3. "Telli tainas!" reminder: a slim full-width bar at the bottom; the page gets 64 px bottom padding while it shows, so no card is covered.
  5. New order while sound is off or blocked (PPSound state not running): the screen frame flashes orange 3 times. Not during the first 8 s, not for more than 3 at once.
  6. Tooted: compact tiles (no category caption, no inner button, smaller icon), ~6 per row at 1280 px.

## 17.25.0 — 2026-11-12
- Design pack 4, owner picked 1, 2, 4, 5, 6 (`assets/ops-v1725.js/css`):
  1. Header: the Uued counter turns orange and pulses while a new order waits.
  2. A new order card slides in and glows orange for 10 s (not during the first 8 s after load, not when more than 3 arrive at once).
  4. Order details sheet: the card's name, number, type, boxes and products on top in big type; the office data small below; big Prindi + Võta vastu / Valmis buttons at the bottom (they press the card's own button, so the Valmis sheet still asks).
  5. Tooted: big counters, title and duplicate quick chips hidden; category tabs + search stick to the top while scrolling; the Otsas filter shows a red count.
  6. Line icons instead of emoji on cards, details, empty columns, dough reminder, Statistika and the sound button.
  Also: bigger text on 17.24 sheet buttons. Patches never touch CHANGELOG.md (not on the server).

## 17.24.0 — 2026-11-12
- Design pack 3, owner said "Давай" to all six (`assets/ops-v1724.js/css`):
  1. Late order: red frame around the whole card that slowly pulses (off in Tahvli kiirrežiim / reduced motion).
  2. Order type: the left strip of the card is the type colour (Kulleriga purple, Kaasa green, Kohapeal blue), the type chip filled in the same colour. Urgency stays in the timer box.
  3. Smooth move: after a tap on a card button the cards slide (FLIP) to their new place; a card that leaves the screen fades out.
  4. One toast: `window.toast` replaced; top centre, big, green / yellow / red by the words in the text, errors stay 5 s.
  5. Sheets: order details, share link, Lõpeta vahetus, print dialog, Ooteaeg tiles open from the bottom. `window.confirm` during a button click shows a bottom sheet instead of the browser window and re-clicks the same button on "Jah" (browser window froze timers and LIVE). Väljastus station unchanged. `html.pp1724-native-confirm` brings the browser window back.
  6. Statistika: tiles with coloured strip and bigger numbers, Kaasa/Kulleriga/Kohapeal as coloured tiles, green tabs.
  Tests not run (owner's choice); checked in Chromium at 1280 px.

## 17.23.0 — 2026-11-12
- Header: the separate LIVE plate from 17.22 is hidden (owner: "зачем вторая плашка live?"). The dot inside the DEMO|LIVE switch is now green / yellow / red; the LIVE button turns red after 3 min without data or without internet.
- Design pack 2, owner picked 1, 2, 5 (`assets/ops-v1723.js/css`):
  1. Card contents: bigger quantity chip and product name, size code coloured (Väike blue, Suur green, Pere purple), modifiers and extras on their own line.
  2. Order columns: orange (Uued) / green (Valmistamisel) strip on top and coloured counter; an empty column shows "Uusi tellimusi pole" / "Midagi ei valmistata".
  3. Tooted: big banner hidden, products as a tile grid; the whole tile is the button. First tap turns it orange ("Puuduta uuesti"), second tap within 4 s switches Otsas/Saadaval. Replaces the browser confirm() window that froze timers and LIVE. Out-of-stock tiles red and first. Still a local note only.
  Tests not run (owner's choice); checked in Chromium at 1280 px.

## 17.22.0 — 2026-11-12
- **Header** (owner: "Давай" = all six), `assets/ops-v1722.js/css`, loaded from `dashboard.php` (not late) so the header does not jump:
  1. LIVE status: green / orange / red dot with "uuendatud N s tagasi" (from `pp150:live-synced`); red and blinking after 3 min without data or with no internet. Hidden in DEMO (the DEMO|LIVE switch already says it).
  2. Counters Uued (blue, solid when there are new orders) and Töös (orange); Valmis button in green.
  3. Bigger clock (Tallinn time) with weekday and date.
  4. Ooteaeg as one big button; tap opens big tiles 15/20/30/45/60. It sets the same select and fires the same `change` event as before; the 17.18 hint makes the button orange.
  5. "TEENINDUS · KÖÖGI TÖÖLAUD" hidden; fullscreen button moved to the side menu ("Täisekraan").
  6. Phone: header in two rows, nothing falls out.
  Old header elements are only hidden. 17.21 tab font fixed (was a broken `font:` shorthand). Tests not run (owner's choice); checked in Chromium at 1280, 1024, 390 px.

## 17.21.0 — 2026-11-12
- **Seaded redesign** (owner picked design #6): four big tabs Köök · Heli · Printer · Süsteem instead of one 3700 px long column; the chosen tab is remembered on the tablet. Full width, equal white cards, Köök settings in two columns on the wide tablet, switches 30 % bigger, stepper/buttons/selects at least 50 px high, bigger checkboxes in Heli. Duplicate inner "Töölaua seaded / Seaded" heading hidden. No block removed: everything is only sorted and restyled (`assets/ops-v1721.js/css`, loaded by `late-v1714.js`). Tests not run (owner's choice); checked in Chromium at 1280×800 and 390×844.

## 17.20.0 — 2026-11-12
- **Login page on phones** (owner): no auto-focus on touch screens (the keyboard jumped up on load and covered the page); choosing a pizzeria scrolls to the password instead. Up to 600 px: pizzerias in one column without the inner scroll box (names were cut mid-word, "Mustamä e"), compact header, 16 px inputs (no iPhone zoom), safe-area padding, bigger submit button. New file `assets/login-v1720.css`. Tests not run (owner's choice); checked in Chromium as iPhone 13 / Pixel 5 / 360 px with 1 and 10 pizzerias.

## 17.19.0 — 2026-11-12
- **New Statistika** (owner: "first the day report, then month, choose all time, then charts and statistics"): on top a report with Täna · Eile · See kuu · Eelmine kuu · Kogu aeg — Tellimusi, Käive, Keskmine tšekk, Pitsasid, Keskmine valmimisaeg, Hilinenud, Kaasa/Kulleriga/Kohapeal, 🖨 Prindi (80 mm). Below: orders by hour, by day (by month for long periods), most popular products. DEMO shows only Täna (from the screen).
- `api/kitchen-analytics.php`: sync also takes amount (cents), service (k/d/h), pizza count and product counts (names only); daily totals in `private_data/analytics-days-<id>.json` are kept forever (the 35-day order list is unchanged), new periods month / lastmonth / all with a `report` object. Included in the daily backup.
- Old Statistika blocks (totals, Tellimuste näitajad, Tellimused ja pitsad, Päevaaruanne, Lõpeta vahetus, Köögi analüütika, Täna köögis) hidden; Lõpeta vahetus stays in the side menu.
- **Seaded** (owner): System Health, Köögitoimingute ajalugu, Ühendus ja LIVE, Andmed hidden (DOM kept, health checks still run).
- Owner asked to skip tests for now (12.11.2026); this release was still run: browser 35/35, API 129/129 (one test regex updated for the new backup file).

## 17.18.0 — 2026-11-12
- **Night screen** (owner picked #4): after closing time (today's hours from `api/site-status.php`, +30 min) and with no order in work, a dark full screen with a big clock and "Suletud · avame kell 11:00". A new order wakes it at once, a tap hides it for 15 min. Unknown hours = never dims. A web page cannot change the backlight, so the picture is only made dark.
- **Ooteaeg hint** (owner picked #6): 6+ orders in work → the Ooteaeg box turns orange with "Tõsta 30 min?" (10+ → 45). One tap saves through the normal Ooteaeg; ✕ hides it for 20 min. Never changes anything by itself.
- Statistika: "Päevaaruanne" and "Lõpeta vahetus" are visible again (owner asked).
- Files: `assets/ops-v1718.js/.css` (late loaded). Tests: browser 34/34.

## 17.17.0 — 2026-11-11
- **Allergies and "ilma …" in red** (owner picked #5 of the orders pack): words like allergia/pähkliallergia, gluteenivaba, laktoosivaba, piimavaba, vegan, vegetaar, "ilma <sõna>", "without <word>", "без <слово>", аллергия are marked red in the customer note and in product lines; the card gets a red frame and a badge "⚠ PÄHKLIALLERGIA · ILMA SIBULATA" next to the number. The 80 mm ticket gets a black box with the same words under KARBID. `window.PPAlert {find, mark}` in app-core, styles appended to card-v177.css (no extra request). Marks are applied when a card is built, so kept cards (17.16) keep them.
- Tests: browser 32/32 (+1), API 119/119.

## 17.16.0 — 2026-11-11
- **LIVE without needless redraws**: `renderOrders()` keeps the DOM node of every card whose order data did not change (`pp1716Patch` in app-core); only new or changed orders get a new card, removed ones go away, order is kept. Timers still tick via `refreshTimers()`. The "UUS" mark is taken off after 45 s (cards now live longer). `html.pp1716-full-render` switches back to the old full innerHTML way.
- **Tablet picks up a new version by itself**: `api/release.php` (login, returns only the version) is asked every 5 min; when the server is newer a yellow bar shows and the page reloads as soon as no order is in Uued/Valmistamisel, no dialog/typing, Tellimused view. LIVE is switched back on after the reload (sessionStorage `pp1716-resume`). Sound needs one tap after any reload (Chrome rule; the existing sound bar asks for it).
- **Night reload**: once a day 05:00–05:30 Tallinn, only if the page was open 6 h+ and the same "nothing in work" rule holds.
- **Daily data copy**: `api/backup.php` copies this pizzeria's internal-status, pickup, dough, wait, print-log, analytics files to `private_data/backups/<id>/<date>/` once a day (on the first tablet call), keeps 14 days. Seaded → "Andmete varukoopia": pick a copy → "Taasta valitud" (asks first; the current state is saved as `<date>-enne` so a restore can be undone). Per-file locks are respected.
- **LIVE silent 3 min**: red blinking bar on top + "offline" sound once a minute ("🔇 10 min" mutes the sound, the bar stays; "↻ Proovi uuesti"). Only in LIVE and while the screen is on.
- The old "↻ Reaalsed tellimused" button is hidden (still in the page: the DEMO|LIVE switch clicks it). "Lukusta menüü" is already in Seaded since 17.6.
- **Statistika** (owner's request): "Täna köögis" with "Karbid täna", "Köögi analüütika", "Päevaaruanne" and the "Lõpeta vahetus" button are hidden (CSS only, the blocks stay in the DOM; Lõpeta vahetus remains in the side menu). Remaining: totals, Tellimuste näitajad, Tellimused ja pitsad.
- Tests: API 119/119 (+17 backup/release checks), browser 31/31 (+5; the 17.4 "changed data" test now expects unchanged cards to stay).

## 17.15.0 — 2026-11-11
- **Faster load**: the page now uses `kitchen-release-v1715.css` (322 → 302 KB, gzip 59 → 51 KB): overridden duplicate declarations and never-matching selectors removed by `tools/css-prune.py`. Computed styles of every element compared with the original on 8 screens × 3 sizes (1280, 800, 390 px): identical. The original v166 file stays on the server.
- Settings-only modules (print-v169, operations-v168, health-v169, ops-v1710) load after first paint via `late-v1714.js`.
- **One permanent update command**: Seaded → Versioon shows `curl …/main/patches/update-latest-ssh.txt … && bash …` with a copy button. The GitHub workflow now also writes `patches/update-latest-ssh.txt` (= update-any-to-<new>) and attaches it to the Release; it no longer fails when the patch was already committed.
- Family pizza chip now reads "Pere Õ" (thin) / "Pere P" (thick), owner's wording (was PÕ/PP). Keskmine stays KÕ/KP.
- (Ahju nimekiri was built and removed again at the owner's request: the kitchen decides itself what goes in the oven.)

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
