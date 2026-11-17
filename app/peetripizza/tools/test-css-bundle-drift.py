#!/usr/bin/env python3
"""Isolated unit tests for CSS bundle drift checker, no app data used."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "css_bundle_drift", Path(__file__).with_name("css-bundle-drift.py")
)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class CssBundleDriftTests(unittest.TestCase):
    def test_quote_aware_comment_removal(self):
        source = '/* heading */ .x{content:"/* literal */";color:red}'
        output = audit.uncomment(source)
        self.assertIn('"/* literal */"', output)
        self.assertNotIn("heading", output)

    def test_matching_sources_are_ok(self):
        with TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / "a.css").write_text("/* head */\n.x{color:red}")
            (p / "app-v1748.css").write_text(
                "/* == assets/a.css == */\n.x{color:red}\n")
            with patch.object(audit, "ASSETS", p):
                issues, count = audit.inspect("app-v1748.css")
            self.assertEqual(count, 1)
            self.assertEqual(issues, [])

    def test_generated_additions_must_be_reviewed(self):
        with TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / "a.css").write_text(".x{color:red}")
            (p / "app-v1767.css").write_text(
                "/* == assets/a.css == */\n.x{color:red}"
                "\n.drawer nav small{margin-left:auto}\n")
            with patch.object(audit, "ASSETS", p):
                issues, count = audit.inspect("app-v1767.css")
            self.assertEqual(count, 1)
            self.assertTrue(any("SOURCE DRIFT a.css" in x for x in issues))

    def test_missing_source_is_reported(self):
        with TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / "app-v1748.css").write_text(
                "/* == assets/missing.css == */\n.x{color:red}")
            with patch.object(audit, "ASSETS", p):
                issues, count = audit.inspect("app-v1748.css")
            self.assertEqual(count, 1)
            self.assertTrue(any("missing source" in x for x in issues))


if __name__ == "__main__":
    unittest.main()
