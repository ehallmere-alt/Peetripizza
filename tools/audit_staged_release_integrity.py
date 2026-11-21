#!/usr/bin/env python3
"""Read-only integrity audit of the Peetri Pizza 17.95 staging Git INDEX.

Runs only in the isolated /tmp/peetri-review-*/repo clone.
Checks exactly what is staged, not unstaged working-tree content.
Prints paths/counts only. No commit, push, network or deploy.
"""
from __future__ import annotations
import hashlib
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit

BRANCH = "sync/production-17-95-review-20261116"
EXCLUDE = {
    "app/peetripizza/tests-v150.php",
    "app/peetripizza/tools/test-realtime-v1768.php",
    "app/peetripizza/tools/test-socket-controller-v1768.js",
}
ROOT = Path.cwd().resolve()

def git(*args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(ROOT), *args])

def blob(path: str) -> bytes:
    return git("show", ":" + path)

def main() -> int:
    if ROOT.name != "repo" or not str(ROOT).startswith("/tmp/peetri-review-"):
        print("ERROR: only run in /tmp/peetri-review-*/repo")
        return 3
    if git("branch", "--show-current").decode().strip() != BRANCH:
        print("ERROR: unexpected Git branch")
        return 3
    changed = [x.decode("utf-8", "replace") for x in git(
        "diff", "--cached", "--name-only", "-z", "--diff-filter=ACMRT"
    ).split(b"\0") if x]
    changed_set = set(changed)
    problems: list[tuple[str, str]] = []
    reviewed: list[tuple[str, str]] = []
    if changed_set & EXCLUDE:
        for p in sorted(changed_set & EXCLUDE):
            problems.append(("excluded-file-staged", p))
    if len(changed) not in (89, 91):
        reviewed.append(("unexpected-staged-count", str(len(changed))))
    status = git("diff", "--cached", "--name-status", "-z").split(b"\0")
    if any(x.startswith(b"D") for x in status if x):
        reviewed.append(("staged-deletion", "inspect Git index"))

    app = "app/peetripizza/"
    dash = (app + "dashboard.php")
    dashboard = blob(dash).decode("utf-8", "replace")
    version = re.search(r'name="peetri-release"\s+content="([^"]+)"', dashboard)
    release = version.group(1) if version else "unreadable"
    if release != "17.95.0":
        problems.append(("release-not-17.95.0", "dashboard.php"))

    # HTML references in the actual staged pages (comments removed). Reference
    # integrity is a blocking check; URLs are relative to the application root.
    pages = ("dashboard.php", "index.php", "dough.php", "check.php")
    references: set[str] = set()
    tracked_paths = {
        x.decode("utf-8", "replace") for x in
        git("ls-files", "-z", "--", app).split(b"\0") if x
    }
    for page in pages:
        candidate = app + page
        if candidate not in tracked_paths:
            continue
        body = blob(candidate).decode("utf-8", "replace")
        body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
        for raw in re.findall(r"""(?:src|href)\s*=\s*["']([^"']+)["']""", body):
            url = urlsplit(raw)
            target = url.path
            if not target.startswith("assets/") or ".." in Path(target).parts:
                continue
            references.add(app + target)
    for target in sorted(references):
        if target not in tracked_paths:
            problems.append(("missing-direct-asset", target.removeprefix(app)))

    # Verify the staged PHP release manifest, without executing PHP.
    manifest_path = app + "tools/release-manifest.php"
    manifest_checked = 0
    manifest_missing = []
    manifest_mismatch = []
    if manifest_path in tracked_paths:
        text = blob(manifest_path).decode("utf-8", "replace")
        entries = re.findall(r"'([^']+)'\s*=>\s*'([a-f0-9]{64})'", text)
        for rel, expected in entries:
            if rel.startswith("/") or ".." in Path(rel).parts:
                problems.append(("unsafe-manifest-path", rel))
                continue
            full = app + rel
            if full not in tracked_paths:
                manifest_missing.append(rel)
                continue
            manifest_checked += 1
            if hashlib.sha256(blob(full)).hexdigest() != expected:
                manifest_mismatch.append(rel)
        if not entries:
            reviewed.append(("manifest-unreadable-or-empty", manifest_path))
    else:
        reviewed.append(("manifest-not-tracked", manifest_path))
    for rel in manifest_missing[:20]:
        problems.append(("manifest-file-missing", rel))
    for rel in manifest_mismatch[:20]:
        problems.append(("manifest-sha256-mismatch", rel))

    # Static __DIR__ PHP includes: classify as review only (there may be
    # nonstandard bootstrap paths or deliberate external dependencies).
    for path in changed:
        if not (path.startswith(app) and path.endswith(".php")):
            continue
        content = blob(path).decode("utf-8", "replace")
        for rel in re.findall(
            r"""(?:require_once|require|include_once|include)\s*(?:\(\s*)?__DIR__\s*\.\s*["'](/[^"']+)["']""",
            content
        ):
            full = (ROOT / app / Path(path).relative_to(app).parent / rel.lstrip("/")).resolve()
            try:
                normalized = full.relative_to(ROOT).as_posix()
            except ValueError:
                reviewed.append(("external-php-include", path))
                continue
            if normalized not in tracked_paths and normalized.startswith(app):
                reviewed.append(("unresolved-static-php-include", path))

    print("=== PEETRI 17.95 STAGED RELEASE INTEGRITY ===")
    print("Git index changed files:", len(changed))
    print("Dashboard version:", release)
    print("Direct assets referenced:", len(references))
    print("Manifest entries hash-checked:", manifest_checked)
    print("Manifest missing files:", len(manifest_missing))
    print("Manifest hash mismatches:", len(manifest_mismatch))
    print("Blocking findings:", len(problems))
    for kind, p in problems[:30]:
        print("BLOCK", kind, p)
    print("Needs manual review:", len(reviewed))
    for kind, p in reviewed[:20]:
        print("REVIEW", kind, p)
    print("NO COMMIT / NO PUSH / NO DEPLOY")
    if problems:
        print("STATUS: BLOCKED — review or fix the isolated clone only.")
        return 2
    print("STATUS: INTEGRITY CHECK PASSED; privacy and runtime tests still required.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, subprocess.CalledProcessError, ValueError) as exc:
        print("ERROR: cannot inspect staging Git index; nothing published.")
        sys.exit(3)
