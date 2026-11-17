#!/usr/bin/env python3
"""Self-contained tests for bundle-drift.py (temporary fixtures only)."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "bundle_drift", Path(__file__).with_name("bundle-drift.py")
)
drift = importlib.util.module_from_spec(spec)
spec.loader.exec_module(drift)


def bundle_code(source):
    return ("/* == assets/s.js == */\ntry{(function(){\n" + source +
            "\n}).call(window);}catch(e){setTimeout(function(){throw e},0);}\n")


class DriftTests(TestCase):
    def test_matching_source(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "s.js").write_text("console.log(1);")
            (root / "app-a-v1767.js").write_text(bundle_code("console.log(1);"))
            with patch.object(drift, "ASSETS", root):
                count, errors = drift.check_bundle("app-a-v1767.js")
            self.assertEqual((count, errors), (1, []))

    def test_source_changed_after_bundle(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "s.js").write_text("console.log(2);")
            (root / "app-b-v1767.js").write_text(bundle_code("console.log(1);"))
            with patch.object(drift, "ASSETS", root):
                count, errors = drift.check_bundle("app-b-v1767.js")
            self.assertEqual(count, 1)
            self.assertTrue(any("SOURCE DRIFT s.js" in e for e in errors))

    def test_malformed_wrapper_fails_closed(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "app-a-v1767.js").write_text(
                "/* == assets/s.js == */\nno wrapper\n"
            )
            with patch.object(drift, "ASSETS", root):
                count, errors = drift.check_bundle("app-a-v1767.js")
            self.assertEqual(count, 0)
            self.assertTrue(any("unknown bundle format" in e for e in errors))


if __name__ == "__main__":
    main()
