<?php
// DEV TEST HARNESS ONLY. Never deploy. Active only under `php -S` (cli-server).
// Fakes a logged-in kitchen session so the dashboard can be tested without real credentials.
if (PHP_SAPI === 'cli-server') {
    session_name('PEETRI_STAFF');
    session_id('peetridevtestsession01');
    session_start();
    $_SESSION['pp_pizzeria'] = ['id' => 99, 'name' => 'Test'];
    $_SESSION['pp_staff'] = 'Test';
    $_SESSION['pp_logged_in'] = $_SESSION['pp_logged_in'] ?? time();
    $_SESSION['pp_last_seen'] = time();
}
