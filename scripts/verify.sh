#!/bin/sh
# One gate for dependency and build correctness. Run this before committing
# anything that touches dependencies, and before opening a PR.
#
# Fail-closed: if a check cannot establish its facts, it fails rather than
# treating uncertainty as safe.
set -eu

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

step() { printf '\n=== %s ===\n' "$1"; }

step 'declared settings are real'
node scripts/check-settings.mjs

step 'exact pinning'
node scripts/check-pins.mjs

step 'published peer ranges include what we pin'
node scripts/check-catalog-drift.mjs

step 'every resolved package version is reviewed'
node scripts/check-lockfile-reviewed.mjs

step 'lockfile integrity (no drift from committed manifests)'
pnpm install --frozen-lockfile

step 'advisories in the resolved tree'
# pnpm audit exits non-zero when anything is found, including accepted findings,
# so the accepted set is subtracted explicitly rather than the exit code ignored.
node scripts/check-advisories.mjs

step 'build'
pnpm exec turbo build

step 'types'
pnpm exec turbo check-types

step 'lint'
pnpm exec turbo lint

step 'tests'
pnpm test

printf '\nverify: all checks passed\n'
