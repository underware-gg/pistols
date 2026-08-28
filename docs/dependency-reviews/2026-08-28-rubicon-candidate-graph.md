# Dependency Review: React / Starknet / Dojo.js Rubicon Graph

## Summary

- Date: 2026-08-28
- Scope: move the client and published SDK together to React 19, Starknet.js
  10, Dojo.js 2, Cartridge 0.14, and the renamed Starknet Start connector
  family.
- Classification: coordinated breaking runtime and published-peer migration.
- Execution plan: [Starknet / Dojo.js / React Rubicon Migration](../migrations/2026-08-28-starknet-dojo-react-rubicon.md).

## Classification

High-risk coordinated runtime major. The change crosses wallet, RPC, generated
binding, React-provider, and published SDK peer boundaries, but deliberately
does not change the Cairo world or deploy any remote environment.

## Targets

| Family | Reviewed target |
| --- | --- |
| React | `react@19.2.8`, `react-dom@19.2.8`, `@types/react@19.2.18`, `@types/react-dom@19.2.4` |
| Starknet | `starknet@10.0.2`, `@starknet-io/types-js@0.10.2` |
| Dojo.js | `@dojoengine/core@2.0.0`, `@dojoengine/sdk@2.0.0`, `@dojoengine/utils@2.0.0`; Torii client remains `1.8.2` as required by SDK 2 |
| Cartridge | `@cartridge/connector@0.14.0`, `@cartridge/controller@0.14.0`; presets remains the existing reviewed `0.5.4` prerelease tag |
| Starknet Start | `@starknet-start/react@1.0.8` and `@starknet-start/{chains,explorers,providers,query}@1.0.7` |
| Wallet discovery | `@starknet-io/get-starknet-{core,modal,wallet-standard}@5.0.0` |
| Semantic UI compatibility | `react-is@19.2.8`, admitted only if the React 19 interaction tests demonstrate that the retained UI stack needs it |

`@starknet-io/types-js@0.10.2` is selected instead of the newer 0.10.3 because
Cartridge Controller 0.14 requires 0.10.2 exactly. The direct pin therefore
avoids an unnecessary second 0.10.x line.

## Release Age

All selected targets pass the seven-day gate. The youngest admitted direct
target is Cartridge 0.14.0 at 22 days. React 19.2.8 is 37 days old, Dojo.js 2
is 47 days old, and Starknet 10.0.2 is 119 days old.

`@types/react-dom@19.2.5` was rejected at four days old. Version 19.2.4 is 28
days old and passes a separate exhaustive candidate run. Cartridge's loose
Starknet range would select six-day-old 10.7.1, so that parent edge is
constrained to reviewed 10.0.2.

## Advisory Review

The candidate gate queried advisories for every examined package. React and
React DOM have historical advisories, but none affects 19.2.8. No selected
target or newly resolved arrival is affected by a known advisory.

## Source / Upstream Review

The exhaustive candidate run examined 30 packages. Every reviewed package is
non-deprecated. It surfaced two policy decisions:

1. `@types/react-dom@19.2.5` was only four days old. It was rejected in favour
   of 19.2.4, which is 28 days old and passes a separate exhaustive candidate
   run.
2. Cartridge Controller's `starknet@^10.0.2` dependency would currently float
   to 10.7.1, which is six days old. The graph will constrain that parent edge
   to the reviewed Dojo SDK peer version, 10.0.2.

The registry dist-tags are misleading for two required stable artifacts:
`@starknet-io/get-starknet-core` labels 4.0.8 as `latest`, and
`get-starknet-wallet-standard` labels 5.0.0-beta.0 as `latest`, but stable 5.0.0
artifacts exist, are required exactly by Dojo SDK 2, and passed the candidate
gate.

## Starknet Start Compatibility Decision

Dojo SDK 2 requires `starknet@10.0.2` exactly and depends on Starknet Start
React 1.0.8. That React package still reaches providers 1.0.7, whose manifest
declares a hard `starknet@^9.4.2` dependency, and query 1.0.7, whose peer range
is also `^9.4.2`. Accepting the manifests literally would put Starknet 9 and 10
in one wallet/provider path.

Inspection of the published provider and query artifacts shows imports only
from the stable provider, call-data, enum, hash, number, short-string,
Starknet ID, and paymaster surfaces. The migration will therefore test a
narrow compatibility accommodation:

- constrain the provider dependency to the reviewed Starknet 10.0.2 runtime;
- allow query's stale peer declaration only for Starknet 10.0.2;
- require strict install, typecheck, wallet/provider interaction tests, and a
  single resolved Starknet runtime before accepting the accommodation.

This is not a global peer suppression. If those observed checks fail, the
accommodation is removed and the migration stops for an upstream-compatible
Starknet Start release; a silent dual-runtime wallet boundary is not accepted.

## Lifecycle Scripts

Every direct target and new arrival examined by the candidate gate has no
install script. Lockfile resolution is performed with lifecycle scripts
disabled before the reviewed set is admitted.

## Commands Run

```sh
pnpm candidate react@19.2.8 react-dom@19.2.8 @types/react@19.2.18 \
  @types/react-dom@19.2.5 starknet@10.0.2 @starknet-io/types-js@0.10.2 \
  @dojoengine/core@2.0.0 @dojoengine/sdk@2.0.0 @dojoengine/utils@2.0.0 \
  @cartridge/connector@0.14.0 @cartridge/controller@0.14.0 \
  @starknet-start/react@1.0.8 @starknet-start/chains@1.0.7 \
  @starknet-start/explorers@1.0.7 @starknet-start/providers@1.0.7 \
  @starknet-start/query@1.0.7 @starknet-io/get-starknet-core@5.0.0 \
  @starknet-io/get-starknet-modal@5.0.0 \
  @starknet-io/get-starknet-wallet-standard@5.0.0 react-is@19.2.8
pnpm candidate @types/react-dom@19.2.4
PISTOLS_ALLOW_UNREVIEWED=1 pnpm install --lockfile-only --ignore-scripts
node scripts/lockfile-diff.mjs
```

## Outcome

Controlled resolution succeeds under strict peers. Against the previous
lockfile, six packages enter, 158 leave, and 39 package-version sets move; the
large net removal is chiefly the retired Starknet React/AppKit/WalletConnect
subtree. All six entrants are the reviewed Starknet Start family.

The scoped overrides resolve Dojo, Cartridge, Starknet Start providers, query,
and React against Starknet 10.0.2. Starknet 4.22.0 remains solely beneath the
separate verifier workspace's `starkscan@0.0.11` CLI.

Semantic UI's Portal helpers produced React 19's removed `element.ref` access
warning during the interaction proof. The retained package is patched only at
those two access sites to read `props.ref`; both its ESM and CommonJS artifacts
are covered. The existing `react-is@18.3.1` path correctly recognizes the
tested React 19 elements, so no Semantic-specific `react-is` override was
admitted. Modal, Popup, Dropdown, Form, Menu, Table, Grid, Tab and Button tests
then passed without React compatibility warnings.

## Follow-ups

Before this review is closed:

- the lockfile diff must contain only reviewed versions or separately reviewed
  arrivals;
- strict peer resolution and a frozen install must pass;
- the client and SDK graph must demonstrate one 10.0.2 runtime. The repository
  lockfile retains Starknet 4.22.0 solely beneath the separate verifier
  workspace's `starkscan@0.0.11` CLI; it is not part of the application,
  published SDK, or wallet/provider boundary;
- SDK and client typechecks must prove the scoped Starknet Start accommodation;
- no production deployment or package publish may occur.
