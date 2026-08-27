# Dependency Review: Remove unused type-fest

## Summary

- Date: 2026-08-27
- Scope: remove the client's unused `type-fest@2.19.0` dependency rather than
  migrate an unused type library across three major versions.
- Classification: low-risk dependency removal.

## Evidence

A repository-wide import and package-name search found no source, script,
configuration, generated-code, or public-type reference to `type-fest`. Its
only live-tree declaration is `client/package.json`. Because type-fest exposes
imported utility types rather than ambient globals, an undeclared implicit use
is not plausible.

The registry reports 5.8.0 as the current major. Upgrading 2.19.0 through three
breaking lines would create migration and review work without a caller.
Removal is the honest dependency contract.

## Commands Run Before Manifest Changes

```sh
rg -n "from ['\"](type-fest|immer|@apollo/client|graphql)['\"]|require\(['\"](type-fest|immer|@apollo/client|graphql)['\"]\)" client sdk verifier dojo
rg -n "['\"]type-fest(?:/[^'\"]*)?['\"]" . --glob '!pnpm-lock.yaml' --glob '!scripts/reviewed-packages.json' --glob '!docs/dependency-reviews/**' --glob '!node_modules/**' --glob '!**/dist/**' --glob '!.git/**'
```

## Outcome

Resolution produced **0 entered, 0 left, and 1 moved** across 850 resolved
package names. The direct `type-fest@2.19.0` version leaves; an unrelated
transitive consumer still retains `type-fest@0.21.3`, so the package name does
not disappear from the graph. No new version needs review.

The reviewed set was pruned to 1,041 exact `name@version` pairs across 850
packages, and a normal non-bypassed install passed. Full `pnpm verify` passes,
including dependency policy, audit, lint, both production builds, TypeScript,
and all 43 workspace tests. No source change was required.

Commands after the manifest change:

```sh
PISTOLS_ALLOW_UNREVIEWED=1 pnpm install
pnpm lockfile-diff
node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/2026-08-27-remove-unused-type-fest.md
pnpm install
pnpm verify
```
