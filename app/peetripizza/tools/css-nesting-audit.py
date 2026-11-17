#!/usr/bin/env python3
"""Read-only nested CSS bundle map for Peetri Pizza.

The stylesheet shipped as app-v1767.css embeds app-v1748.css, which itself
embeds older CSS sections. This tool maps both levels without changing CSS,
fetching customer data, or accessing a live service.
"""
from pathlib import Path
import re
import sys

ASSETS = Path(__file__).resolve().parent.parent / "assets"
MARKER = re.compile(r"/\* == assets/([^=]+?\.css) == \*/")


def sections(text):
    points = list(MARKER.finditer(text))
    return [
        (match.group(1), text[match.end():
            points[i + 1].start() if i + 1 < len(points) else len(text)])
        for i, match in enumerate(points)
    ]


def inspect(name, level=0, ancestry=()):
    if name in ancestry:
        print("ERROR: nested CSS cycle: " + " -> ".join(ancestry + (name,)))
        return 1
    target = ASSETS / name
    if not target.is_file():
        print("ERROR: missing CSS file:", name)
        return 1
    content = target.read_text(encoding="utf-8", errors="replace")
    parts = sections(content)
    indent = "  " * level
    print(f"{indent}{name}: {len(content):,} characters, "
          f"{content.count('!important'):,} !important tokens, "
          f"{len(parts)} embedded sections")
    errors = 0
    if not parts:
        return errors
    for child, body in parts:
        print(f"{indent}  section {child}: "
              f"{len(body):,} characters, "
              f"{body.count('!important'):,} !important tokens")
        # Only expand an embedded child when it itself contains section markers.
        nested_path = ASSETS / child
        if nested_path.is_file():
            nested = nested_path.read_text(encoding="utf-8", errors="replace")
            if MARKER.search(nested):
                errors += inspect(child, level + 1, ancestry + (name,))
        else:
            print(f"{indent}  REVIEW missing source file: {child}")
            errors += 1
    return errors


def main():
    print("Read-only CSS structure inventory; counts are static, not browser cascade results.")
    result = inspect("app-v1767.css")
    print("No CSS files were modified. Do not delete/reorder rules without browser tests.")
    return 1 if result else 0


if __name__ == "__main__":
    sys.exit(main())
