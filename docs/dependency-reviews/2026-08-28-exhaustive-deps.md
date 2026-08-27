# Lint Review: enforce exhaustive React hook dependencies

## Summary

- Date: 2026-08-28
- Scope: close the A7 hook-dependency backlog in the client and SDK and make
  `react-hooks/exhaustive-deps` a permanent verification gate.

The original lint-coverage review measured 342 violations: 303 in the client
and 39 in the SDK. Six SDK findings disappeared during the intervening async
fetch migration, leaving **336 violations across 138 files** at the start of
this pass: 303 in the client and 33 in the SDK.

All remaining findings are resolved. Both flat configs now set
`react-hooks/exhaustive-deps` to `error`, and both package lint commands use
`--report-unused-disable-directives --max-warnings 0`, so neither a new
violation nor an obsolete exception can pass the gate.

## Implementation

Most fixes add the complete reactive inputs to existing dependency arrays.
The structural cases were handled according to their actual lifecycle:

- UI commands used by effects were stabilised with `useCallback` where their
  identity is part of the effect contract.
- SDK fetch and subscription hooks keep consumer callbacks in a latest-value
  ref. Changing an inline result handler no longer tears down and recreates a
  network request or subscription, while the callback invoked remains current.
- Zustand consumers select stable actions and the smallest data snapshots they
  need. This avoids broad store-object dependencies and prevents result writes
  from retriggering their own fetch effects.
- Intentional invalidation signals remain explicit where mutable backing data
  changes without a new object identity.
- Custom hooks that deliberately accept a caller-owned dependency list, and a
  small number of animation/listener initialisation effects that must not replay
  mid-sequence, carry local explanatory suppressions. Unused suppressions are
  errors.

During the pass, an internal `useMemo` that changed state was corrected to a
`useEffect`, and several request/subscription paths were made independent of
inline callback identities. These are behavioural corrections, not merely
lint appeasement.

## Verification

```sh
pnpm --dir client lint
pnpm --dir sdk lint
pnpm --dir client check-types
pnpm --dir sdk build
CI=true pnpm verify
git diff --check
```

The first non-interactive `pnpm verify` attempt stopped when pnpm asked to
recreate `node_modules`; rerunning with `CI=true` supplied the intended
non-interactive mode. The complete gate passed: frozen install, advisory
policy, builds, types, both lint packages, and all 48 tests.

## Outcome

A7 is closed. Hook dependency correctness is now continuously enforced across
both TypeScript packages rather than retained as a measured backlog.
