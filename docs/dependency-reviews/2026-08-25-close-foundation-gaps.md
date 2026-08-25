# Dependency Review: close the two remaining foundation gaps

## Summary

- Date: 2026-08-25
- Scope: resolve the `packageManagerStrictVersion` phantom, and make a stale
  reviewed-set entry fail rather than warn.

Both were recorded as follow-ups on 2026-08-24 and both were holes in controls
this repository claims to have.

## Classification

- Moderate-risk. Removes a declared setting, and turns a warning into a build
  failure.

## Gap 1: `packageManagerStrictVersion` was not a control

It sat in `pnpm-workspace.yaml` under "Supply-chain gates" and could not be shown
to do anything:

- **Not in pnpm's settings reference.** The Dependency Resolution, Build, Peer,
  CLI and Other Settings pages between them document every setting we declare
  except this one.
- **Zero hits** in a GitHub code search of `pnpm/pnpm`.
- **No behavioural difference** across four configurations, with the setting both
  `true` and `false`: an exact pin mismatched against the running version, a
  non-existent pin, a range pin, and no `packageManager` field at all.

**Every test available is incapable of distinguishing it from a fabricated key**,
which is the more useful finding:

| Method | Result |
|---|---|
| `strings` on the pnpm binary | 0 exact hits for settings that demonstrably work — pnpm 10.34.4 is a compiled single-executable |
| `pnpm config get <key> --json` | Echoes back any key present in the file, including `totallyFakeSettingXyz` |
| `npm_config_*` env export | pnpm exports any key, including the fabricated one, as `npm_config_totally_fake_setting_xyz` |

So three separate methods used across this work to reason about whether a setting
exists are all invalid. Only the published reference and observed behaviour count.

**It was also redundant, which is what made the decision safe.** pnpm's launcher
honours the `packageManager` field on its own: in a directory pinning 10.20.0,
`pnpm --version` reports **10.20.0**, and a pin that cannot be satisfied exits
non-zero. The guarantee was never coming from the setting.

Removed, and replaced with `scripts/check-package-manager.mjs`, which asserts the
running pnpm equals the pin and fails closed if it cannot read either. That turns
implicit launcher behaviour into an assertion we own and can test — which is what
the setting was pretending to be.

The entry is retained in `known-settings.json` under `unadopted` with the
evidence, so re-adopting it requires positive proof rather than someone noticing
it is missing. Deleting a setting on weak evidence is how
`minimumReleaseAgeIgnoreMissingTime` was lost on 2026-08-23; this is the same
action taken with the reasoning written down and a replacement in place.

## Gap 2: a stale reviewed-set entry now fails

`check-lockfile-reviewed` reported entries that were reviewed but no longer
resolved, and passed anyway. That defeats the ratchet: a package can leave the
tree, its permission stays behind, and the exact version returns later without
review. A package leaving is legitimate; leaving its permission behind is not.

Now a failure. Regenerating prunes them, because
`generate-reviewed-set.mjs` rebuilds the set from the lockfile wholesale.

Both directions verified: an entry for a package not in the tree
(`left-pad@1.3.0`) fails, a package in the tree but absent from the set still
fails, and the committed tree passes.

## Release Age

Not engaged. No package versions changed.

## Advisory Review

Unchanged. `pnpm audit`: one finding, `elliptic` (low), unpatchable, accepted.

## Source / Upstream Review

`check-package-manager.mjs` uses only Node built-ins and `pnpm --version`.

## Lifecycle Scripts

Unchanged.

## Commands Run

```sh
gh api -X GET search/code -f q='packageManagerStrictVersion repo:pnpm/pnpm'
pnpm install --ignore-scripts      # four packageManager configurations, setting true and false
pnpm run dump                      # npm_config_* export test, real key vs fabricated key
node scripts/check-package-manager.mjs
node scripts/check-lockfile-reviewed.mjs   # plus stale and unreviewed cases
sh scripts/verify.sh
```

## Outcome

- `check-settings` now reports **no unverified settings**. The permanent warning
  is gone because the phantom is gone, not because it was silenced.
- The reviewed-set ratchet no longer has a path for a version to return without
  review.
- Gate count is now eight, wired into `pnpm verify`, the pre-commit hook and CI.

## Follow-ups

Superseded references, left in place rather than edited, since the convention is
to correct forward: `2026-08-23-supply-chain-policy.md` states pnpm is "enforced
by `packageManagerStrictVersion`" — it is enforced by pnpm's launcher and now
also by `check-package-manager.mjs`. `2026-08-24-dojo-js-old-side-top.md` and
`2026-08-24-exact-pinning-enforced.md` both cite the setting when describing the
`verifier` manifest's conflicting pin; the conflict was real and its removal
stands, but the setting named as the reason was not the mechanism.

Still open from the foundation group, and not closed here:

- **CI has never executed.** It cannot be proven from here.
- **The pre-commit hook is opt-in** — `git config core.hooksPath tools/git-hooks`.
- **The SDK is entirely unlinted**: no lint script, no eslint config, so
  `turbo lint` reaches only the client.
- **`react-hooks/exhaustive-deps` is disabled** in the client config. That is the
  rule class that would have caught the stale `useMemo` dependency fixed in
  `7d52e0e8`.
