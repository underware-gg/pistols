# Dependency Review: Zustand 5 and Immer 11

## Summary

- Date: 2026-08-28
- Scope: update the client state runtime to Zustand 5.0.15 and Immer 11.1.18
  while retaining compatibility for SDK consumers on the preceding majors.
- Classification: moderate-risk state-runtime majors.

## Candidate Review

Both candidates passed the repository candidate gate before manifest changes:
they are older than seven days, non-deprecated, script-free, and unaffected by
known advisories. Zustand's React peer remains compatible with the repository's
React 18 line and its Immer middleware supports the selected Immer version.

The existing Dojo 1 dependency line still resolves Zustand 4 and Immer 10 for
its own declared ranges. This update deliberately changes the application's
direct state runtime without pretending to migrate Dojo: exact resolution and
the final graph diff will account for the retained compatibility copies.

## Compatibility Boundary

The SDK directly consumes Zustand and publishes both libraries as peers. Its
peer contracts widen from Zustand `^4.5.6` and Immer `^10.1.1` to unions that
also accept the new majors. Existing consumers are not forced to change. The
SDK's build-time Zustand version moves to 5 so its public declarations are
checked against the new line.

## Commands Run Before Manifest Changes

```sh
pnpm candidate zustand@5.0.15 immer@11.1.18 --depth 1
pnpm why zustand immer -r
```

## Outcome

- Direct Zustand moved from 4.5.7 to 5.0.15. Dojo SDK 1 retains its own 4.5.7
  copy; Dojo State's prior 5.0.8 copy consolidated onto 5.0.15.
- Direct Immer moved from 10.1.3 to 11.1.18. Dojo SDK 1 retains Immer 10.1.3
  for its own declared range.
- Resolution movement: 0 packages entered, 0 left, and 2 package names moved;
  the graph remains at 843 packages.
- Full workspace verification passed without source changes: dependency policy,
  frozen install, advisories, builds, types, lint, and all 48 tests.
