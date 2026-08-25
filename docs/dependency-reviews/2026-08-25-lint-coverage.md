# Dependency Review: bring the SDK into lint coverage

## Summary

- Date: 2026-08-25
- Scope: measure the two lint gaps recorded yesterday, and close the one that
  turned out to be closable.

`turbo lint` reached only the client, because `sdk` had no lint script and no
eslint config. **273 SDK source files had never been linted.**

## Classification

- Low-risk. Three devDependencies added at versions already resolved in the
  tree, one internal rename, one new config file.

## The measurement

Both gaps were unknowns. Now they are not:

| Scope | `rules-of-hooks` | `exhaustive-deps` |
|---|---|---|
| `client/src` | 0 (fixed in `7d52e0e8`) | **303** across 117 files |
| `sdk/src` | **3** | **39** across 26 files |

The client's worst `exhaustive-deps` offenders are
`hooks/usePistolsContractCalls.tsx` (14), `pages/internal/QuizTestPage.tsx` (11)
and `components/modals/SelectDuelistModal.tsx` (9).

**The split matters.** `rules-of-hooks` catches real state corruption —
React tracks hook state by call order. `exhaustive-deps` catches stale-value
bugs, which are real but not crashes. 342 of those across both packages is a
backlog, not a gate. 3 of the former is a morning.

Measuring the SDK required resolving eslint plugins from `client/` — the only
package that had them — while keeping `sdk/` as the config base path, since
flat-config `files` patterns are relative to the config's own directory. Two
earlier attempts failed on exactly that, which is why no figure was claimed
until now.

## What the 3 SDK violations were

All three were one problem: `_useSdkGet` in `src/dojo/hooks/useSdkEntities.ts`.
The rule cannot tell an underscore-prefixed internal hook from a plain function
illegally calling hooks, so its `useState`/`useState`/`useEffect` calls were
all reported.

Renamed to `useSdkGetInternal`, matching the convention already applied to 19
client files earlier in this work. No behaviour change; three call sites, all in
the same file. **This is why the gate could be closed today rather than
scheduled**: the serious rule class had no real violations in the SDK at all.

## Targets

| Target | Version | Why |
|---|---|---|
| `eslint` | 9.36.0 | Already in the tree; matches the client |
| `@typescript-eslint/parser` | 8.45.0 | Same |
| `eslint-plugin-react-hooks` | 5.2.0 | Same |
| `sdk/eslint.config.js` | new | `rules-of-hooks` on, `exhaustive-deps` off |
| `sdk` `lint` script | new | Makes `turbo lint` reach the package |

`react-refresh` is deliberately not included: the SDK ships no components.

**Zero packages entered the tree** — all three versions were already resolved,
so `node scripts/lockfile-diff.mjs --strict` reports 0 entered, 0 left, 0 moved,
and the reviewed set is unchanged at 1,025 versions.

## Release Age

339 d, 329 d and 542 d respectively. All clear the seven-day gate.

## Advisory Review

`pnpm audit` unchanged: one finding, `elliptic` (low), unpatchable, accepted.

`@typescript-eslint/parser` and `eslint-plugin-react-hooks`: zero advisories.
`eslint` has two, neither affecting 9.36.0.

**`pnpm candidate` flagged one item, and it is worth recording rather than
waving through: `eslint@9.36.0` is deprecated upstream** — *"This version is no
longer supported."* The deprecation is line-wide: **every 9.x release is
deprecated, including 9.39.5, which carries the `maintenance` dist-tag.** There
is no patch-level escape. `latest` is 10.9.1 and is not deprecated.

Decision: **adopt 9.36.0 in the SDK anyway.** It introduces no new version — the
client already resolves it, so the alternative is either a second eslint version
in the tree or blocking lint coverage behind a major upgrade. Neither is better
than closing the gap now and upgrading both packages together, deliberately.

This is a pre-existing condition being made visible, not one being created. It
went unnoticed until the SDK addition put eslint through `candidate`, which is
the intake tool working as intended on its first real use.

## Source / Upstream Review

Order of operations note, for accuracy: the manifests were edited before
`candidate` was run. That inverts the documented order. The mitigating facts are
that all three versions were already in the reviewed set, so no unreviewed
package could resolve, and `lockfile-diff --strict` proves nothing moved. The
order was still wrong, and it is recorded here rather than tidied away.

## Lifecycle Scripts

None of the three carries an install script. `allowBuilds` unchanged.

## Commands Run

```sh
npx eslint src --rule '{"react-hooks/exhaustive-deps":"error"}' -f json   # client measurement
../client/node_modules/.bin/eslint src --config <probe> --no-config-lookup  # sdk measurement
node scripts/candidate.mjs eslint@9.36.0 @typescript-eslint/parser@8.45.0 eslint-plugin-react-hooks@5.2.0 --depth 0
pnpm install && node scripts/lockfile-diff.mjs --strict
pnpm exec turbo lint
sh scripts/verify.sh
```

The measurement probe config was temporary and removed; it is not committed.

## Outcome

- `turbo lint` now runs in **both** packages and exits 0.
- 273 previously unlinted SDK files are in coverage.
- Manifest specifiers under `check-pins`: 43 → 46, all exact.
- `pnpm verify` green end to end.

## Follow-ups

- **ESLint 9 → 10.** The entire 9.x line is deprecated with no supported patch.
  Both packages must move together. The main breaking change in 10 is the
  removal of `.eslintrc`, and both packages are already on flat config, so this
  is likely cheap — but it is a major upgrade and gets its own record.
- **`exhaustive-deps`: 342 violations** (303 client, 39 SDK). Enabling it is a
  real backlog. It is also the rule class that would have caught the stale
  `useMemo` dependency fixed in `7d52e0e8`, so it is not cosmetic. Worth
  enabling file-by-file rather than all at once.
- The client's config sets three `@typescript-eslint/*` rules while never
  loading that plugin, so those settings are inert. Harmless, but it means the
  config claims coverage it does not have. Tidy when eslint moves.
