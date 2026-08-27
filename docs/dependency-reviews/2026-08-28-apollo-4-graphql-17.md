# Dependency Review: Apollo Client 4 and GraphQL 17 assessment

## Summary

- Date: 2026-08-28
- Scope: update the SDK's published GraphQL subpath to Apollo Client 4.2.12,
  assess GraphQL 17.0.2, and retain Apollo 3 consumer compatibility.
- Classification: moderate-risk published-SDK dependency major.

## Candidate Review

Apollo Client 4.2.12 and GraphQL 17.0.2 pass the seven-day release-age gate,
are non-deprecated, have no install scripts, and are unaffected by known
advisories. Apollo 4 accepts GraphQL 16 or 17 and requires RxJS `^7.3.0`.
`rxjs@7.8.2` is already resolved elsewhere in the repository; it was explicitly
candidate-checked, is 551 days old, script-free, and advisory-clean before being
declared as the SDK's build-time peer provider.

All depth-one Apollo dependencies were already present at compatible versions.
Strict resolution then proved that GraphQL 17 could not enter the tree:
Apollo's transitive `graphql-tag@2.12.6` peer range ends at GraphQL 16. The SDK
therefore remains on GraphQL 16.14.2 until that compatibility boundary moves.

## Compatibility Boundary

The SDK has two Apollo source files, both under the published `./dojo/graphql`
subpath. Apollo 4 moves React hooks out of its root entry point. Apollo 3 already
provides the same `@apollo/client/react` public subpath, so importing `useQuery`
there supports both majors without a compatibility shim. Core client and `gql`
imports remain on the root entry point.

Apollo 4 also removes the client constructor's `uri` shortcut and the cache's
`addTypename` option. The client now declares an `HttpLink` explicitly and uses
the default `InMemoryCache`. The local query wrapper is generic and the token
balance query declares its response shape, preserving useful types under
Apollo 4's `unknown` data default.

The published Apollo peer range widens from `^3.11.8` to
`^3.11.8 || ^4.0.0`; existing consumers are not forced to migrate. The SDK's
development dependency moves to 4.2.12 so the build and declarations verify the
new line. The catalog-drift guard now parses quoted union ranges and evaluates
each supported member, so it continues proving that the pinned build version is
inside the published contract.

## Commands Run Before Manifest Changes

```sh
pnpm candidate @apollo/client@4.2.12 graphql@17.0.2 --depth 1
pnpm candidate rxjs@7.8.2 --depth 0
pnpm why rxjs -r
```

## Outcome

- Apollo Client moved from 3.14.0 to 4.2.12.
- GraphQL remains at 16.14.2 because `graphql-tag@2.12.6` rejects GraphQL 17
  under strict peer resolution.
- RxJS 7.8.2 is declared explicitly as Apollo 4's SDK development peer.
- Resolution movement: 0 packages entered, 5 left, and 1 moved. The removed
  packages are Apollo 3 compatibility internals (`rehackt`,
  `symbol-observable`, `ts-invariant`, `zen-observable`, and
  `zen-observable-ts`).
- Full workspace verification passed: dependency policy, frozen install,
  advisories, builds, types, lint, and all 48 tests.
