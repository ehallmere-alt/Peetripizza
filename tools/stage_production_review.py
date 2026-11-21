#!/usr/bin/env python3
"""Stage allowlisted production source files in an isolated Git clone.

NEVER runs git add, commit, push, merge or deploy. Copies candidate source from
production to a private review clone under /tmp. A clean result is NOT a
security clearance; review all content before publishing to a public repo.
Run: python3 tools/stage_production_review.py --production /path/to/app
"""
from __future__ import annotations

import argparse
import collections
import os
import re
import subprocess
import sys
from pathlib import Path

BRANCH = "sync/production-17-95-review-20261116"
RELEASE = "17.95.0"
EXCLUDED_DIRS = {
    ".git", ".deploy", "private_data", "backups", "backup", "peetri-backups",
    "sessions", "session", "logs", "log", "cache", "runtime", "tmp", "temp",
    "node_modules", "vendor", "archive", "archives", "old-backups",
}
SENSITIVE_NAME = re.compile(
    r"(?i)(?:^|[/._-])(?:private|secret|credential|password|passwd|token|"
    r"session|cookie|backup|config|local|database|db|export|dump)(?:$|[/._-])"
)
ALLOWED_SOURCE_EXT = {".php", ".js", ".css", ".html", ".htm"}
ALLOWED_ASSET_EXT = {".svg", ".png", ".webp", ".jpg", ".jpeg", ".ico", ".woff", ".woff2"}
SECRET_SIGS = {
    "pem-private-key": re.compile(rb"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----"),
    "github-token": re.compile(rb"\b(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{20,}"),
    "aws-access-key": re.compile(rb"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"),
    "stripe-secret": re.compile(rb"\bsk_live_[A-Za-z0-9]{16,}"),
    "google-api-key": re.compile(rb"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "slack-token": re.compile(rb"\bxox[baprs]-[A-Za-z0-9-]{20,}"),
    "jwt-literal": re.compile(rb"\beyJ[A-Za-z0-9_-]{18,}\.eyJ[A-Za-z0-9_-]{18,}\.[A-Za-z0-9_-]{10,}\b"),
    "hardcoded-credential": re.compile(
        rb"(?i)(?:password|passwd|client_secret|api[_-]?key|access[_-]?token|"
        rb"refresh[_-]?token|websocket[_-]?key)\s*(?:=>|[:=])\s*['\"][^'\"\r\n]{12,}['\"]"
    ),
}

def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--production", type=Path, required=True)
    args = p.parse_args()
    production = args.production.resolve(strict=True)
    repo = Path(__file__).resolve().parent.parent
    if not (repo / ".git").exists():
        p.error("Run in a separate Git clone, not in production.")
    if production == repo or production in repo.parents or repo in production.parents:
        p.error("Production and review clone must not overlap.")
    if not str(repo).startswith("/tmp/"):
        p.error("Review clone must be under /tmp; refuse live webroot or $HOME edits.")
    if git(repo, "branch", "--show-current") != BRANCH:
        p.error("Wrong review branch.")
    if git(repo, "status", "--porcelain"):
        p.error("Review clone already modified: use a new clean clone.")
    dashboard = production / "dashboard.php"
    if not dashboard.is_file() or dashboard.is_symlink():
        p.error("Missing dashboard.php or symlink; refusing.")
    m = re.search(r'name="peetri-release" content="([^"]+)"', dashboard.read_text(errors="replace"))
    if not m or m.group(1) != RELEASE:
        p.error(f"Expected production {RELEASE}, got {m.group(1) if m else 'unknown'}.")

    tracked = {
        name.removeprefix("app/peetripizza/")
        for name in git(repo, "ls-files", "--", "app/peetripizza").splitlines()
        if name.startswith("app/peetripizza/")
    }
    approved = []
    rejected = []
    for folder, dirs, names in os.walk(production, followlinks=False):
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS and not (Path(folder) / d).is_symlink()]
        for name in names:
            src = Path(folder) / name
            if not src.is_file() or src.is_symlink():
                continue
            rel = src.relative_to(production).as_posix()
            parts = Path(rel).parts
            if len(parts) > 8 or (rel.startswith(".") and name != ".htaccess"):
                rejected.append((rel, "hidden-or-deep")); continue
            if SENSITIVE_NAME.search(rel):
                rejected.append((rel, "sensitive-name")); continue
            suffix = src.suffix.lower()
            if not (suffix in ALLOWED_SOURCE_EXT or
                    (rel.startswith("assets/") and suffix in ALLOWED_ASSET_EXT) or
                    (rel.startswith("assets/") and name.startswith("manifest-") and suffix == ".json") or
                    (name == ".htaccess" and rel in tracked)):
                continue  # Historic README files are intentionally excluded.
            if src.stat().st_size > (5_000_000 if suffix in ALLOWED_ASSET_EXT else 2_000_000):
                rejected.append((rel, "too-large")); continue
            data = src.read_bytes()
            flags = [label for label, pat in SECRET_SIGS.items() if pat.search(data)]
            if flags:
                rejected.append((rel, "content:" + ",".join(flags))); continue
            approved.append((rel, data))

    dstroot = repo / "app/peetripizza"
    n_new, n_modified, n_unchanged = 0, 0, 0
    for rel, data in approved:
        dest = dstroot / rel
        if dest.exists() and dest.is_file() and dest.read_bytes() == data:
            n_unchanged += 1
            continue
        if not dest.exists():
            n_new += 1
        else:
            n_modified += 1
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        dest.chmod(0o600)

    report = repo.parent / "STAGING-REVIEW-NOT-FOR-COMMIT.txt"
    report.write_text(
        "PRIVATE STAGING REPORT — do not publish without manual review\n"
        f"Production version: {RELEASE}\nCandidate files copied/compared: {len(approved)}\n"
        f"New candidates: {n_new}\nModified candidates: {n_modified}\n"
        f"Unchanged candidates: {n_unchanged}\nRejected candidates: {len(rejected)}\n"
        + "REJECTED CANDIDATES (names/types only; NO secret contents):\n"
        + "\n".join(f"{reason}: {rel}" for rel, reason in rejected)
        + "\nDO NOT git add/commit/push until reviewed.\n",
        encoding="utf-8",
    )
    report.chmod(0o600)
    suffixes = collections.Counter(Path(rel).suffix.lower() for rel, _ in approved)
    print("=== PEETRI 17.95 STAGING REVIEW ===")
    print("Private staging clone:", repo)
    print("Candidates:", len(approved), "/ new:", n_new,
          "/ modified:", n_modified, "/ unchanged:", n_unchanged)
    print("Excluded/flagged candidates:", len(rejected))
    print("By extension:", ", ".join(f"{k}={v}" for k, v in sorted(suffixes.items())))
    print("Report file:", report)
    print("=== NO COMMIT, NO PUSH, NO DEPLOY ===")
    print("Content patterns are incomplete; manual secret/PII review still required before public upload.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, subprocess.CalledProcessError):
        print("ERROR: staging refused/failed. Check filesystem permissions and Git clone.", file=sys.stderr)
        sys.exit(1)
