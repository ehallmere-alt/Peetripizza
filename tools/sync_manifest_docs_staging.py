#!/usr/bin/env python3
"""Stage ONLY two verified production Markdown documents into a private review clone.

This does not commit, push, deploy, or alter the production application.
Stops when the docs fail SHA checks or trigger secret/PII heuristics.
A zero-flag scan is NOT final authorization to publish.
"""
from __future__ import annotations
import argparse
import hashlib
import re
import subprocess
import sys
from pathlib import Path

FILES=("CLAUDE-HANDOFF.md","README-RU.md")
BRANCH="sync/production-17-95-review-20261116"
PATTERNS={
    "PRIVATE_KEY":rb"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----",
    "GITHUB_TOKEN":rb"\b(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{20,}\b",
    "AWS_KEY":rb"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b",
    "STRIPE_SECRET":rb"\bsk_live_[A-Za-z0-9]{16,}\b",
    "GOOGLE_API_KEY":rb"\bAIza[0-9A-Za-z_-]{30,}\b",
    "SLACK_TOKEN":rb"\bxox[baprs]-[A-Za-z0-9-]{20,}\b",
    "JWT_LIKE":rb"\beyJ[A-Za-z0-9_-]{18,}\.eyJ[A-Za-z0-9_-]{18,}\.[A-Za-z0-9_-]{10,}\b",
    "CREDENTIAL_ASSIGNMENT":rb"(?i)(?:password|passwd|client_secret|api[_-]?key|access[_-]?token|refresh[_-]?token|session[_-]?id|websocket[_-]?key)\s*(?:=>|[:=])\s*['\"][^'\"\r\n]{8,}['\"]",
    "EMAIL":rb"\b[A-Za-z0-9._%+-]{2,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
    "PHONE_ET":rb"(?<!\w)\+372[\s-]?\d{7,8}(?!\d)",
    "BASIC_AUTH":rb"(?i)Authorization\s*:\s*Basic\s+[A-Za-z0-9+/=]{20,}",
}
def git(repo:Path,*args:str)->str:
    return subprocess.check_output(["git","-C",str(repo),*args],text=True).strip()

def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--repo",required=True,type=Path)
    ap.add_argument("--production",required=True,type=Path)
    a=ap.parse_args()
    repo=a.repo.resolve(strict=True)
    production=a.production.resolve(strict=True)
    if repo.name!="repo" or not str(repo).startswith("/tmp/peetri-review-"):
        ap.error("Only isolated /tmp/peetri-review-*/repo allowed")
    if production==repo or production in repo.parents or repo in production.parents:
        ap.error("Production and staging paths overlap")
    if git(repo,"branch","--show-current") != BRANCH:
        ap.error("Wrong Git branch")
    manifest=repo/"app/peetripizza/tools/release-manifest.php"
    if not manifest.is_file():
        ap.error("Manifest missing")
    entries=dict(re.findall(r"'([^']+)'\s*=>\s*'([a-f0-9]{64})'",manifest.read_text(encoding="utf-8",errors="replace")))
    ready=[]
    issues=[]
    for rel in FILES:
        file=production/rel
        if not file.is_file() or file.is_symlink():
            issues.append((rel,"MISSING_OR_SYMLINK"));continue
        data=file.read_bytes()
        expected=entries.get(rel)
        if not expected or hashlib.sha256(data).hexdigest()!=expected:
            issues.append((rel,"SERVER_SHA_MISMATCH"));continue
        if len(data)>500_000:
            issues.append((rel,"FILE_TOO_LARGE"));continue
        for tag,rule in PATTERNS.items():
            if re.search(rule,data):
                issues.append((rel,tag))
        ready.append((rel,data))
    print("=== PRODUCTION 17.95 DOCUMENTS ===")
    print("Verified against manifest:",len(ready),"/",len(FILES))
    print("Review flags:",len(issues))
    for rel,label in issues: print("REVIEW:",rel,label)
    if issues:
        print("STOP — no docs copied or staged. Manual review required.")
        return 2
    for rel,data in ready:
        target=repo/"app/peetripizza"/rel
        if not target.is_file() or target.is_symlink():
            print("STOP — staging doc missing or symlink: ",rel)
            return 3
    # Only private staging files change, never production.
    for rel,data in ready:
        target=repo/"app/peetripizza"/rel
        target.write_bytes(data)
        subprocess.run(["git","-C",str(repo),"add","--","app/peetripizza/"+rel],check=True)
    print("STAGED:",", ".join(FILES))
    print("SHA256: both match production manifest.")
    print("NO COMMIT / NO PUSH / NO DEPLOY")
    print("Manual review of all staged contents still required before any public upload.")
    return 0
if __name__=="__main__":
    try:sys.exit(main())
    except (OSError,subprocess.CalledProcessError,ValueError):
        print("ERROR: staging document sync failed; production unchanged.")
        sys.exit(3)
