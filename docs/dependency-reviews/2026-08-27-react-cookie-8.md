# Dependency Review: react-cookie 8

## Summary

- Date: 2026-08-27
- Scope: move the client from `react-cookie@6.1.3` to `8.1.2`, aligning its
  cookie implementation with the already-pinned `universal-cookie@8.1.2`.
- Classification: moderate-risk, narrowly used runtime major.

## Candidate Review

`react-cookie@8.1.2` was published 119 days before this review. It is not
deprecated, has no install script, and has no known advisory. Its only React
peer is `>=16.3.0`, satisfied by Pistols' React 18.3.1.

All dependencies are already resolved in the repository at compatible
versions: `universal-cookie@8.1.2`, `hoist-non-react-statics@3.3.2`, and
`@types/hoist-non-react-statics@3.3.7`. The intended resolution should remove
the duplicate `universal-cookie@6.1.3` chain rather than add a runtime package.

## Compatibility Boundary

Pistols imports only the named `useCookies` hook, in four client source files.
It does not use `CookiesProvider`, `withCookies`, server cookie injection, or
package-internal paths. The version-8 package retains the public root export and
adds explicit ESM/CommonJS export conditions; the named-hook import remains on
the supported public surface.

Acceptance requires TypeScript compilation, the production client build, the
client behavioural tests, and the full repository gate to pass. No compatibility
wrapper is warranted for this small direct surface.

## Commands Run Before Manifest Changes

```sh
pnpm candidate react-cookie@8.1.2 --depth 1
npm view react-cookie@8.1.2 version repository homepage engines peerDependencies dependencies dist.tarball --json
npm view react-cookie@6.1.3 types exports main module --json
npm view react-cookie@8.1.2 types exports main module --json
rg -n 'react-cookie|useCookies|CookiesProvider|withCookies' client sdk
```

## Outcome

The controlled resolution produced **0 entered, 1 left, and 3 moved** across
851 resolved package names. `react-cookie` moves from 6.1.3 to 8.1.2; the
duplicate `universal-cookie@6.1.3` line collapses into the already-reviewed
8.1.2 line; and its `cookie@0.7.0` dependency leaves. The sole named departure
is the now-unneeded `@types/cookie@0.6.0`. No additional version needs review.

The reviewed set was regenerated to 1,043 exact `name@version` pairs across
851 packages, and a normal non-bypassed install passed. The focused client
test suite, TypeScript compilation, and production build pass without source
changes. Full `pnpm verify` also passes, including dependency policy, audit,
lint, SDK build, and all 43 workspace tests.

Commands after manifest changes:

```sh
PISTOLS_ALLOW_UNREVIEWED=1 pnpm install
pnpm lockfile-diff
node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/2026-08-27-react-cookie-8.md
pnpm install
pnpm --filter @underware/pistols-at-dawn test
pnpm --filter @underware/pistols-at-dawn build
pnpm verify
```
