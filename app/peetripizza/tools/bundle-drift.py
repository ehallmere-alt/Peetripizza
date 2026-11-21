#!/usr/bin/env python3
"""Compare bundled JS sections with their original source files, without writes.

Run: python3 tools/bundle-drift.py
Only compares assets/app-a-v1767.js and assets/app-b-v1767.js to embedded
assets/*.js sources. Does not rebuild anything or touch LIVE/order data.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
BUNDLES = ("app-a-v1767.js", "app-b-v1767.js")

# Matches the exact wrapper currently emitted by tools/js-bundle.js.
BLOCK = re.compile(
    r"/\* == assets/(?P<file>[^=]+?) == \*/\n"
    r"try\{\(function\(\)\{\n(?P<code>.*?)\n"
    r"\}\)\.call\(window\);\}catch\(e\)\{setTimeout\(function\(\)\{throw e\},0\);\}",
    re.DOTALL,
)
MARKER = re.compile(r"/\* == assets/([^=]+?) == \*/")


def check_bundle(bundle_name):
    bundle = ASSETS / bundle_name
    if not bundle.is_file():
        return 0, [f"MISSING BUNDLE: {bundle_name}"]
    source = bundle.read_text(encoding="utf-8", errors="replace")
    found = list(BLOCK.finditer(source))
    markers = MARKER.findall(source)
    errors = []
    if len(found) != len(markers):
        errors.append(
            f"{bundle_name}: {len(markers)} markers but "
            f"{len(found)} recognized blocks; unknown bundle format"
        )

    for match in found:
        name = match.group("file").strip()
        if Path(name).name != name or "/" in name or "\\" in name:
            errors.append(f"{bundle_name}: invalid embedded path")
            continue
        original = ASSETS / name
        if not original.is_file():
            errors.append(f"{bundle_name}: missing source {name}")
            continue
        actual = original.read_text(encoding="utf-8", errors="replace").rstrip()
        if match.group("code") != actual:
            # Do not print source excerpts, only file paths/lengths.
            errors.append(f"{bundle_name}: SOURCE DRIFT {name}")

    print(f"{bundle_name}: {len(found)} modules, "
          f"{len(errors)} structural/drift problem(s)")
    return len(found), errors


def main():
    total = 0
    all_errors = []
    for bundle in BUNDLES:
        count, errors = check_bundle(bundle)
        total += count
        all_errors.extend(errors)
    print("Modules inspected:", total)
    if all_errors:
        for item in all_errors:
            print("REVIEW:", item)
        print("DO NOT rebuild or deploy until drift is reconciled.")
        return 1
    print("PASS: bundle/source sections match. No files were changed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
