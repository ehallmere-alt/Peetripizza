#!/usr/bin/env python3
"""Static offline-only preflight of staged Peetri Pizza 17.95 source.

Checks exact Git index blobs: git diff --check, PHP/JS/JSON syntax,
and reports the files that require manual review for external
network/API actions or private-data persistence. No network requests,
no production data reads, no Git writes, no app execution/deploy.
"""
import argparse
import collections
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

BRANCH = "sync/production-17-95-review-20261116"
RESTRICTED = {
    "app/peetripizza/tests-v150.php",
    "app/peetripizza/tools/test-realtime-v1768.php",
    "app/peetripizza/tools/test-socket-controller-v1768.js",
}
NETWORK = re.compile(rb"(?i)(?:curl_exec\s*\(|(?:file_get_contents|fetch)\s*\(\s*['\"]https?://|(?:https?:)?//peetripizza\.ee|XMLHttpRequest|WebSocket\s*\()")
WRITE = re.compile(rb"(?i)(?:file_put_contents\s*\(|(?:unlink|rename|move_uploaded_file)\s*\(|(?:\$_POST|\$_REQUEST)\b)")
ENV = re.compile(rb"(?i)(?:getenv\s*\(|\$_ENV\b|\$_SERVER\s*\[\s*['\"](?:HTTP_AUTHORIZATION|PHP_AUTH_PW|REMOTE_ADDR)['\"])")

def git(root, *args, input=None):
    return subprocess.run(
        ["git", "-C", str(root), *args], input=input,
        check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    ).stdout

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, type=Path)
    a = ap.parse_args()
    root = a.repo.resolve()
    if root.name != "repo" or not str(root).startswith("/tmp/peetri-review-"):
        ap.error("Expected an isolated /tmp/peetri-review-*/repo clone")
    if git(root, "branch", "--show-current").decode().strip() != BRANCH:
        ap.error("Wrong branch")
    paths = [v.decode("utf-8") for v in git(
        root, "diff", "--cached", "--name-only", "--diff-filter=ACMRT", "-z"
    ).split(b"\0") if v]
    if not paths or any(not p.startswith("app/peetripizza/") for p in paths):
        ap.error("Expected staged Peetri Pizza app files only")
    errors = []
    review = collections.defaultdict(list)
    types = collections.Counter()
    if any(p in RESTRICTED for p in paths):
        errors.append(("excluded-test-staged", "review selection"))
    if git(root, "diff", "--cached", "--check"):
        errors.append(("git-diff-whitespace", "staged diff"))
    with tempfile.TemporaryDirectory(prefix="pp-offline-syntax-") as t:
        tmp = Path(t)
        for i, rel in enumerate(paths):
            data = git(root, "show", ":" + rel)
            ext = Path(rel).suffix.lower()
            types[ext or "(none)"] += 1
            if ext == ".json":
                try: json.loads(data.decode("utf-8-sig"))
                except (ValueError, UnicodeError):
                    errors.append(("json-syntax", rel))
            elif ext in (".php", ".js"):
                tool = "php" if ext == ".php" else "node"
                if not shutil.which(tool):
                    errors.append(("missing-tool-" + tool, rel))
                else:
                    candidate = tmp / (str(i) + ext)
                    candidate.write_bytes(data)
                    args = ["php", "-l", str(candidate)] if ext == ".php" else ["node", "--check", str(candidate)]
                    p = subprocess.run(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    if p.returncode:
                        errors.append((tool + "-syntax", rel))
            if ext in (".php", ".js"):
                if NETWORK.search(data): review["network"].append(rel)
                if WRITE.search(data): review["state-change"].append(rel)
                if ENV.search(data): review["auth-or-environment"].append(rel)
    print("=== PEETRI 17.95 OFFLINE STAGING PREFLIGHT ===")
    print("Staged files:", len(paths))
    print("By format:", ", ".join(f"{k}={v}" for k,v in sorted(types.items())))
    print("Failures:", len(errors))
    for tag, rel in errors[:30]:
        print("FAIL", tag, rel)
    print("=== MANUAL REVIEW: FILE NAMES ONLY ===")
    for kind, matches in sorted(review.items()):
        print(kind + ":", len(matches))
        for rel in matches[:15]:
            print("REVIEW", kind, rel)
        if len(matches) > 15:
            print("MORE", kind, len(matches)-15)
    print("NO NETWORK / NO FILE CHANGES / NO COMMIT / NO PUSH / NO DEPLOY")
    if errors:
        print("STATUS: BLOCKED — do not publish")
        return 2
    print("STATUS: OFFLINE PREFLIGHT PASSED; manual code/privacy review still required")
    return 0

if __name__ == "__main__":
    try:sys.exit(main())
    except (OSError, subprocess.CalledProcessError) as e:
        print("ERROR: staging preflight could not complete", file=sys.stderr)
        sys.exit(3)
