# Deploy v16.9.1 over v16.8

1. Back up the current site directory plus `private_data`, `peetri_staff_auth.php`, and `peetri_locations.php` (the last two are installed outside the app).
2. Extract all ZIP entries over the existing app directory and overwrite matching files; **do not clean old files during this release**.
3. Run `php tools/release-check.php` inside the deployed app folder. Refresh without browser cache.
4. Test login/session, kitchen orders and LIVE, 58/80mm manual printing, optional auto-print and queue on the physical printer, dough creation/edit/status/history/calendar, System Health, and the official `Boonused` link.
5. Test that `/private_data/` URLs are forbidden by your webserver configuration (Apache .htaccess only; Nginx requires own rules). The Health panel cannot prove HTTP blocking.

No silent print guarantee, no physical print confirmation, and no supplier/official order write integration.
