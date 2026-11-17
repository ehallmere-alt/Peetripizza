#!/usr/bin/env python3
"""Read-only CSS repeat candidates, separated by @media/@supports context.

A small source scanner, not a CSS cascade or specificity validator. A repeat
is only a candidate for manual review. This script never changes CSS.
"""
from collections import defaultdict
from pathlib import Path
import sys

CSS = Path(__file__).resolve().parent.parent / "assets/app-v1767.css"


def _blocks(source):
    """Emit (selector, body, enclosing_at_rules, offset) for simple rule blocks."""
    stack = []  # mutable block descriptors; nested blocks are not emitted
    token_start = 0
    i = 0
    quote = None
    comment = False
    escaped = False
    while i < len(source):
        ch = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ""
        if comment:
            if ch == "*" and nxt == "/":
                comment = False
                i += 2
            else:
                i += 1
            continue
        if quote:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == quote:
                quote = None
            i += 1
            continue
        if ch == "/" and nxt == "*":
            comment = True
            i += 2
            continue
        if ch in ("'", '"'):
            quote = ch
            i += 1
            continue
        if ch == "{":
            header = source[token_start:i].strip()
            # A block may begin inside a declaration; context is derived from
            # enclosing headers, not assumed by regex matching nested braces.
            ancestors = tuple(entry[0] for entry in stack if entry[0].startswith("@"))
            if stack:
                stack[-1]["nested"] = True
            stack.append({"header": header, "body_start": i + 1,
                          "offset": token_start, "ancestors": ancestors,
                          "nested": False})
            token_start = i + 1
        elif ch == "}":
            if stack:
                entry = stack.pop()
                header = entry["header"]
                body = source[entry["body_start"]:i].strip()
                if header and not header.startswith("@") and not entry["nested"]:
                    yield header, body, entry["ancestors"], entry["offset"]
            token_start = i + 1
        elif ch == ";" and not stack:
            token_start = i + 1
        i += 1


def inventory(source):
    signatures = defaultdict(list)
    for selector, body, context, offset in _blocks(source):
        # Preserve strings, case and declaration order. Normalize only
        # inter-token whitespace for locating candidates.
        s = " ".join(selector.split())
        b = " ".join(body.split())
        if s and b:
            signatures[(context, s, b)].append(offset)
    return [
        (selector, body, offsets, context)
        for (context, selector, body), offsets in signatures.items()
        if len(offsets) > 1
    ]


def main():
    if not CSS.is_file():
        print("ERROR: CSS bundle missing")
        return 2
    source = CSS.read_text(encoding="utf-8", errors="replace")
    hits = sorted(inventory(source), key=lambda item: (-len(item[2]), item[0]))
    print("Exact repeat candidates in SAME @-rule context:", len(hits))
    for selector, body, positions, context in hits[:40]:
        linenos = [source.count("\n", 0, pos) + 1 for pos in positions]
        print(f"{len(positions)}x lines {linenos}: {selector[:140]}")
        print("  context:", " / ".join(context) if context else "top-level")
        print("  body:", body[:100])
    print("No style was modified. Repeats are not proof of redundancy.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
