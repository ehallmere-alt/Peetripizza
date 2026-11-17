#!/usr/bin/env python3
"""Read-only CSS cascade inventory; flags hot spots without deleting rules.

Usage: python3 tools/css-cascade-inventory.py
This is a heuristic report, not a full CSS parser or proof of conflicting rules.
"""
from collections import Counter
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "assets/app-v1767.css"

def main():
    if not CSS.is_file():
        print("ERROR: CSS bundle absent")
        return 2
    data = CSS.read_text(encoding="utf-8", errors="replace")
    sections = list(re.finditer(
        r"/\* == assets/([^=]+\.css) == \*/", data))
    print("CSS source sections:", len(sections))
    print("CSS bytes:", CSS.stat().st_size)
    print("!important tokens (includes comments/strings):", data.count("!important"))
    print("Select DOM targets frequently overridden (approximate counts):")
    targets = [
        ".pp112-done-card", ".pp177-mod", ".pp155-share-btn",
        "#doneOrders", "#ordersPage", ".pp117-ticket",
        ".pp112-customer", ".pp1728-minus", ".pp1728-plus"
    ]
    for target in targets:
        count = len(re.findall(re.escape(target) + r"(?![\w-])", data))
        print(f"  {target}: {count}")
    print("Top source sections by !important occurrence:")
    counts = []
    for index, match in enumerate(sections):
        end = sections[index + 1].start() if index + 1 < len(sections) else len(data)
        section = data[match.start():end]
        counts.append((match.group(1), len(section), section.count("!important")))
    for name, length, n_important in sorted(
            counts, key=lambda row: row[2], reverse=True)[:10]:
        print(f"  {name}: {n_important} !important, {length} characters")

    markers = Counter(x.group(1) for x in sections)
    for name, occurrences in sorted(markers.items()):
        if occurrences > 1:
            print(f"REVIEW duplicate section marker: {name} ({occurrences})")
    print("No styles were changed; use browser computed-style checks before removal.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
