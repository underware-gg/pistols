# Dependency Review: advisory regressions in tmp and react-router

## Summary

- Date: 2026-08-24
- Scope: close two live high-severity advisories that the 2026-08-23 passes
  introduced or left behind, and correct how advisory state is measured.

Both were found by running `pnpm audit` against our own lockfile — something
neither 2026-08-23 record did. Both were invisible to the measure those records
relied on.

## Classification

- Low-risk. Two patch-level version moves, no API surface change.

## Targets

| Target | From | To | Why |
|---|---|---|---|
| `external-editor>tmp` override | 0.2.6 | **0.2.7** | 0.2.6 is itself vulnerable |
| `react-router` (client) | 7.18.0 | **7.18.2** | 7.18.0 is vulnerable |

## Release Age

| Target | Published | Age |
|---|---|---|
| `tmp@0.2.7` | 2026-05-27 | 89 d |
| `react-router@7.18.2` | 2026-07-28 | 26 d |

Both clear `minimumReleaseAge: 10080`.

## Advisory Review

**`tmp` — an override that closed one advisory and opened another.** The
2026-08-23 overrides pass moved `external-editor>tmp` from 0.0.33 to **0.2.6**
to close *"Path Traversal via unsanitized prefix/postfix"* (high, patched
0.2.6). It did close that one. But 0.2.6 is the sole affected version of a
*second* advisory — *"Type-confusion bypass of `_assertPath` allows path
traversal via non-string prefix/postfix/template"* (high, vulnerable
`>= 0.2.6, < 0.2.7`). The override landed on the one version in the 0.2.x line
carrying a live high. 0.2.7 closes both.

**`react-router` — pinned one patch short.** The supply-chain policy pass pinned
7.18.0 to close 13 alerts, and it did. 7.18.0 is also the patched version for
four separate advisories. But *"RSC Mode CSRF Bypass Allows Action Execution
Before 400 Response"* (high) covers `>= 7.12.0, < 7.18.2`. We do not use RSC
mode, so exposure is unlikely, but the fix is a patch bump.

**How both were missed, and the correction that matters most.** Both 2026-08-23
records claim "153 of 154 alerts closed", sourced from
`gh api repos/underware-gg/pistols/dependabot/alerts`. That endpoint reports
Dependabot's analysis of the **default branch**. All of this work is on
`wip/rob`. The GitHub count was, and still is, **154 open** — it never moved,
because Dependabot has never seen our lockfile.

The claim was true of the local tree and false of the thing being cited. The
authoritative measure for a working branch is `pnpm audit` against the lockfile
in hand. GitHub's count becomes meaningful only once this branch reaches the
default branch.

`pnpm audit` before this change: **2 high (`tmp`, `react-router`), 1 low
(`elliptic`)**. After: **1 low (`elliptic`)**, which has no patched version.

## Source / Upstream Review

`tmp@0.2.7` has no dependencies and no install scripts. `external-editor` calls
`tmpNameSync`/`fileSync`, both still present. `react-router` 7.18.0 → 7.18.2 is
a patch move within the pinned major.

## Lifecycle Scripts

Unchanged. No new install script entered the tree.

## Commands Run

```sh
pnpm audit --json
gh api "advisories?ecosystem=npm&affects=tmp"
gh api "advisories?ecosystem=npm&affects=react-router"
gh api --paginate "repos/underware-gg/pistols/dependabot/alerts?state=open"
npm view tmp@0.2.7 scripts dependencies --json
npm view react-router time --json
pnpm install && pnpm exec turbo build && pnpm exec turbo check-types && pnpm test
```

## Outcome

- `pnpm audit` on this branch: 1 low (`elliptic`), no patched version available.
- Verification: `turbo build` green, `turbo check-types` clean, `pnpm test`
  24/24.

## Follow-ups

- **Add `pnpm audit` to the review convention.** `docs/dependency-reviews/README.md`
  lists `turbo build`, `turbo check-types` and `pnpm test` as the verification
  suite. It should require `pnpm audit` too, and should state that Dependabot's
  count reflects the default branch only.
- **An override that closes one advisory can open another.** Check the target
  version against the full advisory set for that package, not only against the
  advisory being closed. `tmp` 0.2.6 was picked by reading one advisory's
  `first_patched_version`.
- **Convert the remaining 51 ranged specifiers to exact pins.** Still open, and
  the reason recorded on 2026-08-23 for deferring — that it would "crystallise
  ~57 unreviewed version decisions" — does not hold: pinning at the
  currently-resolved version crystallises nothing, because the tree already
  resolved there. The real constraint is that pnpm rewrites `catalog:` to a
  literal on publish, and `@underware/pistols-sdk` (`private: false`) has 18
  `peerDependencies` on `catalog:`. Pinning the catalog exactly would publish an
  SDK demanding exact peers. That needs deciding before converting.
