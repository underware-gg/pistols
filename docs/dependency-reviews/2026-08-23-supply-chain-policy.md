# Dependency Review: supply-chain policy adoption

## Summary

- Date: 2026-08-23
- Scope: establish repository-owned pnpm install controls, pin the package
  manager exactly, and close every advisory that a patched version already
  inside our declared ranges could close.
- The repository had been idle for roughly eight months. GitHub reported 154
  open Dependabot alerts on `main` (3 critical, 76 high, 68 moderate, 7 low).

## Classification

- Elevated-risk. The change controls which future packages and lifecycle
  scripts may enter the dependency graph, and it alters how every contributor's
  install behaves.

## Targets

| Target | From | To | Why |
|---|---|---|---|
| `pnpm` | 10.20.0 | **10.34.4** | Exact package-manager pin. Most policy settings below do not exist in 10.20. Matches `pistols-web`. |
| `turbo` | `^2.5.8` | **2.9.14** | Advisory-clean, exact. |
| `vitest` (sdk, client) | `^3.0.5` | **3.2.6** | Closes a critical. |
| `react-router` | `^7.1.1` | **7.18.0** | Closes 13 alerts, 7 of them high. |
| `vite` | `^6.0.5` | **6.4.3** | Closes 5 alerts. |
| `graphql` | — | **16.14.2** | Newly declared; see Lifecycle / peers below. |
| `get-starknet-core` | — | **4.0.0** | Newly declared; deprecated. See below. |
| catalog `starknet` | `^8.5.4` | **8.5.4** | Exact, so the peer exception below is stable. |
| catalog `starknetid.js` | `^5.0.0` | **5.0.0** | Exact. |

Remaining direct dependencies keep their ranges and convert on next review, per
the convention in `README.md`. Converting all 65 at once would crystallise ~57
unreviewed version decisions, which is what this policy exists to prevent.

## Release Age

Minimum policy: seven days (`minimumReleaseAge: 10080`), strict, and failing
when release-age metadata is missing.

All targets pass with wide margin:

| Target | Published | Age |
|---|---|---|
| `react-router@7.18.0` | 2026-06-16 | 67 d |
| `vite@6.4.3` | 2026-06-01 | 82 d |
| `vitest@3.2.6` | 2026-06-01 | 82 d |
| `turbo@2.9.14` | 2026-05-14 | 100 d |
| `graphql@16.14.2` | 2026-06-09 | 74 d |

## Advisory Review

Sources: GitHub Advisory Database via `gh api advisories`, the repository's
Dependabot alert set, and npm registry metadata.

**Closed by this change: 35 of 154 alerts, including all three criticals.**

- `vitest` 3.2.4 → 3.2.6 — critical, arbitrary file read/execute when the
  Vitest UI server is listening.
- `@hpke/core` 1.7.4 → 1.7.5 via `overrides` — critical, AEAD nonce reuse.
  This is the only alert that reached players' browsers: it arrives through
  `hpke-js` → `@turnkey/sdk-browser` → `@cartridge/controller@0.10.7`.
- `protobufjs` 7.5.4 → 7.6.5 via `overrides` — critical, arbitrary code
  execution. Reached through `@grpc/proto-loader` → `@grpc/grpc-js` →
  `@dojoengine/sdk`. We import only the `react` and `sql` subpaths and
  `@grpc/grpc-js` is the Node implementation, so this is very likely not in the
  browser bundle — but it is a critical with a patch available in range.
- `react-router`, `vite`, `turbo` — the remainder.

**Still open: 119 alerts, all transitive, none critical.** The largest cluster
is `axios` (51 alerts), which is two stale versions reached through
`starkscan` in `/verifier` and `vite-plugin-mkcert`; neither ships in the game.
Closing the rest is `overrides` work and wants its own reviewed pass —
`pistols-web`'s override set already covers most of the named packages
(`postcss`, `immutable`, `lodash`, `lodash-es`, `ajv`, `flatted`, `js-yaml`,
`yaml`, `picomatch`, `minimatch`, `brace-expansion`) and is the natural basis
for it. **Adopting this policy did not clear the tree.**

`elliptic` (low) has no patched version and is accepted.

## Source / Upstream Review

- `pnpm-lock.yaml` contains no Git, file, link, or URL-style dependency
  sources, so `blockExoticSubdeps` is satisfied by the existing tree.
- Two newly declared packages required scrutiny:
  - **`get-starknet-core@4.0.0` is deprecated** — *"Package no longer
    supported. Please use @starknet-io/get-starknet-core"* — and sits on the
    `next` dist-tag, not `latest` (which is 3.3.5). It is nonetheless the only
    version satisfying `@starknet-react/core@5.0.3`'s `^4.0.0` peer, and
    `@starknet-react/core` is already at its latest release. It has **zero
    advisories** and **no install lifecycle scripts**.

    It was previously in the tree *undeclared*, invented by `autoInstallPeers`,
    while the catalog separately declares the maintained scoped replacement
    `@starknet-io/get-starknet-core@4.0.7`. Both were present, one invisibly.
    Declaring it makes the debt visible. **Retires when
    `@starknet-react/core` is replaced at the starknet 10 crossing.**
  - `graphql@16.14.2` — peer of `@apollo/client`, which backs the SDK's
    published `./dojo/graphql` export subpath. Its single advisory affects
    `>= 16.3.0, < 16.8.1`; 16.14.2 is clear.
- `starknetid.js@5.0.0` and `@starknet-react/core@5.0.3` both have zero
  advisories. Deprecated is not the same as vulnerable.

## Lifecycle Scripts

`strictDepBuilds: true` and `dangerouslyAllowAllBuilds: false`. Verified that
an empty `allowBuilds` **fails** the install rather than defaulting to off:

```
ERR_PNPM_IGNORED_BUILDS  Ignored build scripts: @parcel/watcher@2.6.0,
@reown/appkit@1.8.19, @swc/core@1.16.0, cbor-extract@2.2.2, es5-ext@0.10.64,
esbuild@0.25.12, esbuild@0.27.7, esbuild@0.28.2, protobufjs@7.6.5
```

Seven packages carry install scripts. **All seven are denied.** Every one was
already being silently ignored under pnpm 10's default, and the repository
builds correctly without them, so denial preserves existing behaviour while
making the decision explicit:

| Package | Script | Decision |
|---|---|---|
| `esbuild` | `postinstall: node install.js` | `false` |
| `@parcel/watcher` | `install: node scripts/build-from-source.js` | `false` |
| `@reown/appkit` | `postinstall: node scripts/appkit-version-check.js` | `false` |
| `cbor-extract` | `install: node-gyp-build-optional-packages` | `false` |
| `es5-ext` | `postinstall: node -e "try{require('./_postinstall')}catch(e){}"` | `false` |
| `@swc/core` | `postinstall: node postinstall.js` | `false` |
| `protobufjs` | (none in 7.6.5) | `false` |

Two are worth denying on their own merits: `@reown/appkit`'s script is a
version check that calls out, and `es5-ext`'s is the error-swallowing
`postinstall` hook that package has previously used to print messages.

**No third-party install-script code executes in this repository.**

## Peer dependency changes

`autoInstallPeers: false` and `strictPeerDependencies: true` exposed a
structural gap: **`@underware/pistols-sdk` declared 18 `peerDependencies` and
no `devDependencies` for its own build inputs**, relying on `autoInstallPeers`
to materialise them. 17 of the 18 are imported by `sdk/src` (`immer` is not).

Fix: the 17 imported peers are now also `devDependencies` (as `catalog:`
references) — the standard library pattern of peers for what consumers must
provide, devDependencies for what the package needs to build itself. The
`peerDependencies` block is unchanged, so the SDK's consumer contract is
unaffected and `devDependencies` are never installed downstream.

One exception is recorded in `peerDependencyRules.allowedVersions`:
`starknetid.js@5.0.0` (latest) declares an *exact* peer on `starknet@8.5.2`
while we run 8.5.4. Upstream has no looser release. This is why the catalog
pins `starknet` exactly — with a caret, a fresh resolve floats to 8.9.2 and the
exception silently stops matching.

Latent incoherence noted, not fixed: the SDK lists `@apollo/client` as a peer
but not `graphql`, so a consumer following the peer list alone would still be
short. Pre-existing.

## Commands Run

```sh
corepack install
pnpm install --lockfile-only --ignore-scripts          # candidate resolution
pnpm install --lockfile-only --strict-peer-dependencies # peer measurement
pnpm install --frozen-lockfile                          # lifecycle-script gate
pnpm install
pnpm exec turbo build
pnpm exec turbo check-types
pnpm test
gh api "repos/underware-gg/pistols/dependabot/alerts?state=open"
gh api "advisories?ecosystem=npm&affects=<pkg>"
npm view <pkg> versions dist-tags deprecated scripts dependencies time --json
```

Policy settings were validated in a throwaway copy of the manifests before
being applied here, because an unsupported or mistyped key is silently ignored
and yields a green install with no policy.

## Outcome

- pnpm pinned exactly at 10.34.4, enforced by `packageManagerStrictVersion`.
- Seven-day release-age gate, exotic-source blocking, strict build-script
  approval with all seven packages denied, exact saves, engine strictness, and
  dependency verification before `pnpm run`.
- Peer auto-installation off and peer mismatches fatal, with one documented
  exception and one documented deprecated declaration.
- All three criticals closed; 35 of 154 alerts closed in total.
- Verification: `turbo build` 2/2, `turbo check-types` clean, `pnpm test`
  24/24.

## Follow-ups

- **`overrides` pass for the remaining 119 transitive alerts.** None are
  critical. `pistols-web`'s override set is the starting point.
- **Remove the `@hpke/core` override** once on `@cartridge/controller >=
  0.13.13`, which carries a fixed chain itself.
- **Retire `get-starknet-core@4.0.0`** when `@starknet-react/core` is replaced.
- **`starkscan`** in `/verifier` pins `axios@0.27.2` and accounts for a third
  of the remaining alert count. It is used — `verifier/scripts/verifyStarkscan.sh`
  runs `npx starkscan` — so removing the dependency changes how verification
  resolves. Decide deliberately.
- Convert the remaining direct dependency ranges to exact pins as each package
  is next reviewed.
- `corepack enable` is now a prerequisite for `turbo` tasks. Worth stating in
  the contributor setup notes.
