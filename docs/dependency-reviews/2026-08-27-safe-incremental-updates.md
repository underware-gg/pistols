# Dependency Review: Safe incremental updates

## Summary

- Date: 2026-08-27
- Scope: take every registry-visible update that stays on the repository's
  current ecosystem line and passes the candidate intake policy.
- Excluded: framework/rubicon majors, incompatible 0.x lines, and candidates
  whose resolved graph contains a known advisory.

## Classification

Moderate-risk. Eleven direct dependencies move within their current supported
line. Most are tooling or patch-level changes; the runtime set includes React
Query, Dexie, SWR, cookies, and the Vite WASM integration. No framework major,
React major, Starknet major, Dojo major, or Controller line changes here.

## Targets

| Package | Current | Candidate | Role |
|---|---:|---:|---|
| `@tanstack/react-query` | 5.90.2 | 5.101.4 | SDK/client async query runtime |
| `happy-dom` | 20.11.2 | 20.11.6 | Client and SDK hook-test DOM |
| `@starknet-io/get-starknet-core` | 4.0.7 | 4.0.8 | Starknet connector peer/dev dependency |
| `dexie` | 4.2.0 | 4.4.5 | Client IndexedDB runtime |
| `sass` | 1.93.2 | 1.103.0 | Client stylesheet build |
| `swr` | 2.3.6 | 2.5.1 | SDK data-fetch runtime |
| `tsx` | 4.20.6 | 4.23.12 | Client TypeScript script runner |
| `turbo` | 2.9.14 | 2.10.11 | Monorepo task runner |
| `universal-cookie` | 8.0.1 | 8.1.2 | SDK/client cookie runtime and peer |
| `vite-plugin-glsl` | 1.5.3 | 1.6.1 | Client shader build integration |
| `vite-plugin-wasm` | 3.5.0 | 3.6.0 | Client WASM build integration |

The published SDK peer ranges already include the new React Query,
get-starknet-core, and universal-cookie pins, so their consumer contract does
not need to move.

## Release Age

The repository candidate tool checked every target against the strict seven-day
gate. All pass. The youngest candidates are `happy-dom@20.11.6` and
`sass@1.103.0`, both published seven days before this review; Turbo is eight
days old and Dexie twelve. The remaining candidates are older.

## Advisory Review

The candidate tool found no advisory affecting any target. It also checked the
newly selected transitive versions:

- `@tanstack/query-core@5.101.4`
- `chokidar@5.0.0`
- `use-sync-external-store@1.6.0`
- `esbuild@0.28.2`
- `cookie@1.1.1`

None is affected by a known advisory. This is materially different from
`tsup@8.5.1`, which selects `esbuild@0.27.7`; that version is inside two
advisory ranges and is therefore excluded from this update.

## Source / Upstream Review

Authoritative npm manifests and repository metadata were inspected for every
candidate. All targets are non-deprecated and remain on their existing major
line. Their declared Node floors are compatible with this repository's
`^22.13.0 || >=24` policy: the strictest new floors are Node 20.19 for Sass and
Node 20.17 for vite-plugin-glsl.

The compatibility-sensitive movements are explicit:

- React Query moves its lockstep `@tanstack/query-core` package to 5.101.4.
- Sass moves its watcher dependency from Chokidar 4 to 5; neither is imported
  by Pistols directly.
- SWR moves `use-sync-external-store` from 1.5 to 1.6 while retaining React 18
  support.
- TSX selects advisory-clean `esbuild@0.28.2`.
- universal-cookie selects advisory-clean `cookie@1.1.1`.
- The Vite plugins continue to declare compatibility with the pinned Vite 6.

No compatibility shim or source refactor is justified in advance. The lockfile
diff, package builds, typechecks, behavioural tests, and full verification gate
are the acceptance evidence.

## Lifecycle Scripts

Ten targets and all their other arrivals have no install script. TSX's esbuild
arrival has `postinstall: node install.js`, but `esbuild: false` is already an
explicit reviewed decision in `pnpm-workspace.yaml`; this batch does not widen
build permission. `allowBuilds` remains unchanged.

## Commands Run Before Manifest Changes

```sh
pnpm outdated -r --format json
pnpm candidate @tanstack/react-query@5.101.4 happy-dom@20.11.6 tsup@8.5.1 --depth 1
pnpm candidate @starknet-io/get-starknet-core@4.0.8 dexie@4.4.5 sass@1.103.0 swr@2.5.1 tsx@4.23.12 turbo@2.10.11 universal-cookie@8.1.2 vite-plugin-glsl@1.6.1 vite-plugin-wasm@3.6.0 --depth 1
```

The second command is intentionally non-zero only because it also assessed the
rejected TSUP candidate. The third is intentionally non-zero only because the
already-denied esbuild lifecycle script requires an explicit decision.

## Exclusions

- `tsup@8.5.1`: rejected while it resolves affected `esbuild@0.27.7`.
- `@effect/platform@0.97.1`: outside `@effect/opentelemetry`'s required
  `^0.93.8` peer line and therefore part of a Dojo-line migration, not an
  incremental update.
- React 19, Starknet 10, Dojo 2, Controller 0.14, Vite 8, Vitest 4, and other
  majors remain the separately-shaped rubicon migration.
- 0.x minor jumps such as Three 0.180 to 0.185 are treated as breaking until
  reviewed separately.

## Outcome

The controlled resolution produced **0 entered, 2 left, 49 moved** across 860
resolved package names. The two departures are TSX's obsolete
`get-tsconfig@4.13.0` and `resolve-pkg-maps@1.0.0`. Every moved version maps to
the reviewed target chains above.

The initial depth-one review did not enumerate platform-specific optional
packages. After resolution, all 26 `@esbuild/*@0.28.2` binaries,
`readdirp@5.1.1`, and all six `@turbo/*@2.10.11` binaries were therefore run
through `pnpm candidate` explicitly. All pass the age and advisory gates and
have no install scripts.

React Query 5.101 no longer exports its former `NoInfer` type helper. The SDK's
SQL hook used that name only as a type-level inference guard, so its import was
removed and the existing TypeScript 5.9 intrinsic `NoInfer` is used instead.
The focused SDK build passed after this compatibility adjustment.

`pnpm audit` reports only the pre-existing accepted low-severity `elliptic`
finding through `verifier > starkscan > starknet`; the updated graph adds no
finding. The reviewed set was regenerated from this record, growing from 1,024
to 1,053 exact `name@version` pairs across 860 packages. A normal, non-bypassed
install then passed the reviewed-lockfile gate. The eleven direct updates and
their exact resolved movements are approved for the reviewed set.

Full repository verification passed, including dependency policy gates, audit,
SDK and client builds, SDK's 39 tests, and the client's four tests.

Commands after manifest changes:

```sh
PISTOLS_ALLOW_UNREVIEWED=1 pnpm install
pnpm lockfile-diff
pnpm candidate @esbuild/aix-ppc64@0.28.2 ... @esbuild/win32-x64@0.28.2 readdirp@5.1.1 --depth 0
pnpm candidate @turbo/darwin-64@2.10.11 ... @turbo/windows-arm64@2.10.11 --depth 0
pnpm audit --json
node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/2026-08-27-safe-incremental-updates.md
pnpm install
pnpm --filter @underware/pistols-sdk build
pnpm verify
git diff --check
```

## Follow-ups

- Revisit TSUP only when its declared esbuild range selects an advisory-clean
  version without an out-of-range override.
- Treat the ecosystem-major and 0.x-minor sets as shaped migrations, not routine
  update batches.
