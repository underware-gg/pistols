# Dependency Review: decouple the published peer contract from the catalog

## Summary

- Date: 2026-08-24
- Scope: separate what this repository resolves (exact) from what
  `@underware/pistols-sdk` advertises to consumers (ranged), so the catalog can
  be pinned completely.

This retires 8 of the 9 pin waivers, and retires them rather than justifying
them.

## Classification

- Elevated-risk. Changes the published contract of a package with real consumers
  (~432 downloads/week), and pins eight more catalog entries.

## The problem it solves

`@underware/pistols-sdk` declared its 18 `peerDependencies` as `catalog:`, and
pnpm rewrites `catalog:` to the literal catalog version on publish. So pinning
the catalog exactly would have published exact peer requirements — `react:
18.3.1` rejecting a consumer on 18.3.2. That blocked 8 catalog entries from
being pinned, which is why they sat in `scripts/pin-waivers.json`.

The field was doing two incompatible jobs. Splitting them removes the conflict
rather than trading one requirement off against the other.

## Do ranges weaken the policy?

No, and the reasoning is worth stating because it determines where exactness is
required and where it is meaningless.

**A peer dependency is never installed.** Under `autoInstallPeers: false` a peer
declaration is purely a constraint on what a consumer must supply. Nothing in a
peer field can cause a version to resolve into this tree — resolution comes from
`dependencies`, `devDependencies`, the default catalog, the lockfile and the
reviewed set. A peer range therefore cannot admit an unreviewed package. It is
not a hole in the gate; it is not on the same axis as the gate.

**Exactness protects whoever does the resolving.** We resolve our tree, so we
pin it. A consumer resolves theirs, so they pin theirs. A peer declaration is
the interface between two independently-pinned trees. Making the interface exact
adds no review step — it removes the consumer's freedom to land on a version
*they* have reviewed, and in a version conflict forces them to either fail or
override. Two copies of `starknet` or `react` in one application is a
correctness and security problem, and an exact peer is how a library manufactures
that for its consumers.

So: ranges are dangerous where they feed resolution and inert where they only
describe a contract. Rules 1 and 2 in `README.md` now say exactly that.

## Targets

| Change | Detail |
|---|---|
| `catalogs.peers` in `pnpm-workspace.yaml` | New named catalog, 18 ranges |
| `sdk/package.json` `peerDependencies` | `catalog:` → `catalog:peers` (all 18) |
| Default catalog | 8 entries pinned: `@apollo/client` 3.14.0, `@starknet-react/core` 5.0.3, `@starknet-react/chains` 5.0.3, `@tanstack/react-query` 5.90.2, `immer` 10.1.3, `react` 18.3.1, `universal-cookie` 8.0.1, `zustand` 4.5.7 |
| `scripts/pin-waivers.json` | `sdk-peer-contract` reason deleted with all 8 entries |
| `scripts/check-catalog-drift.mjs` | New gate |
| `scripts/check-pins.mjs` | Now rejects any named catalog other than `peers`, and any `catalog:<name>` reference from a resolution-driving section |

**The mechanism was verified, not assumed.** `pnpm pack` on a scratch workspace
and then on the real SDK confirms pnpm rewrites both forms:

```
dependencies:     "catalog:"       ->  "swr": "2.3.6"
peerDependencies: "catalog:peers"  ->  "react": "^18.3.1"
```

So each package still has a single source of truth; the two concerns simply have
separate fields instead of sharing one.

## Peer ranges chosen

Not uniform, and deliberately so.

- Stable libraries keep the range already published: `@apollo/client ^3.11.8`,
  `@starknet-react/* ^5.0.1`, `@tanstack/react-query ^5.62.16`, `immer ^10.1.1`,
  `react ^18.3.1`, `starknet ^8.5.4`, `starknetid.js ^5.0.0`,
  `universal-cookie ^8.0.1`, `zustand ^4.5.6`. Unchanged contract.
- Tightly-coupled libraries move from exact to a range that stops at the next
  breaking boundary: `@dojoengine/sdk ^1.9.0` admits any 1.x but **excludes
  2.0.0**, which is the starknet.js 10 / React 19 rubicon and is not compatible
  with this SDK. Same for `core ^1.8.8`, `torii-client ^1.8.2`, `utils ^1.8.4`.
- Cartridge and presets use `^0.13.16` / `^0.5.4`. Caret on a `0.x` version pins
  the minor, so these mean `>=0.13.16 <0.14.0` and `>=0.5.4 <0.6.0` — patch
  freedom, no minor drift.

Eight peers therefore loosen from exact to ranged. That is backward compatible:
anything satisfying the old exact pin satisfies a range containing it.

## The cost, and the gate that covers it

While both fields read `catalog:`, divergence was impossible. With two entries a
peer range can drift to exclude the version we pin, publishing a contract that
excludes what we build and test against.

**pnpm does not catch this.** A deliberately drifted peers range installed
cleanly with `strictPeerDependencies: true`. So
`scripts/check-catalog-drift.mjs` evaluates every peer range against its pinned
version and fails on: a range that excludes the pin, a range it cannot evaluate,
a declared peer with no catalog entry, and an orphan catalog entry. Verified
against five drifting ranges including the `0.x` caret boundary
(`^0.12.0` vs pinned `0.13.16`), and an unevaluable `*`.

**A second hole was found and closed while writing this.** The named-catalog
mechanism is itself a bypass: adding `catalogs: loose:` full of ranges and
pointing `dependencies` at `catalog:loose` would sail past `check-pins`
entirely. `check-pins` now rejects any named catalog but `peers`, and any
`catalog:<name>` reference from `dependencies`/`devDependencies`/
`optionalDependencies`. Both cases tested.

## Release Age

Not engaged. No package version changed — the eight newly-pinned catalog entries
were pinned to versions already resolved.

## Advisory Review

Unchanged. `pnpm audit`: one finding, `elliptic` (low), unpatchable, accepted.

## Source / Upstream Review

Zero resolution movement, confirmed with `node scripts/lockfile-diff.mjs
--strict`: 0 entered, 0 left, 0 moved.

## Lifecycle Scripts

Unchanged.

## Commands Run

```sh
pnpm pack                                   # scratch workspace, then sdk/
node scripts/check-catalog-drift.mjs        # and five drift cases
node scripts/check-pins.mjs                 # and both bypass cases
pnpm install
node scripts/lockfile-diff.mjs --strict
sh scripts/verify.sh
```

## Outcome

- Default catalog fully exact bar one dead entry; **pin waivers down from 9 to
  1**, and the remaining one is `@daydreamsai/core`, which resolves to nothing.
- The published peer contract is now a deliberate per-package decision rather
  than a side effect of our internal pinning.
- Two bypasses closed, one of which this change created.
- `pnpm verify` green; zero resolution movement.

## Follow-ups

- **`immer` is declared as a peer but nothing in `sdk/src` imports it.** It now
  has an entry in the peers catalog and a range, which makes a requirement of
  something we do not use. Removing it is a consumer-visible change; folded into
  the deferred dependency-removal work.
- `@daydreamsai/core` remains the sole pin waiver. It goes when the `dreams`
  workspace is resolved either way.
- `starknet`'s peer stays at the previously published `^8.5.4` while we build
  against 8.9.2. Correct and compatible, but if the SDK starts relying on 8.6+
  APIs the floor should move with it.
