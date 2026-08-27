# Dependency Review: Standalone client libraries

## Summary

- Date: 2026-08-28
- Scope: finish the independently testable client-library lines that do not
  participate in the React/Starknet/Dojo rubicon.
- Classification: moderate-risk runtime majors and 0.x lines, kept together as
  the client rendering/toolkit compatibility batch.

## Targets

| Package | Current | Candidate | Decision |
|---|---:|---:|---|
| `dexie-react-hooks` | 1.1.7 | 4.4.0 | remove; no caller exists |
| `@mui/material` | 7.3.2 | 9.3.1 | update |
| `@tweenjs/tween.js` | 21.1.1 | 25.0.0 | update |
| `lil-gui` | 0.19.2 | 0.21.0 | update |
| `three` | 0.180.0 | 0.185.1 | update |
| `@types/three` | 0.180.0 | 0.185.4 | update with Three |

`dexie-react-hooks` has no import, dynamic reference, script, configuration, or
generated-code use anywhere in the repository. The direct Dexie runtime remains
in active use; only the unused React-hooks adapter is removed.

## Candidate Review

Every candidate passes the seven-day release-age gate, is non-deprecated, has
no install script, and is unaffected by known advisories. The relevant peer
contracts remain compatible:

- MUI 9 supports React 18 and the pinned Emotion packages.
- dexie-react-hooks 4 would support Dexie 4 and React 18, but has no caller.
- Three 0.185.1 and its types move together.

The depth-one review found one new types arrival,
`meshoptimizer@1.1.1`; it is 133 days old, script-free, and advisory-clean.
Exact resolution will be checked for additional versions before reviewed-set
generation.

## Source Boundary

MUI is used only for `Slider`. lil-gui is used only in the Three game module.
Three and Tween form the client animation/rendering subsystem and are therefore
verified together. Acceptance requires TypeScript, lint, production bundling,
all tests, and inspection of any compile-time API changes. No compatibility
wrapper is added unless a real changed API requires it.

## Commands Run Before Manifest Changes

```sh
pnpm outdated -r --format json
pnpm candidate dexie-react-hooks@4.4.0 @tweenjs/tween.js@25.0.0 lil-gui@0.21.0 three@0.185.1 @types/three@0.185.4 --depth 1
pnpm candidate @mui/material@9.3.1 react-router@8.3.0 zustand@5.0.15 immer@11.1.18 --depth 1
rg -n 'dexie-react-hooks|useLiveQuery|useObservable' .
rg -n "from ['\"](@mui/material[^'\"]*|@tweenjs/tween.js|three[^'\"]*|lil-gui)['\"]" client/src
```

## Outcome

Resolution produced **0 entered, 2 left, and 15 moved** across 848 resolved
package names. The departures are the unused `dexie-react-hooks@1.1.7` and
obsolete `@webgpu/types@0.1.66`. The exact MUI graph additionally selected
`@mui/private-theming@9.3.0`, `@mui/styled-engine@9.3.0`, and
`react-is@19.2.8`; all three passed explicit candidate review before reviewed-set
generation.

Two compile-time API changes required direct fixes:

- lil-gui now restricts controller keys to public members, correctly exposing
  that `windUpdateFPS` is externally mutated by the GUI; the field is public.
- Three's Reflector now defines `dispose` as an instance property. The subclass
  composes that function in its constructor and adds geometry disposal instead
  of declaring an unreachable prototype override. This also makes the cleanup
  behaviour the old code intended actually execute.

The reviewed set remains 1,041 exact `name@version` pairs while the resolved
package-name count falls from 850 to 848. A normal non-bypassed install and full
`pnpm verify` pass, including dependency policy, audit, lint, both production
builds, TypeScript, and all 43 workspace tests.

Commands after manifest changes:

```sh
PISTOLS_ALLOW_UNREVIEWED=1 pnpm install
pnpm lockfile-diff
pnpm candidate @mui/private-theming@9.3.0 @mui/styled-engine@9.3.0 react-is@19.2.8 --depth 0
pnpm --filter @underware/pistols-at-dawn check-types
pnpm --filter @underware/pistols-at-dawn test
node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/2026-08-28-standalone-client-libraries.md
pnpm install
pnpm verify
```
