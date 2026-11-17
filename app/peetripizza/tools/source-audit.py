#!/usr/bin/env python3
"""Read-only static inventory of runtime assets in the Peetri Pizza dashboard.

Ignores links inside HTML comments, does not read orders, execute JS/PHP,
make network requests, modify files, or touch production state.
Usage: python3 tools/source-audit.py
"""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
DASH = ROOT / "dashboard.php"


class Assets(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.css = []
        self.js = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "link" and "stylesheet" in (values.get("rel") or "").lower().split():
            uri = values.get("href") or ""
            if uri:
                self.css.append(uri)
        if tag == "script":
            uri = values.get("src") or ""
            if uri:
                self.js.append(uri)


def asset_path(uri):
    path = urlsplit(uri).path
    parts = Path(path).parts
    if not path.startswith("assets/") or ".." in parts:
        return None
    return path


def audit():
    if not DASH.is_file():
        print("ERROR: dashboard.php missing", file=sys.stderr)
        return 2

    parser = Assets()
    parser.feed(DASH.read_text(encoding="utf-8", errors="replace"))
    print("Peetri Pizza static source audit — no writes/no LIVE calls")
    print(f"Runtime CSS links: {len(parser.css)}")
    print(f"Runtime JS scripts: {len(parser.js)}")
    errors = []

    for kind, uris in [("CSS", parser.css), ("JS", parser.js)]:
        normalized = [asset_path(uri) for uri in uris]
        for uri, path in zip(uris, normalized):
            if path is None:
                # Remote assets and dynamic URLs need separate review.
                print(f"NOTICE {kind}: external or non-assets reference: {uri[:100]}")
                continue
            if not (ROOT / path).is_file():
                errors.append(f"Missing referenced {kind}: {path}")
        duplicates = Counter(p for p in normalized if p)
        for p, count in sorted(duplicates.items()):
            if count > 1:
                errors.append(f"Duplicate runtime {kind}: {p} ({count} times)")

    for bundle in ("assets/app-v1767.css", "assets/app-a-v1767.js",
                   "assets/app-b-v1767.js"):
        path = ROOT / bundle
        if not path.is_file():
            errors.append(f"Bundle missing: {bundle}")
            continue
        source = path.read_text(encoding="utf-8", errors="replace")
        module_names = re.findall(
            r"/\*\s*==\s*assets/([^=]+?)\s*==\s*\*/", source
        )
        print(f"{bundle}: {len(source):,} characters, "
              f"{len(module_names)} embedded source sections")
        if bundle.endswith(".css"):
            print(f"  !important occurrences: {source.count('!important'):,}")
        else:
            print(f"  MutationObserver tokens: "
                  f"{len(re.findall(r'\bnew\s+MutationObserver\b', source))}")
            print(f"  setInterval calls: "
                  f"{len(re.findall(r'\bsetInterval\s*\(', source))}")

    manifest = ROOT / "tools/release-manifest.php"
    if manifest.exists():
        text = manifest.read_text(encoding="utf-8", errors="replace")
        version = re.search(r"Auto-generated\s+([0-9.]+)", text)
        print("Manifest header:", version.group(1) if version else "unrecognized")
        print("NOTE: manifest hash validity was not checked by this script.")

    print("Static counts are NOT actual browser timer/observer counts.")
    print("No PHP/JS runtime tests, printer tests, or LIVE/API tests performed.")
    if errors:
        for msg in errors:
            print("FAIL:", msg)
        return 1
    print("PASS: local linked runtime assets exist and are not duplicated.")
    return 0


if __name__ == "__main__":
    sys.exit(audit())
