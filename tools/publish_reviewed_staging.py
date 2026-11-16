#!/usr/bin/env python3
"""Guarded publication of a verified STAGING Git index to a DRAFT PR branch.
Never touches production, main, releases, orders or LIVE APIs.
Refuses publication on any uncertainty about contents, credentials or Git state.
"""
import hashlib
import os
import re
import subprocess
import sys
from pathlib import Path

BRANCH="sync/production-17-95-review-20261116"
REPO_URL="https://github.com/ehallmere-alt/Peetripizza.git"
EXPECTED=91
EXCLUDED=(
    "tests-v150.php", "tools/test-realtime-v1768.php",
    "tools/test-socket-controller-v1768.js",
)
BLOCKED_COMPONENTS=set("private_data backups backup logs log sessions session runtime cache vendor node_modules .git".split())
PATTERNS={
 "PRIVATE_KEY":rb"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----",
 "GITHUB_TOKEN":rb"\b(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{20,}\b",
 "AWS":rb"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b",
 "STRIPE":rb"\bsk_live_[A-Za-z0-9]{16,}\b",
 "GOOGLE_KEY":rb"\bAIza[0-9A-Za-z_-]{30,}\b",
 "SLACK":rb"\bxox[baprs]-[A-Za-z0-9-]{20,}\b",
 "JWT":rb"\beyJ[A-Za-z0-9_-]{18,}\.eyJ[A-Za-z0-9_-]{18,}\.[A-Za-z0-9_-]{10,}\b",
 "AUTH_HEADER":rb"(?i)Authorization\s*:\s*(?:Basic|Bearer)\s+[A-Za-z0-9.+/_=-]{20,}",
 "CREDS_LITERAL":rb"(?i)(?:password|passwd|client_secret|api[_-]?key|access[_-]?token|refresh[_-]?token|session[_-]?id|websocket[_-]?key)\s*(?:=>|[:=])\s*['\"][^'\"\r\n]{8,}['\"]",
 "PHONE":rb"(?<!\w)\+372[\s-]?\d{7,8}(?!\d)",
 "EMAIL":rb"\b[A-Za-z0-9._%+-]{2,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
 "DB_URI":rb"(?i)\b(?:mysql|postgres(?:ql)?|mongodb(?:\+srv)?)://[^ \t\r\n\"']+",
}
def git(repo,*a,input=None,check=True):
    return subprocess.run(["git","-C",str(repo),*a],input=input,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=check)
def abort(reason):
    print("STOP:", reason)
    print("No commit/push/deploy performed by this script.")
    sys.exit(2)
def main():
    repo=Path.cwd().resolve()
    if repo.name!="repo" or not re.fullmatch(r"/tmp/peetri-review-[^/]+/repo",str(repo)):
        abort("Not in isolated staging clone")
    if git(repo,"branch","--show-current").stdout.decode().strip()!=BRANCH: abort("Wrong branch")
    origin=git(repo,"remote","get-url","origin").stdout.decode().strip()
    if origin not in (REPO_URL,"git@github.com:ehallmere-alt/Peetripizza.git"):
        abort("Unexpected Git origin")
    if git(repo,"diff","--cached","--check",check=False).returncode:abort("Staged whitespace/conflicts")
    names=git(repo,"diff","--cached","--name-only","-z","--diff-filter=ACMRT").stdout.split(b"\x00")
    names=[n.decode("utf-8") for n in names if n]
    if len(names)!=EXPECTED:abort(f"Expected {EXPECTED} staged files, got {len(names)}")
    bad=[]
    for name in names:
        rel=name.removeprefix("app/peetripizza/")
        if not name.startswith("app/peetripizza/") or rel==name:bad.append((name,"outside-app"));continue
        if rel in EXCLUDED or any(rel.endswith("/"+b) or rel==b for b in EXCLUDED):bad.append((name,"excluded-test"));continue
        if any(x in BLOCKED_COMPONENTS for x in Path(rel).parts):bad.append((name,"runtime-data"));continue
        if re.search(r"(?i)(?:^|[/._-])(?:password|secret|token|credential|cookie|session|backup|private|dump)(?:$|[/._-])",rel):bad.append((name,"sensitive-filename"));continue
        if Path(rel).suffix.lower() not in {".php",".js",".css",".md",".json",".htaccess"} and Path(rel).name!=".htaccess":bad.append((name,"unreviewed-type"));continue
        data=git(repo,"show",":"+name).stdout
        if len(data)>2_000_000:bad.append((name,"file-too-large"));continue
        if b"\x00" in data:bad.append((name,"binary-in-source"));continue
        for label,p in PATTERNS.items():
            if re.search(p,data):bad.append((name,label))
    print("=== FINAL PUBLICATION GATE ===")
    print("Staged files:",len(names))
    print("Potential privacy/secret indicators:",len(bad))
    for path,why in bad[:35]:print("BLOCK:",why,path)
    if bad:abort("Manual redaction/review required. No code published.")
    # Validate manifest directly from Git index. Independent of working-tree mutations.
    manifest=git(repo,"show",":app/peetripizza/tools/release-manifest.php").stdout.decode("utf-8","replace")
    entries=re.findall(r"'([^']+)'\s*=>\s*'([a-f0-9]{64})'",manifest)
    if len(entries)<200:abort("Release manifest unexpectedly small/unreadable")
    tracked={x.decode() for x in git(repo,"ls-files","-z","--","app/peetripizza/").stdout.split(b"\0") if x}
    for rel,digest in entries:
        if rel.startswith("/") or ".." in Path(rel).parts:abort("Unsafe manifest path")
        path="app/peetripizza/"+rel
        if path not in tracked:abort("Manifest entry absent: "+rel)
        if hashlib.sha256(git(repo,"show",":"+path).stdout).hexdigest()!=digest:abort("Manifest SHA mismatch: "+rel)
    print("Manifest verified:",len(entries))
    # Explicit release mark in staged dashboard.
    dashboard=git(repo,"show",":app/peetripizza/dashboard.php").stdout
    if b'name="peetri-release" content="17.95.0"' not in dashboard:abort("Expected 17.95.0")
    # IMPORTANT: the staging clone predates review-branch audit commits.
    # Re-clone latest remote branch and transplant ONLY the validated index blobs.
    # This preserves all newer remote documentation/scripts without rewriting history.
    import tempfile
    with tempfile.TemporaryDirectory(prefix="peetri-publish-") as temp:
        target=Path(temp)/"repo"
        cloned=subprocess.run(
            ["git","clone","-q","--depth","1","--branch",BRANCH,REPO_URL,str(target)],
            stdout=subprocess.PIPE,stderr=subprocess.PIPE
        )
        if cloned.returncode:abort("Unable to clone up-to-date remote review branch")
        for name in names:
            dest=target/name
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(git(repo,"show",":"+name).stdout)
            git(target,"add","--",name)
        # Verify transplanted content matches the reviewed Git INDEX byte-for-byte.
        for name in names:
            if git(target,"show",":"+name).stdout != git(repo,"show",":"+name).stdout:
                abort("Staged content changed during transplant")
        identity={}
        for field in ("user.name","user.email"):
            q=git(repo,"config","--get",field,check=False)
            if q.returncode or not q.stdout.strip():
                abort("Git author identity missing: "+field)
            identity[field]=q.stdout.decode().strip()
        print("Checks passed; preparing draft-branch-only commit.")
        git(target,"-c","user.name="+identity["user.name"],
            "-c","user.email="+identity["user.email"],
            "commit","-m","sync: import verified production Peetri Pizza 17.95.0 snapshot")
        # No force push. GitHub will reject concurrent remote updates.
        p=git(target,"-c","credential.interactive=never",
              "push","origin",f"HEAD:refs/heads/{BRANCH}",check=False)
        if p.returncode:
            print("PUSH FAILED. No remote overwrite. Check Git authentication.")
            return 1
    print("PUSH OK to draft PR branch ONLY.")
    print("DO NOT MERGE/DEPLOY: manual code and privacy review required.")
    return 0
if __name__=="__main__":
    try:sys.exit(main())
    except subprocess.CalledProcessError:
        print("STOP: Git command failed, branch and server unchanged unless local commit already indicated.")
        sys.exit(3)
