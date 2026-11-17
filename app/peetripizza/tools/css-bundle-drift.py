#!/usr/bin/env python3
"""Read-only CSS generated/source drift audit.

Reports structural differences before any cleanup. Does not rebuild, delete,
or change CSS or data. Generated CSS may intentionally contain additions:
every flagged section must be reviewed, not auto-overwritten.
"""
from pathlib import Path
import re
import sys

ASSETS = Path(__file__).resolve().parent.parent / "assets"
SECTION = re.compile(r"/\* == assets/([^=]+?\.css) == \*/")


def uncomment(css):
    """Mirror css-bundle.py's quote-aware CSS comment remover."""
    result = []
    i = 0
    quote = None
    while i < len(css):
        char = css[i]
        if quote:
            result.append(char)
            if char == "\\" and i + 1 < len(css):
                i += 1
                result.append(css[i])
            elif char == quote:
                quote = None
        elif char in ("'", '"'):
            quote = char
            result.append(char)
        elif css.startswith("/*", i):
            end = css.find("*/", i + 2)
            i = len(css) if end < 0 else end + 2
            continue
        else:
            result.append(char)
        i += 1
    return "".join(result)


def inspect(bundle):
    path = ASSETS / bundle
    if not path.is_file():
        return [f"MISSING BUNDLE {bundle}"], 0
    content = path.read_text(encoding="utf-8")
    markers = list(SECTION.finditer(content))
    differences = []
    for i, marker in enumerate(markers):
        name = marker.group(1).strip()
        if name.startswith("/") or ".." in Path(name).parts or Path(name).name != name:
            differences.append(f"{bundle}: invalid source name")
            continue
        original = ASSETS / name
        if not original.is_file():
            differences.append(f"{bundle}: missing source {name}")
            continue
        start = marker.end()
        stop = markers[i + 1].start() if i + 1 < len(markers) else len(content)
        embedded = content[start:stop].strip()
        expected = uncomment(original.read_text(encoding="utf-8")).strip()
        if embedded != expected:
            differences.append(f"{bundle}: SOURCE DRIFT {name}")
    return differences, len(markers)


def main():
    total = 0
    issues = []
    for bundle in ("app-v1748.css", "app-v1767.css"):
        found, count = inspect(bundle)
        total += count
        issues.extend(found)
        print(f"{bundle}: {count} sections, {len(found)} differences")
    for issue in issues:
        print("REVIEW:", issue)
    print(f"{total} sections checked; no CSS was modified.")
    if issues:
        print("DO NOT rebuild or remove duplicates until source drift is reviewed.")
        return 1
    print("PASS: generated and source CSS segments match.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
