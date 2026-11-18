#!/usr/bin/env python3
"""Read-only contract checks for the existing audio module.

These tests do not create AudioContext, play sounds, call LIVE APIs,
or modify application code. They guard against rebuilding from stale sources.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parent.parent / "assets"


def section(bundle_name, module_name):
    full = (ROOT / bundle_name).read_text(encoding="utf-8")
    marker = "/* == assets/" + module_name + " == */\ntry{(function(){\n"
    start = full.find(marker)
    if start < 0:
        raise AssertionError("Embedded module not found: " + module_name)
    start += len(marker)
    end_marker = ("\n}).call(window);}catch(e)"
                  "{setTimeout(function(){throw e},0);}")
    end = full.find(end_marker, start)
    if end < 0:
        raise AssertionError("Embedded module boundary not found: " + module_name)
    return full[start:end]


class AudioSourceParity(unittest.TestCase):
    def test_sources_match_live_bundle_sections(self):
        cases = [
            ("app-a-v1767.js", "sound-v141.js"),
            ("app-b-v1767.js", "kitchen-v155.js"),
            ("app-b-v1767.js", "kitchen-v156.js"),
            ("app-b-v1767.js", "ops-v1735.js"),
        ]
        for bundle, module in cases:
            with self.subTest(module=module):
                standalone = (ROOT / module).read_text(
                    encoding="utf-8").rstrip()
                self.assertEqual(standalone, section(bundle, module))

    def test_audio_api_remains_present(self):
        script = (ROOT / "sound-v141.js").read_text(encoding="utf-8")
        self.assertIn("window.PPSound", script)
        for method in ("play", "unlock", "preview", "diagnostics"):
            self.assertRegex(script, r"\b" + method + r"\b")
        self.assertIn("reliableCtx", script)

    def test_no_new_network_code_in_sound_module(self):
        script = (ROOT / "sound-v141.js").read_text(encoding="utf-8")
        self.assertNotRegex(script, r"\bfetch\s*\(")
        self.assertNotRegex(script, r"\bXMLHttpRequest\b")


if __name__ == "__main__":
    unittest.main()
