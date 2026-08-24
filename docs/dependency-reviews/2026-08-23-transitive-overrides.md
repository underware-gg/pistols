# Dependency Review: transitive advisory overrides

## Summary

- Date: 2026-08-23
- Scope: close the transitive advisories left open by the supply-chain policy
  adoption earlier the same day.
- Starting point: 119 open alerts, all transitive, none critical.
- Result: **153 of the original 154 alerts closed.** One remains, and it has no
  patched version.

## Classification

- Moderate-risk. No direct dependency changes; every change forces a
  transitive version through `overrides`. The risk is behavioural — a forced
  version that a consumer cannot use.

## Targets

Two override shapes, chosen per package:

**Unscoped**, only where the package is present at exactly one major version in
the tree, so an unscoped override cannot cross a major boundary:

`@babel/core` 7.29.6 · `@grpc/grpc-js` 1.14.4 · `ajv` 6.14.0 · `defu` 6.1.5 ·
`effect` 3.20.0 · `flatted` 3.4.2 · `follow-redirects` 1.16.0 ·
`form-data` 4.0.6 · `h3` 1.15.9 · `immutable` 5.1.8 · `js-yaml` 4.3.1 ·
`lodash` 4.18.0 · `lodash-es` 4.18.0 · `nanoid` 3.3.18 · `postcss` 8.5.23 ·
`rollup` 4.59.0 · `validator` 13.15.22

**Parent-scoped** (`parent>child`), for every package present at several major
versions, so each consumer stays inside its own line:

| Override | Reason |
|---|---|
| `starkscan>axios` 0.33.0 | keeps the 0.x line |
| `vite-plugin-mkcert>axios` 1.18.0 | keeps the 1.x line |
| `elliptic>bn.js` 4.12.3, `starknet>bn.js` 5.2.3 | 4.x and 5.x both live |
| `minimatch@3.1.4>brace-expansion` 1.1.18 | minimatch 3 declares `^1.1.7` |
| `minimatch@9.0.7>brace-expansion` 5.0.9 | minimatch 9.0.6+ declares `^5.0.2`, and 5.x advisories patch at 5.0.9 |
| `@eslint/config-array>`, `@eslint/eslintrc>`, `copyfiles>`, `eslint>`, `glob@7.2.3>minimatch` 3.1.4 | 3.x consumers |
| `@typescript-eslint/typescript-estree>`, `glob@10.5.0>minimatch` 9.0.7 | 9.x consumers |
| `cosmiconfig>yaml` 1.10.3 | the sole consumer of the vulnerable `yaml@1.10.2` |
| `anymatch>`, `micromatch>picomatch` 2.3.2 | 2.x consumers |
| `fdir>`, `tinyglobby>`, `vite>`, `vitest>picomatch` 4.0.4 | 4.x consumers |
| `@walletconnect/jsonrpc-ws-connection>ws` 7.5.11 | 7.x consumer |
| `isows>`, `viem>`, `ethers>ws` 8.21.0 | 8.x consumers |
| `external-editor>tmp` 0.2.6 | sole consumer; **crosses a major**, see below |
| `universal-cookie@6.1.3>cookie` 0.7.0 | version-scoped: only 6.1.3 declares `^0.6.0`. `universal-cookie@8.0.1` declares `^1.0.2` and keeps cookie 1.x, as does `react-router` |
| `copyfiles>glob` 7.2.3 | pinned deliberately; see below |
| `sucrase>glob` 10.5.0 | the vulnerable copy |
| `vite-plugin-top-level-await>uuid` 11.1.1 | **crosses a major**; see below |

## Release Age

All targets are published releases well beyond the seven-day gate, and the
install succeeds under `minimumReleaseAge: 10080`, which is the operative
check.

## Advisory Review

**Closed: 153 of 154.**

Remaining: `elliptic@6.6.1` — *Uses a Cryptographic Primitive with a Risky
Implementation*, low severity, **no patched version exists**. Accepted. It is
reached through `starknet`, so it retires when that dependency chain changes.

## Source / Upstream Review

Three decisions worth stating.

**`glob` must not be unified.** An unscoped `glob: 10.5.0` broke the SDK build
with `TypeError: glob is not a function`: `copyfiles@2.4.1` needs glob 7's
callable export, while the vulnerable copy was `sucrase`'s glob 10. The fix is
two parent-scoped overrides, one pinning `copyfiles>glob` at 7.2.3 explicitly
so a future blanket override cannot re-break it.

**Two overrides cross a major**, and they are the only two: `external-editor>tmp`
(0.0.33 → 0.2.6, against a declared `^0.0.33`) and
`vite-plugin-top-level-await>uuid` (10 → 11). Both consumers are dev/build-time
only. `tmp` has no fix inside 0.0.x, so closing its advisories requires the
crossing; `external-editor` calls `tmpNameSync`/`fileSync`, which both still
exist in 0.2.x.

`uuid` 10 → 11 is accepted because its only consumer is
`vite-plugin-top-level-await`, a build-time plugin, and build, typecheck and
tests all pass. It is the first override to revisit if the client build ever
misbehaves.

## Lifecycle Scripts

Unchanged. `allowBuilds` still denies all seven packages. No forced version
introduced a new install script; `strictDepBuilds` would have failed the
install if one had.

## Commands Run

```sh
pnpm install
pnpm exec turbo build
pnpm exec turbo check-types
pnpm test
```

Each override batch was applied and verified separately rather than in one
pass, which is how the `glob` breakage was attributed.

## Outcome

- 153 of 154 alerts closed. The one remaining is `elliptic@6.6.1` (low), which
  has no patched version.
- Two overrides cross a major boundary — `external-editor>tmp` and
  `vite-plugin-top-level-await>uuid` — both dev/build-time only and both
  documented above. Every other override stays inside the range its dependers
  declare.
- Verification: `turbo build` green, `turbo check-types` clean, `pnpm test`
  24/24.

## Corrections applied after review

An initial version of this pass shipped three defects, all caught by review
before commit and fixed here:

- **`minimatch@9.0.7>brace-expansion` was set to 2.1.4**, but minimatch 9.0.6+
  declares `^5.0.2` and consumes the *named* `expand` export, which
  brace-expansion 2.x (a bare `module.exports = fn`) does not provide. That
  would have thrown `TypeError: expand is not a function` on any brace pattern
  reaching `@typescript-eslint/typescript-estree` or `sucrase`'s glob — latent,
  since no current config passes one. Now 5.0.9, verified directly:
  `minimatch('src/a.ts', '**/*.{ts,tsx}')` returns true.
- **`yaml` was overridden unscoped**, justified as single-major. It is not:
  `vite@6.4.3` and `postcss-load-config@6.0.1` both declare `yaml ^2.4.2` as an
  optional peer. Now scoped to `cosmiconfig`, the only consumer of the
  vulnerable 1.10.2.
- **`universal-cookie>cookie` was under-scoped**, catching `universal-cookie@8.0.1`
  (which declares `^1.0.2`) as well as the intended 6.1.3. Now version-scoped.

Also removed from `pnpm-workspace.yaml`: `minimumReleaseAgeStrict` and
`minimumReleaseAgeIgnoreMissingTime`, which **are not pnpm settings**. Verified
against the running 10.34.4 binary — `minimumReleaseAge` and
`minimumReleaseAgeExclude` appear in it, those two do not, in any spelling.
They were silently ignored, so the policy file advertised two gates that did
not exist. The lesson generalises: the lockfile `settings:` block only records
resolution-affecting settings, so it cannot confirm that a policy key was
understood.

## Follow-ups

- **`pnpm`'s `name@range` override selector does not do what it looks like.**
  Keys such as `cookie@0` and `glob@10` collapsed those packages to a single
  version across the whole tree rather than scoping to the matching major.
  Use `parent>child` for anything version-sensitive. This cost a debugging
  cycle and is worth remembering.
- A stale `parent@version>child` key silently stops matching when the parent is
  itself overridden. `glob@10.4.5>minimatch` had to be retargeted to
  `glob@10.5.0>minimatch` after `sucrase>glob` moved. Re-check scoped keys
  whenever a parent version changes.
- `starkscan` still pins the old `axios` line. The override handles the
  advisories, but the dependency remains unmaintained.
- Revisit `elliptic` when `starknet` next moves.
- ~~**`pnpm lint` is broken and was before this work**~~ — the config half is
  fixed: the client now has a flat `eslint.config.js`, ported at exact parity.
  Lint still exits non-zero on **195 `react-hooks/rules-of-hooks` violations
  across 20 files**, which the broken config had been hiding. 187 are a naming
  convention (19 underscore-prefixed components and hooks, e.g. `_BarkeepModal`,
  `_usePool`, which the rule cannot recognise as components or hooks); 8 are
  genuine conditional hook calls and the only ones with real bug potential.
  Neither is a dependency concern.

## Corrections applied 2026-08-24

**The claim that `minimumReleaseAgeStrict` and
`minimumReleaseAgeIgnoreMissingTime` "are not pnpm settings" is wrong.** Both are
documented pnpm settings under *Dependency Resolution*, alongside
`minimumReleaseAge`, `minimumReleaseAgeExclude` and
`minimumReleaseAgeExcludePrune`. Removing them from `pnpm-workspace.yaml` was a
regression, not a cleanup, and it was acted on without checking the settings
reference.

It also mattered. **`minimumReleaseAgeIgnoreMissingTime` defaults to `true`,
which skips the release-age check entirely for any package whose registry
metadata lacks a `time` field.** Deleting the explicit `false` reopened that
bypass and left the policy file advertising a seven-day gate that a package with
absent publish metadata could walk straight through. Both settings are restored,
fail-closed, in
[exact pinning made mandatory and enforced](2026-08-24-exact-pinning-enforced.md).

**The method used to reach that conclusion was also invalid**, and so was the
method used to correct it. `strings` on the pnpm binary returns zero exact hits
for settings that demonstrably work (`strictDepBuilds`, `minimumReleaseAge`),
because pnpm 10.34.4 ships as a compiled single-executable. `pnpm config get
<key> --json` is no better as an existence test: it echoes back any key present
in `pnpm-workspace.yaml`, including `totallyFakeSettingXyz`, verified with a
control. Neither test distinguishes "pnpm implements this" from "this string is
in my config file". Only the published settings reference does.

The `overrides` content of this record stands as written.
