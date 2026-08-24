#!/bin/sh
# Validates that .canary--pre-commit acknowledges every task in
# .canaries/pre-commit.md. It checks coverage, not truthfulness.
set -eu

REPO_ROOT=$(git rev-parse --show-toplevel)
DEF="$REPO_ROOT/.canaries/pre-commit.md"
LOG="$REPO_ROOT/.canary--pre-commit"

[ -f "$DEF" ] || { printf '%s\n' "canary: no definition at .canaries/pre-commit.md - skipping"; exit 0; }

if [ -n "$(git diff --cached --name-only --diff-filter=ACMR -- .canary--pre-commit || true)" ]; then
  printf >&2 '%s\n' "canary: .canary--pre-commit is staged. It is transient local state and must stay untracked."
  printf >&2 '%s\n' "canary: run 'git restore --staged .canary--pre-commit' and commit again."
  exit 1
fi

IDS=$(awk '/^## Tasks$/{f=1;next}/^## Log$/{f=0}f' "$DEF" | grep -oE '^\[[0-9]+[a-z]?\]' | sort -u)
[ -n "$IDS" ] || { printf '%s\n' "canary: no task IDs found - skipping"; exit 0; }

if [ ! -f "$LOG" ]; then
  printf >&2 '%s\n' ""
  printf >&2 '%s\n' "canary: .canary--pre-commit not found."
  printf >&2 '%s\n' "Read .canaries/pre-commit.md and write one line per task, e.g.:"
  printf >&2 '%s\n' "  [1] Verification: done"
  printf >&2 '%s\n' "  [2] Order of operations: skip, no dependency change"
  exit 1
fi

MISSING=""
for ID in $IDS; do
  grep -qF "$ID" "$LOG" || MISSING="$MISSING $ID"
done
if [ -n "$MISSING" ]; then
  printf >&2 '%s\n' "canary: .canary--pre-commit does not cover:$MISSING"
  printf >&2 '%s\n' "Mark each as '[id] Label: done' or '[id] Label: skip, reason'."
  exit 1
fi

printf '%s\n' "canary: OK - all tasks acknowledged"
