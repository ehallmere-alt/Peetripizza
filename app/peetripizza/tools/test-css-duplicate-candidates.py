#!/usr/bin/env python3
"""Unit checks for conservative duplicate CSS inventory."""
from pathlib import Path
import importlib.util
import unittest

location = Path(__file__).with_name("css-duplicate-candidates.py")
spec = importlib.util.spec_from_file_location("css_duplicate_candidates", location)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DuplicateCandidatesTests(unittest.TestCase):
    def test_repeat_detected_without_modification(self):
        original = ".a{color:red}\n.b{color:blue}\n.a{color:red}\n"
        duplicates = module.inventory(original)
        self.assertEqual(len(duplicates), 1)
        self.assertEqual(duplicates[0][0], ".a")
        self.assertEqual(duplicates[0][1], "color:red")
        self.assertEqual(original.count(".a{color:red}"), 2)

    def test_differing_declarations_are_not_identical(self):
        self.assertEqual(module.inventory(".a{color:red}.a{color:blue}"), [])

    def test_css_comments_are_not_parsed_as_rules(self):
        content = "/* .a{color:red} */ .a{color:red}"
        self.assertEqual(module.inventory(content), [])


if __name__ == "__main__":
    unittest.main()
