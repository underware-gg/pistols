# Dependency Review: Remove unused local-storage-state

## Summary

- Date: 2026-08-27
- Scope: remove the client's unused `use-local-storage-state@19.5.0`
  dependency instead of taking its 20.0.0 major.
- Classification: low-risk dependency removal.

## Evidence

A repository-wide exact-name and public-hook search found no import, dynamic
reference, script, configuration reference, or generated-code use. The only
match outside dependency records and the lockfile is the declaration in
`client/package.json` itself.

The available 20.0.0 candidate is policy-clean: 42 days old, non-deprecated,
no install script, no known advisory, and compatible React 18 peers. That does
not justify retaining a dependency with no caller. Removal is the simpler
change and avoids manufacturing migration work for dead code.

## Commands Run Before Manifest Changes

```sh
pnpm candidate use-local-storage-state@20.0.0 --depth 1
rg -n 'use-local-storage-state|useLocalStorageState' . --glob '!pnpm-lock.yaml' --glob '!scripts/reviewed-packages.json' --glob '!docs/dependency-reviews/**' --glob '!node_modules/**' --glob '!**/dist/**' --glob '!.git/**'
```

## Outcome

Resolution is neutral except for the intended departure:
`use-local-storage-state@19.5.0` leaves the graph. The result is **0 entered,
1 left, and 0 moved** across 850 resolved package names.

The reviewed set was pruned to 1,042 exact `name@version` pairs across 850
packages, and a normal non-bypassed install passed. Full `pnpm verify` passes,
including dependency policy, audit, lint, both production builds, TypeScript,
and all 43 workspace tests. No source change was required.

Commands after the manifest change:

```sh
PISTOLS_ALLOW_UNREVIEWED=1 pnpm install
pnpm lockfile-diff
node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/2026-08-27-remove-unused-local-storage-state.md
pnpm install
pnpm verify
```
