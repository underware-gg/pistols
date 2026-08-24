# Dependency Review: exact pinning made mandatory and enforced

## Summary

- Date: 2026-08-24
- Scope: close the gap that let exact pinning be treated as optional, convert
  every specifier that can be converted, and add mechanical enforcement so the
  rule cannot quietly lapse again.

Before this change: **17 exact specifiers, 51 ranges.** The 2026-08-23 policy
adoption set `saveExact: true` — which governs only future `pnpm add` — and
deferred conversion to "when each package is next reviewed". That made the
control optional in practice.

## Classification

- Elevated-risk. Changes every workspace manifest and the catalog, alters what
  future installs may resolve, and adds gates that fail the build.

## Why this is a security control, not housekeeping

A ranged specifier means an unreviewed version can enter the tree on any
install. That single fact defeats three other controls at once:

- **advisory review**, because the version reviewed is not the version that
  resolves next time;
- **the release-age gate**, because the range keeps reaching forward as new
  versions age past it;
- **the `overrides` set**, because a scoped override keyed on a parent version
  silently stops matching when the parent floats.

Exactness is what makes the other gates mean anything. Treating it as
convertible-later was not a deferral of tidying; it was leaving the front door
open while auditing the locks.

The deferral was also justified on false grounds. The 2026-08-23 record claimed
conversion "would crystallise ~57 unreviewed version decisions". Pinning at the
**currently-resolved** version crystallises nothing — the tree has already
resolved there. That argument applies only to pinning at *latest*.

## Targets

**42 specifiers pinned to the version already resolved** — 36 direct
(`sdk` 6, `client` 29, `verifier` 1) and 6 catalog entries (`@types/react`,
`@types/react-dom`, `@types/node`, `react-dom`, `typescript`, `tsup`).

**Zero resolution movement**, verified by diffing the lockfile with `specifier:`
lines excluded: no `resolution:`, `version:` or dependency-graph line changed.

**New enforcement:**

| File | Purpose |
|---|---|
| `scripts/check-pins.mjs` | Fails on any ranged specifier; fails on stale or undefined waivers |
| `scripts/pin-waivers.json` | The only permitted pin exemptions, enumerated with reasons |
| `scripts/check-advisories.mjs` | Fails on any advisory not explicitly accepted; fails on stale acceptances |
| `scripts/accepted-advisories.json` | The only permitted advisory exemptions |
| `scripts/verify.sh` | One gate: pins → frozen install → advisories → build → types → tests |

Wired as `pnpm check-pins`, `pnpm check-advisories`, `pnpm verify`. Both scripts
use only Node built-ins, so they run before `pnpm install` and cannot themselves
introduce a dependency.

**The exactness test is an allowlist, not a blocklist.** The first version
rejected specifiers starting with `^`, `~`, `>`, `<` or `*`. That is the wrong
shape: `0.180.x`, `1.x`, `latest` and `next` are all ranges and all passed it.
The gate now requires a strict semver literal
(`^\d+\.\d+\.\d+(-prerelease)?(+build)?$`) and rejects everything else, so an
unanticipated range syntax fails closed rather than slipping through. Verified
against eleven range forms and four exact forms including prereleases
(`3.0.0-beta.2`) and build metadata.

Also removed: **`verifier/package.json` declared `"packageManager":
"pnpm@10.10.0"`** against the root's 10.34.4 under
`packageManagerStrictVersion: true`. Installs tolerated it, but committing a
policy-enforcement change while leaving a direct contradiction of that policy in
the tree is the same defect in miniature. The field is meaningless in a non-root
workspace package.

## The transitive drift this surfaced

The first attempt pinned the manifests and ran `pnpm install`. That **re-resolved
transitive subtrees and floated roughly fifteen packages to unreviewed
versions** — `@babel/*` 7.28.x → 7.29.x, `hasown` 2.0.2 → 2.0.4, `ufo` 1.6.1 →
1.6.4, and a newly-deprecated `eslint`. None had been reviewed. A change whose
entire point was zero movement pulled unreviewed code in as a side effect.

Reverted, and redone surgically: because every pinned specifier resolves to the
version already in the lockfile, only the lockfile's `specifier:` lines needed
rewriting. `pnpm install --frozen-lockfile` then validates the result, which is
the proof that manifests and lockfile agree.

**Generalise this: pinning a direct specifier is not resolution-neutral just
because the target equals the resolved version.** Any `pnpm install` that
re-resolves may float transitives. Verify with a lockfile diff that excludes
`specifier:` lines, and never accept "the pin didn't move anything" without it.

## Release Age

No new package versions were introduced, so the release-age gate is not
engaged. Two release-age settings were, however, restored — see below.

## Advisory Review

No new packages entered the tree. `pnpm audit` after this change: **1 finding,
`elliptic` (low), no patched version**, which is now recorded as the sole entry
in `scripts/accepted-advisories.json`.

**Two release-age settings were wrongly removed on 2026-08-23 and are restored:**

- `minimumReleaseAgeStrict: true`
- `minimumReleaseAgeIgnoreMissingTime: false`

Both are real pnpm settings, documented under *Dependency Resolution*. The
second matters: **its default is `true`, which skips the release-age check
entirely for any package whose registry metadata lacks a `time` field.** Removing
it did not merely lose documentation — it left that bypass open. `false` closes
it. `minimumReleaseAgeStrict` defaults to `true` whenever `minimumReleaseAge` is
set explicitly, so stating it changes nothing today, but it removes the
dependence on that coupling.

## Source / Upstream Review

**The catalog cannot be fully pinned yet, and the reason is real.**
`@underware/pistols-sdk` is published (`private: false`, ~432 downloads/week)
and declares 18 `peerDependencies` as `catalog:`. pnpm rewrites `catalog:` to
the literal catalog version on publish. Pinning the catalog exactly would ship
exact peer requirements — `react: 18.3.1` would reject a consumer on 18.3.2.

This is already half-true in the published package, which ships **8 exact peers
and 10 ranges**:

```
@cartridge/connector 0.10.7   @dojoengine/core 1.8.0   react ^18.3.1
@cartridge/controller 0.10.7  @dojoengine/sdk 1.8.0    starknet ^8.5.4
@cartridge/presets 0.5.4      @dojoengine/torii-client 1.8.0
@starknet-io/get-starknet-core 4.0.7   @dojoengine/utils 1.8.0
```

Of the 15 ranged catalog entries, **7 are not referenced by the SDK's peer block
and were pinned immediately**. The remaining 8 are waived in
`scripts/pin-waivers.json` under `sdk-peer-contract`, pending a decision on
decoupling `peerDependencies` from the catalog so the internal resolution policy
(exact) and the published consumer contract (ranged) stop being the same field.
`@daydreamsai/core` is waived separately as a dead entry — the `dreams`
workspace is disabled, so it resolves to nothing and has no version to pin to.

**The waiver list is not an escape hatch.** `check-pins` fails if a waived entry
becomes exact, if a waived entry leaves the catalog, if a waiver names an
undefined reason, or if any unwaived range appears. It prints every waiver on
every run, passing or failing.

## Lifecycle Scripts

Unchanged. No new install script entered the tree.

## Commands Run

```sh
node scripts/check-pins.mjs                 # and five deliberate failure cases
node scripts/check-advisories.mjs           # and two deliberate failure cases
pnpm install --frozen-lockfile
diff <(grep -vE "^\s+specifier:" lock.before) <(grep -vE "^\s+specifier:" pnpm-lock.yaml)
sh scripts/verify.sh
```

Both gates were tested against deliberate violations before being trusted:
`check-pins` exits 1 on a ranged manifest specifier, an unwaived ranged catalog
entry, a stale waiver, a waiver for a removed entry, and an undefined waiver
reason; it exits 0 on the committed tree. `check-advisories` exits 1 on an
unaccepted finding and on a stale acceptance. A gate never observed failing is
not a gate.

## Outcome

- 68 specifiers were ranged where they should not have been; **59 are now exact,
  9 are waived with stated reasons and blocking decisions.**
- Zero resolution movement.
- Exact pinning, and the accepted-advisory set, are now enforced by scripts that
  fail the build.
- Two wrongly-removed release-age settings restored, one of which was closing a
  real bypass.
- Verification: `pnpm verify` passes end to end.

## Follow-ups

- **ACTION: decide the SDK peer contract.** Decoupling `peerDependencies` from
  `catalog:` retires 8 of the 9 waivers. Until then the catalog cannot be fully
  pinned.
- **`pnpm config get <key> --json` does not validate that a setting exists.** It
  echoes back any key present in `pnpm-workspace.yaml`, including a fabricated
  one — verified with a control. Neither it nor `strings` on the binary can tell
  whether pnpm *implements* a setting. Only the published settings reference
  can. Both earlier methods used here were invalid.
- The enforcement is currently opt-in: it runs when someone runs `pnpm verify`.
  A pre-commit hook and a CI workflow would make it unskippable. Proposed
  separately, since installing a git hook changes local git configuration.
