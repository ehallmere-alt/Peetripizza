#!/usr/bin/env python3
"""Read-only guard for heartbeat source/bundle contract.

Uses only repository files. Does not send heartbeat, access LIVE,
read customer data, change device IDs, or modify files.
"""
import re
from pathlib import Path
from unittest import TestCase, main

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/ops-v1749.js"
BUNDLE = ROOT / "assets/app-b-v1767.js"
NAME = "ops-v1749.js"
PATTERN = re.compile(
    r"/\* == assets/ops-v1749\.js == \*/\n"
    r"try\{\(function\(\)\{\n(.*?)\n"
    r"\}\)\.call\(window\);\}catch\(e\)\{setTimeout\(function\(\)\{throw e\},0\);\}",
    re.DOTALL,
)


class HeartbeatContract(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SOURCE.read_text(encoding="utf-8").rstrip()
        cls.bundle = BUNDLE.read_text(encoding="utf-8")

    def test_heartbeat_source_matches_active_bundle(self):
        match = PATTERN.search(self.bundle)
        self.assertIsNotNone(match, "Heartbeat bundle section missing")
        self.assertEqual(self.source, match.group(1))

    def test_timestamp_tracks_successful_live_sync_only(self):
        self.assertIn("window.addEventListener('pp150:live-synced'", self.source)
        self.assertIn("e.detail?.lastSuccess", self.source)
        self.assertIn("window.addEventListener('pp150:live-stopped'", self.source)
        self.assertNotIn("window.addEventListener('pp145:orders'", self.source)

    def test_heartbeat_payload_not_extended_with_order_data(self):
        self.assertIn("fetch('api/heartbeat.php'", self.source)
        self.assertIn("live_at:liveAt", self.source)
        self.assertNotRegex(
            self.source,
            r"(?:body:JSON\.stringify\(|live_at:liveAt)[^\n]*(?:customerName|customerPhone|items:)",
        )


if __name__ == "__main__":
    main()
