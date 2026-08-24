# Dependency Review: climb to the old-side ceiling

## Summary

- Date: 2026-08-23
- Scope: move to the newest versions reachable **without** crossing to
  starknet.js 10 / React 19, which is a separate and much larger piece of work.

The starknet ecosystem has split. `@starknet-react/core@5.0.3` — already its
latest release — peers on `starknet ^8.1.2` and `react ^18`, and we use it in 95
places across 99 files. `starknetid.js@5.0.0`, also latest, pins `starknet 8.5.2`
exactly. Neither can follow to starknet 10, so the old side is where we live
until both are replaced.

This review takes the old side as far as it goes.

## Classification

- Moderate-risk. Direct dependency updates to the wallet connector and the
  chain client, with no code changes.

## Targets

| Target | From | To | Why |
|---|---|---|---|
| `starknet` | 8.5.4 | **8.9.2** | Top of the 8.x line; `@starknet-react/core` and dojo.js both cap at `^8`, so 9.x is unreachable |
| `@cartridge/controller` | 0.10.7 | **0.13.16** | Adds `ControllerOptions.toriiUrl`, and carries a fixed hpke chain |
| `@cartridge/connector` | 0.10.7 | **0.13.16** | Matches the controller pin it depends on |
| `starknetid.js>starknet` peer exception | 8.5.4 | **8.9.2** | Retargeted to the new pin |
| `@hpke/core` override | 1.7.5 | **removed** | Retirement condition met — see below |

`starknet` is 257 days old, Cartridge 0.13.16 is 32 days old; both clear the
seven-day gate.

## Deferred: dojo.js 1.9.0

`@dojoengine/sdk@1.9.0` stays on the old side — it peers `starknet ^8.1.2` and
`react ^18 || ^19` — so it was in scope for this climb. **It is deliberately not
taken.**

It pins `@dojoengine/grpc@1.8.7`, which depends on `@effect/opentelemetry@0.59.3`,
which pulls the entire OpenTelemetry SDK: `sdk-trace-web`, `sdk-trace-node`,
`sdk-trace-base`, `sdk-metrics`, `sdk-logs`, `resources`, `api`, plus
`@effect/platform` and `effect` itself. Two of those arrive as *unmet peer
dependencies* that we would have to declare ourselves, and the install fails
under `strictPeerDependencies` until we do.

That is a telemetry stack shipped into a browser bundle, in exchange for no
feature we have named a need for. 1.8.0 remains pinned. Revisit only if
something concrete requires 1.9.0, and price the bundle cost when doing so.

## Release Age

Both targets clear `minimumReleaseAge: 10080`, verified by the install
succeeding.

## Advisory Review

**153 of 154 alerts remain closed** — unchanged by this climb. The only open
alert is still `elliptic@6.6.1` (low), which has no patched version.

The notable change is that one override is now **unnecessary and would be
actively wrong to keep**:

- `@cartridge/controller@0.13.16` pulls `@turnkey/sdk-browser@5.16.1`, which
  depends on `hpke-js@1.8.0`, which requires `@hpke/core ^1.9.0`.
- Our override pinned `@hpke/core` to **1.7.5**, which no longer satisfies that
  range. Left in place it would have forced an incompatible version.
- Removed. `@hpke/core` now resolves to **1.9.0** naturally, well past the
  vulnerable `<= 1.7.4`, so the critical stays closed with no override at all.

This is exactly the retirement condition recorded when the override was added,
and it fired one step later. Worth noting as a pattern: an override that pins a
transitive *below* where its parent is heading becomes a liability the moment
the parent moves.

## Source / Upstream Review

`ControllerOptions.toriiUrl` confirmed present in the installed
`@cartridge/controller@0.13.16` type definitions (`dist/index.d.ts:525`). This
was the stated reason for wanting `>= 0.13.13` and it directly serves the
self-hosted torii work.

**Nothing wires it yet.** The client's existing `toriiUrl` references are its
own status-query hooks, not Controller options. Passing it to the Controller is
separate work.

## Lifecycle Scripts

Unchanged. `allowBuilds` still denies all seven packages, and no new install
script entered the tree — `strictDepBuilds` would have failed the install.

## Commands Run

```sh
pnpm install
pnpm exec turbo build
pnpm exec turbo check-types
pnpm test
```

starknet + dojo.js and Cartridge were applied as separate steps so a failure
would be attributable. That is how the dojo.js OpenTelemetry cost surfaced.

## Outcome

- starknet at the top of 8.x; Cartridge at the top of 0.13.x.
- One override retired rather than carried.
- No code changes were required — the client typechecks and builds unchanged
  against starknet 8.9.2 and Controller 0.13.16.
- Verification: `turbo build` green, `turbo check-types` clean, `pnpm test` 24/24.

## Follow-ups

- **Wire `ControllerOptions.toriiUrl`** — now available, still unused.
- **dojo.js 1.9.0** stays deferred on bundle-cost grounds. Reassess if a
  concrete need appears.
- The rubicon crossing (starknet 10, React 19, dojo.js 2.0, Controller 0.14,
  replacing `@starknet-react/core` and `starknetid.js`) is the next dependency
  milestone and is a project, not an update.
- `lodash@4.18.0` and `lodash-es@4.18.0`, the advisory-patched versions our
  overrides force, are themselves flagged deprecated by npm. Harmless but worth
  understanding before the next overrides pass.

## Corrections applied 2026-08-24

Two claims in this record were wrong, and both are corrected in
[dojo.js to the top of the old side](2026-08-24-dojo-js-old-side-top.md).

**The "Deferred: dojo.js 1.9.0" section above is factually wrong.** It states
that 1.9.0 "pulls the entire OpenTelemetry SDK" into a browser bundle. It does
not. `@effect/opentelemetry@0.59.3` has **zero `dependencies`** — all ten of its
requirements are `peerDependencies`, and seven are marked `optional: true` in
`peerDependenciesMeta`. With `autoInstallPeers: false` those seven are never
installed; they appear in the lockfile only under `transitivePeerDependencies`.
Verified by installing 1.9.0 and grepping the built client bundle: **zero**
occurrences of `opentelemetry`, `sdk-trace`, `semantic-conventions`,
`@effect/platform` or `msgpackr`. The reasoning was inferred from an install
failure rather than measured, and the conclusion did not follow.

**More importantly, this record's own title overstates what it achieved.** It
claims a climb to the old-side ceiling while leaving `@dojoengine/*` at 1.8.0.
The old side actually runs to **1.9.0** — nine releases further on. `1.8.5`
through `1.8.13` and `1.9.0` all peer `starknet ^8.1.2`, so every one of them
was in scope and none was taken. This was an incomplete climb, not a considered
deferral.

The `starknet` and Cartridge portions of this record stand as written.
