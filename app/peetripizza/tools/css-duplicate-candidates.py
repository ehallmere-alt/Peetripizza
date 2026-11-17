#!/usr/bin/env python3
"""Read-only, conservative duplicate-CSS inventory.

Detect repeated identical simple selector/declaration signatures. Never
auto-delete them: intervening rules and @media contexts can make repeats
necessary. Reports locations as review candidates, not safe deletions.
"""
from collections import defaultdict
from pathlib import Path
import re
import sys

CSS = Path(__file__).resolve().parent.parent / "assets/app-v1767.css"


def inventory(source):
    # Heuristic: ignore CSS comments. Do not parse braces in strings, :is(),
    # @supports, @media, nested selectors or keyframes as safe equivalences.
    cleaned = re.sub(r"/\*[\s\S]*?\*/", lambda m: " " * len(m.group()), source)
    signatures = defaultdict(list)
    for m in re.finditer(r"([^{}]+)\{([^{}]+)\}", cleaned):
        selector = " ".join(m.group(1).split())
        body = " ".join(m.group(2).split())
        if not selector or not body or selector.startswith("@"):
            continue
        signatures[(selector, body)].append(m.start())
    return [
        (selector, body, offsets)
        for (selector, body), offsets in signatures.items()
        if len(offsets) > 1
    ]


def main():
    if not CSS.is_file():
        print("ERROR: CSS bundle missing")
        return 2
    source = CSS.read_text(encoding="utf-8", errors="replace")
    repeats = sorted(inventory(source), key=lambda row: (-len(row[2]), row[0]))
    print("Repeated selector+declaration signatures:", len(repeats))
    for selector, body, locations in repeats[:40]:
        lines = [source.count("\n", 0, p) + 1 for p in locations]
        print(f"{len(locations)}x line(s) {lines}: {selector[:130]}")
        print("   body:", body[:90])
    print("These are review candidates, NOT proven redundant CSS.")
    print("Do not delete without checking at-rule context and computed styles.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
