#!/usr/bin/env python3
"""Unit tests for conservative, @media-aware CSS duplication inventory."""
from pathlib import Path
import importlib.util
import unittest

spec = importlib.util.spec_from_file_location(
    "css_duplicate_candidates",
    Path(__file__).with_name("css-duplicate-candidates.py")
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DuplicateCandidatesTests(unittest.TestCase):
    def test_top_level_repeat(self):
        source = ".a{color:red}.b{color:blue}.a{color:red}"
        repeats = module.inventory(source)
        self.assertEqual(len(repeats), 1)
        self.assertEqual(repeats[0][0], ".a")
        self.assertEqual(repeats[0][1], "color:red")
        self.assertEqual(repeats[0][3], ())

    def test_different_values_are_not_identical(self):
        self.assertEqual(module.inventory(".a{color:red}.a{color:blue}"), [])

    def test_css_comment_is_ignored(self):
        source = "/* .a{color:red} */ .a{color:red}"
        self.assertEqual(module.inventory(source), [])

    def test_different_media_contexts_are_not_merged(self):
        source = (
            ".a{color:red}"
            "@media(max-width:600px){.a{color:red}}"
            "@media(min-width:601px){.a{color:red}}"
        )
        self.assertEqual(module.inventory(source), [])

    def test_same_media_context_can_be_reported(self):
        source = (
            "@media(max-width:600px){.a{color:red}.a{color:red}}"
        )
        repeats = module.inventory(source)
        self.assertEqual(len(repeats), 1)
        self.assertEqual(repeats[0][3], ("@media(max-width:600px)",))

    def test_quoted_braces_do_not_close_rules(self):
        source = '.x{content:"}"} .x{content:"}"}'
        self.assertEqual(len(module.inventory(source)), 1)


if __name__ == "__main__":
    unittest.main()
