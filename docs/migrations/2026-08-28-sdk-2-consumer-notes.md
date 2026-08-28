# Pistols SDK 2.0 consumer migration

`@underware/pistols-sdk` 2.0 moves the public peer contract across the React,
Starknet.js and Dojo.js major-version boundary. It is not published by this
migration branch.

## Required peer family

- React and React DOM 19.
- Starknet.js 10.0.2.
- Dojo core, SDK and utils 2.x; Torii client remains on the compatible 1.8 line.
- Cartridge connector and controller 0.14.x.
- `@starknet-start/react` and its chains, explorers, providers and query
  packages replace `@starknet-react/*`.
- Scoped `@starknet-io/get-starknet-*` 5.x packages replace the old unscoped
  discovery package.

Use the peer ranges in the packed SDK manifest as the source of truth. The
repository's own resolutions remain exact pins and are intentionally stricter
than most consumer ranges.

Starknet Start 1.0.7 still publishes a Starknet 9 hard dependency from
`providers` and a Starknet 9 peer range from `query`, while Dojo SDK 2 requires
Starknet 10.0.2. Until that upstream metadata converges, strict pnpm consumers
must keep the wallet/provider graph on one runtime with these exact rules:

```yaml
overrides:
  "@starknet-start/providers>starknet": 10.0.2
peerDependencyRules:
  allowedVersions:
    "@starknet-start/query>starknet": 10.0.2
```

The SDK consumer fixture applies only these named exceptions and verifies that
React, Starknet and Dojo SDK each resolve to one version.

## Source changes

- Replace imports from `@starknet-react/core` and
  `@starknet-react/chains` with the corresponding `@starknet-start/*` modules.
- Connector values now implement `WalletWithStarknetFeatures`. Their stable ID
  lives at `connector.features['starknet:walletApi'].id`; SDK consumers can use
  the exported `getConnectorId()` helper.
- Connector icons are Wallet Standard data-URI strings, not light/dark objects.
- Starknet Start's public account hook no longer returns an
  `AccountInterface`. Pistols exports its compatibility `useAccount()` from
  `@underware/pistols-sdk/utils/hooks` for transaction-oriented consumers.
- The SDK no longer depends on `starknetid.js`; name and profile lookups use the
  Starknet.js 10 Starknet ID implementation.

Semantic UI remains in the application with an explicitly scoped React 19 peer
exception. It is not part of the SDK's published peer contract.
