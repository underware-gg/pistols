# Pre-Commit Canary

Local receipt for the checks a script cannot verify. The pre-commit hook runs the
objective gates itself, then validates that this receipt covers every task below.

**What this does and does not do.** It cannot confirm the work happened. It forces
a written claim per task, which turns a silent skip into a visible one. That is
the whole of its value; do not treat a complete receipt as evidence of
compliance.

Write `.canary--pre-commit` in the repo root before committing. Leave it
untracked — the hook rejects the commit if it is staged.

## Tasks

[1] Verification: `pnpm verify` was run and passed on the staged state. If it was
skipped or bypassed, say so and why.
[2] Order of operations: for any dependency change, the candidate and every new
transitive arrival were reviewed with `node scripts/candidate.mjs` BEFORE any
manifest was touched. Auditing after installing is a policy failure even when the
packages turn out to be fine.
[3] Resolution movement: `node scripts/lockfile-diff.mjs` was run and its output
accounted for. Anything under ENTERED or MOVED is reviewed and recorded, or the
change was confirmed resolution-neutral with `--strict`.
[4] Dependency provenance: any direct dependency change, package-manager change,
policy-setting change, or dependency-tool change has a record under
`docs/dependency-reviews/`, and the record is linked from that directory's
`README.md`.
[5] Exemptions: `scripts/pin-waivers.json`, `scripts/accepted-advisories.json` and
`scripts/known-settings.json` were not grown to make a gate pass. If an entry was
added, it names a reason and what retires it.
[6] Reviewed set: `scripts/reviewed-packages.json` was regenerated only after the
entering packages were actually reviewed, not to clear a failing install.
[7] Commit split: logically distinct changes are in separate commits, and each
commit's tree is internally consistent.

## Log

One line per task. Example:

```text
[1] Verification: done, pnpm verify passed
[2] Order of operations: skip, no dependency change in this commit
[3] Resolution movement: done, 0 entered / 0 moved
[4] Dependency provenance: skip, no dependency change
[5] Exemptions: done, none added
[6] Reviewed set: skip, not regenerated
[7] Commit split: done
```
