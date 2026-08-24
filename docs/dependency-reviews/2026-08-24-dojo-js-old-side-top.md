# Dependency Review: dojo.js to the top of the old side

## Summary

- Date: 2026-08-24
- Scope: finish the climb that
  [2026-08-23](2026-08-23-old-side-ceiling.md) left incomplete — take
  `@dojoengine/*` from 1.8.0 to the highest release that still peers
  `starknet ^8.1.2`.

`@dojoengine/sdk@1.9.0` is that release. 2.0.0 is the rubicon: it pins
`starknet 10.0.2` and peers `react ^19`.

## Classification

- Moderate-risk. Direct dependency update to the Dojo client library, plus two
  newly declared peer dependencies and one new build-script decision.

## Targets

| Target | From | To | Why |
|---|---|---|---|
| `@dojoengine/sdk` | 1.8.0 | **1.9.0** | Top of the old side |
| `@dojoengine/core` | 1.8.0 | **1.8.8** | The version 1.9.0 pins |
| `@dojoengine/torii-client` | 1.8.0 | **1.8.2** | The version 1.9.0 pins |
| `@dojoengine/utils` | 1.8.0 | **1.8.4** | The version 1.9.0 pins |
| `@effect/platform` | — | **0.93.8** | Newly declared; required peer, see below |
| `@opentelemetry/semantic-conventions` | — | **1.43.0** | Newly declared; required peer, see below |
| `msgpackr-extract` in `allowBuilds` | — | **false** | New install script, denied |

All four `@dojoengine/*` entries move together. Bumping `sdk` alone would leave
the catalog pinning `core`/`torii-client`/`utils` at 1.8.0 while 1.9.0 pins
1.8.8/1.8.2/1.8.4, putting two copies of each in the tree.

`1.8.13` has byte-identical sub-pins to `1.9.0` (same `core` 1.8.8, `grpc`
1.8.7, `state` 1.8.5, `utils` 1.8.4, `torii-wasm` 1.8.2, `torii-client` 1.8.2)
and the same peer ranges, so there is no intermediate rung worth stopping on.

## Release Age

| Target | Published | Age |
|---|---|---|
| `@dojoengine/sdk@1.9.0` | 2026-02-13 | 191 d |
| `@effect/platform@0.93.8` | 2025-12-13 | 253 d |
| `@opentelemetry/semantic-conventions@1.43.0` | 2026-07-09 | 46 d |

All clear `minimumReleaseAge: 10080`.

## Advisory Review

Zero advisories against `@dojoengine/sdk`, `@dojoengine/grpc`,
`@effect/platform`, `@opentelemetry/api`, `@opentelemetry/semantic-conventions`,
`multipasta` or `find-my-way-ts`.

- `effect` has one live high advisory (GHSA-38f7-945m-qr2g, `AsyncLocalStorage`
  context loss under concurrent RPC), patched in 3.20.0. Our existing unscoped
  `effect: 3.20.0` override already closes it, and 1.9.0's `effect ^3.19.4`
  requirement is satisfied by it. No change needed.
- `msgpackr@1.12.1` arrives via `@effect/platform`. Its one advisory
  (GHSA-7hpj-7hhx-2fgx, infinite recursion) patches at 1.10.1. Not affected.

`pnpm audit` after this change: **1 vulnerability, `elliptic` (low), which has
no patched version.**

## Source / Upstream Review

**Why two new peers, and why only two.** From `@dojoengine/grpc@1.8.6`, grpc
depends on `@effect/opentelemetry`, which our `autoInstallPeers: false` +
`strictPeerDependencies` policy correctly surfaced as an install failure:

```
└─┬ @effect/opentelemetry 0.59.3
  ├── ✕ missing peer @effect/platform@^0.93.8
  └── ✕ missing peer @opentelemetry/semantic-conventions@^1.33.0
```

`@effect/opentelemetry@0.59.3` has **zero `dependencies`**. All ten of its
requirements are peers, and seven — `@opentelemetry/api`, `sdk-logs`,
`resources`, `sdk-metrics`, `sdk-trace-web`, `sdk-trace-base`, `sdk-trace-node`
— are `optional: true`. Those seven are never installed and appear in the
lockfile only under `transitivePeerDependencies`. Only the two non-optional ones
need declaring. (`@opentelemetry/api@1.9.1` does enter the tree, but as a direct
dependency of `@dojoengine/grpc`, not as a peer; it is a 0-dependency API shim
that is inert with no SDK registered.)

Note `^0.93.8` on a `0.x` version pins the minor: the satisfying range is
`>=0.93.8 <0.94.0`, so `@effect/platform` is pinned at **0.93.8**, the top of
that line, not at the current 0.97.1.

**Measured, not inferred: none of this reaches the browser.** After building the
client, the bundle contains zero occurrences of `opentelemetry`, `sdk-trace`,
`semantic-conventions`, `@effect/platform`, `msgpackr`, `multipasta`,
`find-my-way` or `node-gyp`. The index chunk grew 225,346 bytes (9,282,047 →
9,507,393, +2.4%), which is dojo.js's own 1.8.0 → 1.9.0 code.

The two declarations are added as `devDependencies` on `sdk` (a build input) and
`dependencies` on `client`. They are deliberately **not** added to the SDK's
`peerDependencies`: the requirement belongs to `@dojoengine/sdk`, which is
already in our peer contract, so consumers resolve it from there.

## Process breach recorded

The `@dojoengine/*` and `@effect/*` candidates were metadata- and
advisory-checked before the manifests were touched. **The transitive arrivals
were not.** `msgpackr`, `msgpackr-extract`, `multipasta`, `find-my-way-ts` and
six `@msgpackr-extract/*` platform binaries were resolved into the local tree
first and checked afterwards.

The outcome is clean — `msgpackr@1.12.1` is past its advisory's 1.10.1 patch, and
the rest carry none — but a clean outcome does not make the order acceptable.
The whole purpose of `autoInstallPeers: false` and `strictPeerDependencies` is
that nothing unreviewed reaches the tree; auditing after the fact inverts that.
Ten packages were fetched on the strength of an assumption.

This breach is why
[exact pinning made mandatory and enforced](2026-08-24-exact-pinning-enforced.md)
adds mechanical gates and why `docs/dependency-reviews/README.md` now states the
order of operations explicitly, including that a transitive arrival is a
dependency entering the tree and gets the same scrutiny as a direct one.

## Lifecycle Scripts

One new install script entered the tree and `strictDepBuilds` caught it:

| Package | Script | Decision |
|---|---|---|
| `msgpackr-extract@3.0.4` | `install: node-gyp-build-optional-packages` | `false` |

`msgpackr-extract` is an optional native accelerator for `msgpackr` (reached via
`@effect/platform`); `msgpackr` falls back to pure JS without it. It is Node-only
and, as measured above, never reaches the browser bundle. Denied, consistent with
the other seven. **No third-party install-script code executes in this
repository.**

## Commands Run

```sh
pnpm install                       # observe the exact peer failure, unmodified
pnpm install                       # after declaring the two peers
pnpm install --force
rm -rf node_modules */node_modules && pnpm install --frozen-lockfile
pnpm exec turbo build
pnpm exec turbo check-types
pnpm test
pnpm audit --json
npm view <pkg> dependencies peerDependencies peerDependenciesMeta scripts time --json
gh api "advisories?ecosystem=npm&affects=<pkg>"
grep -c opentelemetry client/dist/assets/index-*.js
```

## Outcome

- `@dojoengine/*` at the top of the old side. The next move is 2.0.0, which is
  the rubicon.
- Two peers declared explicitly rather than auto-installed; seven optional
  OpenTelemetry peers correctly left uninstalled.
- One new build script found and denied.
- No code changes were required.
- Verification: clean `--frozen-lockfile` install exit 0, `turbo build` green,
  `turbo check-types` clean, `pnpm test` 24/24, `pnpm audit` 1 low
  (`elliptic`, unpatchable).

## Follow-ups

- **`ERR_PNPM_IGNORED_BUILDS` can outlive the decision that resolves it.** After
  adding `msgpackr-extract: false` to `allowBuilds`, the install kept failing —
  including under `pnpm install --force`. The package was correctly registered
  (`pnpm config get ignoredBuiltDependencies --json` listed it), but
  `node_modules/.modules.yaml` still carried it in its `ignoredBuilds` array from
  the run *before* the decision existed, and that stale array is what the error
  reads. Clearing that field made the install pass, and a from-scratch
  `--frozen-lockfile` install then passed cleanly. If a denied build keeps
  failing, suspect `.modules.yaml`, not the declaration.
- **Neither `strings` on the pnpm binary nor `pnpm config get` can tell whether
  a setting exists.** pnpm 10.34.4 ships as a compiled single-executable, so an
  exact-match `strings` grep returns zero hits for `strictDepBuilds` and
  `minimumReleaseAge`, both of which demonstrably work. `pnpm config get <key>
  --json` fails the other way: it echoes back any key present in
  `pnpm-workspace.yaml`, including a fabricated `totallyFakeSettingXyz`. Only the
  published settings reference settles it — and it says
  `minimumReleaseAgeStrict` and `minimumReleaseAgeIgnoreMissingTime` **are** real
  settings, so the 2026-08-23 removal was a regression. Corrected in
  [exact pinning made mandatory and enforced](2026-08-24-exact-pinning-enforced.md).
- **`verifier/package.json` declares `"packageManager": "pnpm@10.10.0"`** against
  the root's 10.34.4, under `packageManagerStrictVersion: true`. Installs pass
  today, but the field is incoherent and should be removed.
