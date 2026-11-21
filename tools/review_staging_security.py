#!/usr/bin/env python3
"""Read-only review of changed/new files in private Peetri Pizza staging clone.
Prints filenames and indicator names, never matched values. This scan does NOT
certify a file safe to publish; final human content/PII review is still needed.
"""
from __future__ import annotations
import argparse
import collections
import re
import subprocess
import sys
from pathlib import Path

BLOCKED_PARTS = {
    "private_data", "sessions", "session", "logs", "backups", "backup",
    "cache", "runtime", "node_modules", "vendor", ".git", ".deploy"
}
SENSITIVE_NAMES = re.compile(
    r"(?i)(?:^|[/._-])(?:secret|private|password|passwd|credential|"
    r"session|cookie|token|database|dump|backup|config\.local)(?:$|[/._-])"
)
TEXT_EXT = {".php", ".js", ".css", ".json", ".html", ".htm", ".svg", ".htaccess"}
MEDIA_EXT = {".png", ".jpg", ".jpeg", ".webp", ".ico", ".woff", ".woff2"}
SIGNATURES = {
    "PEM_PRIVATE_KEY": re.compile(rb"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----"),
    "GITHUB_PAT": re.compile(rb"\b(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{20,}\b"),
    "AWS_KEY": re.compile(rb"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"),
    "GOOGLE_KEY": re.compile(rb"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "STRIPE_LIVE_KEY": re.compile(rb"\bsk_live_[A-Za-z0-9]{16,}\b"),
    "SLACK_TOKEN": re.compile(rb"\bxox[baprs]-[A-Za-z0-9-]{20,}\b"),
    "JWT_LIKE": re.compile(rb"\beyJ[A-Za-z0-9_-]{18,}\.eyJ[A-Za-z0-9_-]{18,}\.[A-Za-z0-9_-]{10,}\b"),
    "BASIC_AUTH": re.compile(rb"(?i)Authorization\s*:\s*Basic\s+[A-Za-z0-9+/=]{20,}"),
    "HARDCODED_CREDENTIAL": re.compile(
        rb"(?i)(?:password|passwd|client_secret|api[_-]?key|access[_-]?token|"
        rb"refresh[_-]?token|websocket[_-]?key|session[_-]?id)\s*"
        rb"(?:=>|[:=])\s*['\"][^'\"\r\n]{12,}['\"]"
    ),
}
MANUAL_FLAGS = {
    "EMAIL_ADDRESS": re.compile(rb"\b[A-Za-z0-9._%+-]{2,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    "ESTONIAN_PHONE_LITERAL": re.compile(rb"(?<!\w)\+372[\s-]?\d{7,8}(?!\d)"),
    "ORDER_SAMPLE_LITERAL": re.compile(
        rb'(?i)["\x27](?:customerName|customerPhone|sessionId|websocket_key)["\x27]\s*:\s*["\x27][^"\x27\r\n]{3,}["\x27]'
    ),
}

def git_status(repo: Path):
    data = subprocess.check_output(
        ["git", "-C", str(repo), "status", "--porcelain=v1", "-z", "--untracked-files=all"]
    )
    chunks = iter(data.split(b"\x00"))
    for item in chunks:
        if not item:
            continue
        status = item[:2].decode("ascii", "replace")
        name = item[3:].decode("utf-8", "replace")
        if "R" in status or "C" in status:
            next(chunks, b"")
        yield status, name

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", type=Path, required=True)
    ns = ap.parse_args()
    repo = ns.repo.resolve()
    if "/tmp/peetri-review-" not in str(repo) or repo.name != "repo":
        ap.error("Expected private staging clone /tmp/peetri-review-*/repo")
    branch = subprocess.check_output(
        ["git", "-C", str(repo), "branch", "--show-current"], text=True
    ).strip()
    if branch != "sync/production-17-95-review-20261116":
        ap.error("Unexpected branch: " + branch)
    candidate_count = 0
    block = []
    review = []
    ext_counts = collections.Counter()
    for status, path in git_status(repo):
        if not path.startswith("app/peetripizza/"):
            continue
        candidate_count += 1
        rel = path.removeprefix("app/peetripizza/")
        p = repo / path
        if "D" in status or not p.is_file():
            review.append((rel, "DELETED_OR_MISSING"))
            continue
        if p.is_symlink():
            block.append((rel, "SYMLINK"))
            continue
        if any(part in BLOCKED_PARTS for part in Path(rel).parts):
            block.append((rel, "PROTECTED_DIRECTORY"))
            continue
        if SENSITIVE_NAMES.search(rel):
            block.append((rel, "SENSITIVE_FILENAME"))
            continue
        suffix = p.suffix.lower()
        if p.name == ".htaccess":
            suffix = ".htaccess"
        ext_counts[suffix or "(no extension)"] += 1
        if suffix not in TEXT_EXT | MEDIA_EXT:
            block.append((rel, "UNREVIEWED_FILETYPE"))
            continue
        size = p.stat().st_size
        if size > (5_000_000 if suffix in MEDIA_EXT else 2_000_000):
            block.append((rel, "OVERSIZED"))
            continue
        data = p.read_bytes()
        if suffix in MEDIA_EXT:
            continue  # binary/media require separate manual inspection
        for label, pat in SIGNATURES.items():
            if pat.search(data):
                block.append((rel, label))
        for label, pat in MANUAL_FLAGS.items():
            if pat.search(data):
                review.append((rel, label))

    print("=== PEETRI PIZZA STAGING PRIVACY REVIEW ===")
    print("Changed/new candidate files:", candidate_count)
    print("Formats:", " ".join(f"{k}={v}" for k,v in sorted(ext_counts.items())))
    print("Blocked indicators:", len(block))
    for file, indicator in block:
        print("BLOCK", indicator, file)
    print("Manual-review indicators:", len(review))
    for file, indicator in review:
        print("REVIEW", indicator, file)
    print("=== NO FILES MODIFIED / NO PUSH / NO DEPLOY ===")
    print("Automated checks cannot prove files are free from secrets or personal data.")
    if block:
        print("STATUS: BLOCKED — do not publish staged files.")
        return 2
    print("STATUS: PRELIMINARY ONLY — manual content review required before public commit.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, subprocess.CalledProcessError) as err:
        print("AUDIT ERROR: inspect clone/permissions; nothing published.", file=sys.stderr)
        sys.exit(3)
