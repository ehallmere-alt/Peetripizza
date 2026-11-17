#!/usr/bin/env python3
"""Tests for the CSS source map. Uses strings only, never reads production."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    "css_nesting", Path(__file__).with_name("css-nesting-audit.py")
)
css = importlib.util.module_from_spec(spec)
spec.loader.exec_module(css)


class CssNestingTests(unittest.TestCase):
    def test_section_order_is_preserved(self):
        input_css = (
            "/* preface */\n"
            "/* == assets/one.css == */\n.a{color:red}\n"
            "/* == assets/two.css == */\n.a{color:blue}\n"
        )
        parts = css.sections(input_css)
        self.assertEqual([p[0] for p in parts], ["one.css", "two.css"])
        self.assertIn("red", parts[0][1])
        self.assertIn("blue", parts[1][1])
        self.assertNotIn("blue", parts[0][1])

    def test_non_css_markers_ignored(self):
        text = (
            "/* == assets/app.js == */\n"
            "/* == assets/one.css == */\n.x{display:block}"
        )
        self.assertEqual(len(css.sections(text)), 1)

    def test_empty_css_has_no_sections(self):
        self.assertEqual(css.sections(".x { color: red; }"), [])


if __name__ == "__main__":
    unittest.main()
