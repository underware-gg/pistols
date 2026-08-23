# Dependency Reviews

This directory records deliberate direct dependency, package-manager, and
dependency-tool updates for this repository.

`pnpm-workspace.yaml` is the policy source of truth. This directory records the
reasoning behind what that file allows.

## Policy

- New direct dependencies, dependency tools, and directly updated packages use
  exact versions. Existing ranges are converted when their package is next
  reviewed and updated.
- Candidate versions must be at least seven days old, unless a documented
  exception is necessary.
- Git, file, and URL-style transitive dependencies are blocked.
- Dependency lifecycle scripts require an explicit, reviewed decision. Absence
  of a decision fails the install; it does not default to "off".
- No package enters the dependency graph undeclared. Peer dependencies are not
  auto-installed, and peer mismatches fail the install rather than warn.
- Production and CI installs use `pnpm install --frozen-lockfile`.
- Transitive versions are forced through `overrides`, each carrying a comment
  that states why it exists and what retires it.

## Install workflow

The package manager is pinned exactly in `package.json` and enforced by
`packageManagerStrictVersion`. Make the pinned version available through
Corepack:

```sh
corepack enable        # once per machine, so `pnpm` resolves per-project
corepack install       # installs the version this repo pins
pnpm install --frozen-lockfile
```

`corepack enable` matters more than it looks. `verifyDepsBeforeRun: error`
compares the installed tree against the current settings, and `turbo` spawns
`pnpm` from `PATH` for each task. If `PATH` resolves to a different pnpm than
the one that wrote `node_modules`, every `turbo` task fails with
`ERR_PNPM_VERIFY_DEPS_BEFORE_RUN`. A standalone pnpm installation earlier in
`PATH` will shadow Corepack and cause exactly this.

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

For an update, build a candidate lockfile with lifecycle scripts disabled,
audit both the candidate and the final lockfile, inspect registry metadata for
the exact targets, and run the relevant verification suite —
`turbo build`, `turbo check-types`, `pnpm test`.

## Records

- [2026-08-23 — Supply-chain policy adoption](2026-08-23-supply-chain-policy.md)
