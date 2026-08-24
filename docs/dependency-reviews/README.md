# Dependency Reviews

This directory records deliberate direct dependency, package-manager, and
dependency-tool updates for this repository.

`pnpm-workspace.yaml` is the policy source of truth for install behaviour. This
directory records the reasoning behind what that file allows. The scripts in
`scripts/` enforce the parts of this policy that can be checked mechanically —
**policy that is only written down is policy that gets skipped.**

## Policy

These are requirements, not defaults or preferences.

1. **Every dependency specifier is exact.** No caret, no tilde, no range, in
   `dependencies`, `devDependencies`, `optionalDependencies`, or the catalog.
   `catalog:` and `workspace:` references pass through to the thing they name.
   `peerDependencies` are the sole exception, and deliberately so: a peer range
   is a contract about what a *consumer* may supply, not a resolution we control.

   This is a security control, not a style choice. A range means an unreviewed
   version can enter the tree on any install, which defeats advisory review, the
   release-age gate and the override set simultaneously. Enforced by
   `pnpm check-pins`, which fails the build on any range.

2. **Review happens before installation, never after.** A package that has not
   been reviewed must never be resolved into the local tree — including onto this
   machine's pnpm store. See *Order of operations* below. Discovering a problem
   in a package that is already installed is a policy failure even when the
   package turns out to be fine.

3. **Candidate versions must be at least seven days old** unless a documented
   exception is necessary (`minimumReleaseAge: 10080`). The gate is strict
   (`minimumReleaseAgeStrict: true`) and does **not** skip packages whose
   registry metadata lacks a publish time
   (`minimumReleaseAgeIgnoreMissingTime: false`).

4. **Git, file, and URL-style transitive dependencies are blocked**
   (`blockExoticSubdeps: true`).

5. **Dependency lifecycle scripts require an explicit, reviewed decision.**
   Absence of a decision fails the install; it does not default to "off"
   (`strictDepBuilds: true`, `dangerouslyAllowAllBuilds: false`).

6. **No package enters the dependency graph undeclared.** Peers are not
   auto-installed and peer mismatches fail the install rather than warn
   (`autoInstallPeers: false`, `strictPeerDependencies: true`).

7. **Production and CI installs use `pnpm install --frozen-lockfile`.**

8. **Transitive versions are forced through `overrides`**, each carrying a
   comment stating why it exists and what retires it.

9. **Exemptions are enumerated, justified, and self-invalidating.** There are
   exactly two exemption lists — `scripts/pin-waivers.json` and
   `scripts/accepted-advisories.json`. Both fail the build when an entry becomes
   stale, so neither can rot into a silent permanent exception, and both print
   their contents on every run. Neither may be used to defer work that has a
   fix available. An exemption list that grows is a policy regression.

## Order of operations

Adding or changing a dependency, in this order. **Steps 1–4 happen before
anything touches a manifest.**

1. **Identify the exact candidate version.** Not a range — the specific version
   intended.
2. **Gather registry metadata for that version**: `dependencies`,
   `peerDependencies`, `peerDependenciesMeta` (optional peers are not
   installed under our settings), install scripts, deprecation status, publish
   time. Recurse into anything new the candidate brings with it — a transitive
   arrival is a dependency entering the tree and gets the same scrutiny.
3. **Check advisories for the candidate and every new arrival**, against the
   specific versions that would resolve, not just the package names.
4. **Confirm the release-age gate**, and confirm the target version is not
   itself the affected version of a *different* advisory. Closing one finding by
   moving onto another is a regression, and has happened here.
5. **Write the review record** below, then change the manifest.
6. **Install**, then run `pnpm verify`.

Skipping to step 6 and auditing afterwards inverts the control. The gate only
means something if nothing unreviewed is ever fetched.

## Verification

```sh
pnpm verify
```

Runs, in order: exact-pin enforcement, `pnpm install --frozen-lockfile`,
advisory check against the accepted set, `turbo build`, `turbo check-types`,
`pnpm test`. Individual gates: `pnpm check-pins`, `pnpm check-advisories`.

**After any change to `pnpm-workspace.yaml` or the lockfile, run `pnpm install`
before using `pnpm run` or `pnpm exec`.** `verifyDepsBeforeRun: error` compares
the installed tree against current settings and fails fast when they have
drifted, which includes every `turbo` task since `turbo` invokes `pnpm run` per
package. This is the setting working as intended.

## Measuring advisory state

**`pnpm audit` is the authority for a working branch.** GitHub's Dependabot
alert count reflects **the repository's default branch only**, so it does not
move in response to work on a feature branch no matter how much of it lands.
Citing that count as evidence about branch state is wrong, and has been done
here. Use `pnpm check-advisories`, and treat the Dependabot count as meaningful
only once the work reaches the default branch.

## Review records

Create `YYYY-MM-DD-short-subject.md` before changing a direct dependency, the
package manager, an install policy setting, or a dependency tool.

Each record must include:

1. Summary
2. Classification
3. Targets
4. Release Age
5. Advisory Review
6. Source / Upstream Review
7. Lifecycle Scripts
8. Commands Run
9. Outcome
10. Follow-ups

Where a record corrects an earlier one, append a dated corrections section to
the record being corrected rather than editing its claims in place, and link
both ways.

## Records

- [2026-08-23 — Supply-chain policy adoption](2026-08-23-supply-chain-policy.md)
- [2026-08-23 — Transitive advisory overrides](2026-08-23-transitive-overrides.md)
- [2026-08-23 — Climb to the old-side ceiling](2026-08-23-old-side-ceiling.md)
- [2026-08-24 — dojo.js to the top of the old side](2026-08-24-dojo-js-old-side-top.md)
- [2026-08-24 — Advisory regressions in tmp and react-router](2026-08-24-advisory-regressions.md)
- [2026-08-24 — Exact pinning made mandatory and enforced](2026-08-24-exact-pinning-enforced.md)
