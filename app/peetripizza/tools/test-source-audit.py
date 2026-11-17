#!/usr/bin/env python3
"""Unit tests for read-only source-audit.py (no app files are modified)."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "source_audit", Path(__file__).with_name("source-audit.py")
)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class AssetAuditTests(unittest.TestCase):
    def test_only_real_runtime_asset_tags_are_collected(self):
        parser = audit.Assets()
        parser.feed("""
            <!-- <link rel="stylesheet" href="assets/old.css">
                 <script src="assets/legacy.js"></script> -->
            <link rel="stylesheet" href="assets/current.css?v=1">
            <script src="assets/current.js?v=5"></script>
        """)
        self.assertEqual(parser.css, ["assets/current.css?v=1"])
        self.assertEqual(parser.js, ["assets/current.js?v=5"])

    def test_non_stylesheet_and_inline_scripts_are_skipped(self):
        parser = audit.Assets()
        parser.feed("""
            <link rel="icon" href="assets/favicon.svg">
            <style>body{color:red}</style>
            <script>const x = 1;</script>
            <link href="assets/app.css" rel="stylesheet" />
        """)
        self.assertEqual(parser.css, ["assets/app.css"])
        self.assertEqual(parser.js, [])

    def test_local_asset_path_and_cache_busting(self):
        self.assertEqual(
            audit.asset_path("assets/app-v1767.css?v=18.1"),
            "assets/app-v1767.css"
        )

    def test_path_traversal_or_external_url_rejected(self):
        for value in (
            "../config.php", "assets/../config.php",
            "/assets/app.js", "https://example.org/assets/app.js"
        ):
            with self.subTest(value=value):
                self.assertIsNone(audit.asset_path(value))


if __name__ == "__main__":
    unittest.main()
