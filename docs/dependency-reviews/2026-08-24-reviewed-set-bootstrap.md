# Dependency Review: reviewed-set bootstrap

## Summary

- Date: 2026-08-24
- Scope: establish `scripts/reviewed-packages.json` as the set of package
  versions permitted to resolve into this repository, and state honestly what
  its initial contents mean.

## Classification

- Elevated-risk. Adds a gate that can block all installs, and its first content
  is an assertion about 1,025 package versions that nobody has read.

## The bootstrap problem, stated plainly

`.pnpmfile.cjs` blocks any package version absent from the reviewed set. For
that to be useful the set must contain the tree we already have — 862 packages
at 1,025 name@version pairs. Nobody is going to read 1,025 packages, so the
initial contents are **inherited, not audited**.

That is the same shape as the pattern this policy work exists to remove: calling
something reviewed because it is already here. The difference is narrow but
real, and it is worth being precise about rather than glossing:

- The claim being made is **not** "these 1,025 versions are safe". It is "these
  1,025 versions are the tree as it stood on 2026-08-24".
- What is known about them: `pnpm audit` reports one finding, `elliptic` (low),
  which has no patched version and is recorded in
  `scripts/accepted-advisories.json`. Build, typecheck and tests pass. Every
  direct specifier is exact. Seven packages carry install scripts and all seven
  are denied.
- What is **not** known: whether any of them contains hostile code. No source
  review has happened.

The value is the ratchet, not the certification. From this commit, a package
version that is not already here cannot resolve without someone reviewing it and
regenerating the set. The bootstrap buys that property; it does not claim
anything more.

`cargo-barbican` faces the same problem in the Rust ecosystem and resolves it the
same way, with the honesty visible in the data: its first reviewed family is
named `rust-bootstrap-inherited-core-set-2026-05-25`. The word *inherited* is
doing deliberate work. `bootstrap.honest_status` in
`scripts/reviewed-packages.json` does the same job here.

## Targets

| File | Purpose |
|---|---|
| `.pnpmfile.cjs` | Throws in `readPackage` for any unreviewed package version |
| `scripts/reviewed-packages.json` | The permitted set, plus the bootstrap's honest status |
| `scripts/generate-reviewed-set.mjs` | Regenerates the set, requiring `--record` |
| `scripts/check-lockfile-reviewed.mjs` | Static check: every lockfile version is in the set |

## Where the gate does and does not fire

This matters more than the gate itself, and was established by testing rather
than assumed:

- **It fires on genuine resolution.** Adding `is-odd@3.0.1` to
  `client/package.json` and running `pnpm install` aborts with the block message,
  exit 1, and the package does not appear in the pnpm store. The throw happens
  inside `resolveDependency`, before any tarball is fetched.
- **It does not fire when pnpm skips resolution.** With a lockfile that already
  satisfies the manifests, `readPackage` is never called. Deleting `tmp` from the
  reviewed set and running `pnpm install --force` still exits 0. So the pnpmfile
  cannot police a lockfile that someone else resolved and committed.

`scripts/check-lockfile-reviewed.mjs` exists for exactly that gap and is the
gate that runs in CI before `pnpm install`.

- **It fails closed.** An unreadable or empty `reviewed-packages.json` throws
  rather than defaulting to allow-all — verified by emptying the `packages`
  object.
- **Workspace packages are exempt** by name, read from `pnpm-workspace.yaml`
  rather than hardcoded. They have a name and version but no registry identity,
  and the first version of this gate blocked all four of them.
- **`PISTOLS_ALLOW_UNREVIEWED=1`** bypasses the gate for recovery. Using it means
  unreviewed code may be fetched; the canary asks for the reason.

## Release Age

Not engaged: no package versions were added or changed.

## Advisory Review

Unchanged by this commit. `pnpm audit`: one finding, `elliptic` (low),
unpatchable, accepted.

## Source / Upstream Review

`.pnpmfile.cjs` and every script here use only Node built-ins, so the gate
introduces no dependency of its own and runs before `pnpm install`.

## Lifecycle Scripts

Unchanged.

## Commands Run

```sh
node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/2026-08-24-reviewed-set-bootstrap.md
pnpm install                                   # passes with the gate active
pnpm install                                   # with is-odd added: BLOCKED, exit 1
pnpm install --force                           # with tmp removed from the set: exits 0, gate not reached
PISTOLS_ALLOW_UNREVIEWED=1 pnpm install --force
node scripts/check-lockfile-reviewed.mjs       # and its negative case
```

## Outcome

- 1,025 package versions inherited into the reviewed set, labelled as inherited.
- Unreviewed packages can no longer resolve, and an unreviewed lockfile can no
  longer pass CI.
- The gate's blind spot is documented rather than left to be discovered.

## Follow-ups

- **The inherited set is a debt, not a clean slate.** Reducing it means reviewing
  packages that are already here — most usefully the ones that ship to browsers.
  Worth doing incrementally by converting inherited entries into recorded ones,
  starting with what appears in the client bundle.
- `scripts/check-lockfile-reviewed.mjs` reports stale reviewed-set entries but
  does not fail on them. A package that leaves the tree and later returns would
  be silently re-permitted. Decide whether that should fail.
- The reviewed set records name and version but not an integrity hash. The
  lockfile holds the hashes, so a version cannot be swapped without changing the
  lockfile, but binding the reviewed set directly to hashes — as
  `cargo-barbican`'s `reviewed-targets.toml` does — would be stronger.
