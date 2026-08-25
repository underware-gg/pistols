# Dependency Review: React testing in the client

## Summary

- Date: 2026-08-25
- Scope: give the client the ability to render and test React hooks and
  components, and make the client's tests actually run.

## Classification

- Moderate-risk. Adds test-only dependencies and changes the client's vitest
  environment. No production code or runtime dependency is affected.

## Why now, and why before the lint backlogs

The measured backlogs — 342 `exhaustive-deps` and 223 React Compiler violations
— are behaviour-sensitive refactors. `set-state-in-effect` alone is 94 sites.
Doing that work in a client with no executing tests, which cannot be run here,
means changing behaviour with no way to detect having broken it. Testing first
is what makes the backlogs safe to touch, so this was taken out of order
deliberately.

## Correcting a claim made repeatedly

I have said several times, including in the Brain, that **the client has zero
test files.** That is wrong. `client/tests/version.test.ts` has existed since
`be8d9944` and holds two tests.

The searches behind the claim were scoped to `client/src`, and the file sits in
`client/tests`. The substantive point survives — those tests were **never
running**, because the root `test` script was `cd sdk && pnpm test` — but "zero
test files" was false, and it was repeated rather than checked.

## Targets

| Target | Version | Why |
|---|---|---|
| `happy-dom` | 20.11.2 | DOM environment for rendering |
| `@testing-library/react` | 16.3.2 | Renders hooks and components |
| `@testing-library/dom` | 10.4.1 | Required peer of the above |

**happy-dom over jsdom** on dependency weight: 7 transitive dependencies against
jsdom's 21, and every one has to pass the reviewed-set gate. Both are
script-free and advisory-clean.

Also changed:

- `client/vitest.config.ts` — `environment: "happy-dom"` plus a setup file. The
  SDK stays on `node`; its tests are pure functions and need no DOM.
- `client/src/test/setup.ts` — a global `afterEach(cleanup)` so rendered
  component state cannot leak between tests.
- `turbo.json` — the `test` task was `persistent: true`, which is watch-mode
  shaped. **A persistent task cannot gate anything.** Now `dependsOn: ["^build"]`
  with caching off.
- Root `test` script — was `cd sdk && pnpm test`, now `turbo test`. This is the
  change that makes the client's tests run at all, including inside
  `scripts/verify.sh`, which calls this script.

## Release Age

`happy-dom` 20.11.2 is 17 d. **Its four newest releases are all 5 d old and fail
the gate**, so 20.11.2 is the newest eligible. `@testing-library/react@16.3.2`
is 217 d, `@testing-library/dom@10.4.1` is 393 d.

## Advisory Review

`pnpm candidate` on the three: **exit 0, 16 packages examined, nothing needing a
decision.** No install scripts. `happy-dom` has five advisories, none affecting
20.11.2; the testing-library packages have none.

13 packages entered, all testing-library and happy-dom transitives. `pnpm audit`
unchanged: one accepted low (`elliptic`).

## Source / Upstream Review

Getting a clean review required fixing three bugs in `candidate.mjs` first, all
found by pointing it at this upgrade — see `cd8e5fb9`. The last of those matters
beyond this change: an npm alias (`"react-is-18": "npm:react-is@^18.3.1"`) was
being read as a package name, so the tool fetched a **different, squatted**
package published as `react-is-18`, whose preinstall is `echo This package is
not installable && exit 1`, and reported it as a finding against our tree. It
would equally have reported a clean bill of health for a squat while never
examining the real dependency.

## What the first test pins, and what it cost

`client/src/stores/eventsModelStore.test.tsx` covers the two hooks that needed a
guard in `7d52e0e8`: `useDuelCallToAction` returns `false` for a nullish duel id
rather than throwing on `BigInt(undefined)`, and `useDuelCallToActionWithState`
returns `undefined`. Mutation-checked — removing the guard fails the test.

Two things had to be worked through, worth recording for the next test:

- These hooks reach `useAccount()`, which needs a `StarknetConfig` provider.
  Stubbing the wallet hook is the right scope for a guard test rather than
  standing up a provider tree.
- The stub **must** use `importOriginal`. Replacing `@starknet-react/core`
  wholesale breaks the SDK's own imports from it and the test file fails to
  collect at all.

## Lifecycle Scripts

None of the 13 arrivals carries an install script. `allowBuilds` unchanged.

## Commands Run

```sh
node scripts/candidate.mjs happy-dom@20.11.2 @testing-library/react@16.3.2 @testing-library/dom@10.4.1 --depth 2
PISTOLS_ALLOW_UNREVIEWED=1 pnpm install
node scripts/lockfile-diff.mjs
node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/2026-08-25-client-testing.md
pnpm install && pnpm test && sh scripts/verify.sh
```

## Outcome

- The client can render and test hooks and components.
- **The client's tests run for the first time** — including the pre-existing
  `version.test.ts`, which had never executed in any gate.
- `pnpm test` now covers both packages: sdk 27 tests, client 4.
- Reviewed set 1,010 to 1,024.

## Follow-ups

- The lint backlogs are now safe to start. `set-state-in-effect` (94) first, with
  tests written for each site touched rather than after.
- `client/tests/` and `client/src/**/*.test.tsx` are two conventions for the same
  thing. Pick one; the co-located form is what the SDK uses.
- Provider-dependent hooks will keep needing stubs. When the second or third test
  needs the same `@starknet-react/core` stub, move it into
  `src/test/setup.ts` rather than repeating it.
