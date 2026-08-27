# Dependency Review: Apollo Client 4 and GraphQL 17 assessment

## Summary

- Date: 2026-08-28
- Scope: update the SDK's published GraphQL subpath to Apollo Client 4.2.12,
  assess GraphQL 17.0.2, and retain Apollo 3 consumer compatibility.

## Classification

- Moderate-risk published-SDK dependency major. The runtime line moves to
  Apollo 4 while the published peer contract continues to admit Apollo 3.

## Targets

| Target | Version | Purpose |
|---|---:|---|
| `@apollo/client` | 4.2.12 | SDK build-time provider and current runtime line |
| `apollo-client-3` | `npm:@apollo/client@3.14.0` | Test-only compatibility provider |
| `graphql` | 16.14.2 | Shared supported GraphQL peer; 17 was assessed and rejected |
| `rxjs` | 7.8.2 | Required Apollo 4 peer |

## Release Age

- Apollo Client 4.2.12: passed the seven-day release-age gate.
- Apollo Client 3.14.0: 371 days old at review time.
- RxJS 7.8.2: 551 days old at review time.
- GraphQL 17.0.2 passed the age gate but was not admitted because the current
  `graphql-tag` peer contract excludes it.

## Advisory Review

`pnpm candidate` reported no advisories for Apollo Client 3.14.0 or 4.2.12,
their newly entering transitives, or RxJS 7.8.2. The repository audit remains
at the separately recorded accepted low-severity `elliptic` advisory.

## Source / Upstream Review

Apollo 3 and Apollo 4 both expose the root APIs and the `/react` hook subpath
used by the SDK. The executable compatibility test imports those exact public
surfaces from both installed versions. GraphQL 17 remains blocked by the
published `graphql-tag@2.12.6` peer boundary.

## Lifecycle Scripts

Apollo Client 3.14.0, Apollo Client 4.2.12, RxJS 7.8.2, and the five Apollo 3
compatibility transitives have no install scripts. `allowBuilds` is unchanged.

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
new line. An exact `npm:` alias installs Apollo 3.14.0 alongside it, and a
compatibility test imports every Apollo API used by the published GraphQL
subpath from both majors. The catalog-drift guard now parses quoted union ranges
and evaluates each supported member, so it continues proving that the pinned
build version is inside the published contract.

## Commands Run

The candidate commands below ran before manifest changes; resolution and full
verification followed after the review record was updated.

```sh
pnpm candidate @apollo/client@4.2.12 graphql@17.0.2 --depth 1
pnpm candidate rxjs@7.8.2 --depth 0
pnpm candidate @apollo/client@3.14.0
pnpm why rxjs -r
```

## Outcome

- Apollo Client moved from 3.14.0 to 4.2.12.
- GraphQL remains at 16.14.2 because `graphql-tag@2.12.6` rejects GraphQL 17
  under strict peer resolution.
- RxJS 7.8.2 is declared explicitly as Apollo 4's SDK development peer.
- Apollo 3.14.0 remains installed under the `apollo-client-3` test-only alias;
  its five compatibility internals (`rehackt`, `symbol-observable`,
  `ts-invariant`, `zen-observable`, and `zen-observable-ts`) therefore remain in
  the reviewed graph.
- The compatibility test exercises the root and `/react` public imports used by
  the SDK against Apollo 3.14.0 and Apollo 4.2.12.
- Full workspace verification passes: dependency policy, frozen install,
  advisories, builds, types, lint, and all 63 tests.

## Follow-ups

- Reassess GraphQL 17 when `graphql-tag` publishes a compatible peer range.
- Remove the Apollo 3 alias and the `^3.11.8` peer member together when the SDK
  intentionally ends Apollo 3 support.
