# Remaining Dependency Ledger

## Summary

- Date: 2026-08-28
- Scope: every dependency still reported by the registry after all independent,
  compatible-line updates were completed.
- Outcome: there are no remaining safe incremental updates. Every reported item
  below has a concrete compatibility, security, release-age, or runtime-contract
  boundary and an explicit retirement condition.

This ledger distinguishes deferred migrations from neglected updates. Versions
remain pinned until their stated boundary changes; `pnpm outdated` continuing to
list them is expected.

## Coupled Starknet / Dojo / React migration

These packages cross one shared compatibility boundary and must not be advanced
piecemeal:

| Retained | Registry target | Blocking evidence |
| --- | --- | --- |
| `@dojoengine/core` 1.8.8 | 2.0.0 | Dojo Core 2 directly pins `starknet` 10.0.2. |
| `@dojoengine/sdk` 1.9.0 | 2.0.0 | SDK 2 requires React and React DOM 19, their 19.x types, and exact `starknet` 10.0.2. |
| `@dojoengine/utils` 1.8.4 | 2.0.0 | Utils 2 peers exact `starknet` 10.0.2. |
| `starknet` 8.9.2 | 10.0.2 | `@starknet-react/core@5.0.3` peers `starknet ^8.1.2`; `starknetid.js@5.0.0` peers exact 8.5.2. |
| React / React DOM 18.3.1 | 19.2.8 | `@starknet-react/core@5.0.3` peers React 18. |
| React / DOM types 18.x | 19.x | Types remain aligned to the retained React runtime. |
| `@cartridge/connector` 0.13.16 | 0.14.0 | Connector 0.14 requires Controller 0.14 and scoped get-starknet 5. |
| `@cartridge/controller` 0.13.16 | 0.14.0 | Controller 0.14 depends on `starknet ^10.0.2` and RPC types 0.10.2. |

`@starknet-io/types-js` 0.10.3 was also tested independently rather than merely
grouped by association. The SDK declaration build failed because
`PredeployedConnector.request` must implement `@starknet-react/core`'s request
contract from RPC types 0.7.10, while the direct 0.10.3 `RequestFn` is not
assignable to it. The attempted manifest and lockfile changes were fully
reverted. The retained direct version is 0.8.4.

Retirement condition: execute the already-shaped Starknet/Dojo/React migration,
including replacement of the React-18-only connector layer and the deprecated
unscoped get-starknet package, then migrate this group and its public SDK types
together. This is a product/platform migration, not Torii maintenance.

## Toolchain migration boundaries

| Retained | Registry target | Blocking evidence | Retirement condition |
| --- | --- | --- | --- |
| `vite` 6.4.3 | 8.2.2 | Candidate resolution selects `rolldown@1.2.6` and `picomatch@4.0.7`, only one and two days old at review, failing the seven-day gate. | Re-run the candidate review after every selected arrival clears the age gate. |
| `@vitejs/plugin-react` 4.7.0 | 6.1.0 | Plugin 6 peers Vite `^8.0.0`. | Move with Vite 8 after its gate clears. |
| `vite-plugin-mkcert` 1.17.12 | 2.1.0 | Major 2 requires Node `>=22.19.0`; the repository supports `^22.13.0 || >=24`. | Raise the declared Node 22 floor or wait for a compatible release, then review with Vite. |
| TypeScript 5.9.3 | 7.0.2 | `@typescript-eslint/parser` and plugin 8.67.0 peer TypeScript `>=4.8.4 <6.1.0`. | Wait for the lint stack to support TypeScript 7, then migrate compiler and lint tooling together. |
| `@types/node` 22.20.1 | 26.2.0 | Node types express the supported runtime contract, not a free-standing library version. Node 26 types would expose APIs absent from the minimum Node 22 runtime. | Change only with an intentional runtime-floor migration. |

## Exact compatibility and security holds

| Retained | Registry target | Blocking evidence | Retirement condition |
| --- | --- | --- | --- |
| `tsup` 8.5.0 | 8.5.1 | Exact candidate resolution selects `esbuild@0.27.7`, which falls inside two live advisory ranges. | Take a TSUP release that resolves a patched esbuild, or reassess after the advisories are patched upstream. |
| `@effect/platform` 0.93.8 | 0.97.1 | Dojo's `@effect/opentelemetry@0.59.3` requires `@effect/platform ^0.93.8`, whose 0.x caret ceiling is `<0.94.0`. | Move with the Dojo dependency line that replaces this peer requirement. |
| GraphQL 16.14.2 | 17.0.2 | Strict resolution rejects GraphQL 17 because Apollo 4's `graphql-tag@2.12.6` peer range ends at GraphQL 16. | Re-test when `graphql-tag` or Apollo's transitive graph admits GraphQL 17. |
| `react-router` 7.18.2 | 8.3.0 | Router 8 requires React and React DOM `>=19.2.7` and Node `>=22.22.0`, both above retained contracts. | Move with the React 19 and Node-floor migration. |

## Registry anomalies that are not upgrades

- `get-starknet-core@4.0.0` is deprecated and the registry reports 3.3.5 as
  `latest`; downgrading is not an update. It is explicitly present because
  `@starknet-react/core@5.0.3` requires unscoped `get-starknet-core ^4.0.0`.
  The replacement path is scoped `@starknet-io/get-starknet-core@5`, reached by
  the coupled migration above.
- `@cartridge/presets@0.5.4` is newer than the registry's 0.5.2 `latest` tag.
  No downgrade is warranted.
- `semantic-ui-react@3.0.0-beta.2` is newer than the stable 2.1.5 `latest` tag.
  No downgrade is warranted.

## Evidence

```sh
pnpm outdated -r --format json
pnpm candidate <each target> --depth 0
pnpm candidate vite@8.2.2 --depth 1
pnpm view <target> peerDependencies dependencies engines --json
pnpm view '<retained-major-range>' version --json
pnpm --filter @underware/pistols-sdk build
```

The compatible-line sweep separately found and completed versions hidden by the
registry's cross-major `latest` comparison: Node 22 types 22.20.1, React 18
types 18.3.31, and mkcert 1.17.12. Current retained lines for Controller,
Connector, RPC types 0.8, React Router 7, React DOM 18 types, Dojo 1, Starknet 8,
Vite 6, and TypeScript 5 were also checked and are already at their line tops.

Related detailed reviews:

- [dojo.js to the top of the old side](2026-08-24-dojo-js-old-side-top.md)
- [Safe incremental updates](2026-08-27-safe-incremental-updates.md)
- [Apollo Client 4 and GraphQL 17 assessment](2026-08-28-apollo-4-graphql-17.md)
- [Compatible-line cleanup](2026-08-28-compatible-line-cleanup.md)
