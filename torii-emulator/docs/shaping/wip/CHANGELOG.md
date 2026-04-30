# Changelog

Notable changes to **code** and **system docs** (`docs/system/`) in the `torii-emulator` subproject. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Scope

This file tracks the **as-built artifact** as it evolves: shipped code, system-doc updates that reflect that code, and any change a downstream consumer (the Pistols client, ops, future contributors) needs to know about.

It does **not** track changes to shaping documentation (`docs/shaping/design/`, `plans/`, `research/`, `wip/`) or to agent-instruction meta files (`AGENTS.md`, `README.md`, `.gitignore`, etc.). Shaping docs are mutable working artifacts; their evolution belongs in git history and in [`STATUS.md`](./STATUS.md)'s _Recently changed_ section, not here.

A commit that touches only shaping docs or meta files **does not** bump the version and **does not** add a changelog entry. A commit that ships or modifies code, or that lands/updates a system doc, **does** both.

## SEMVER usage in this subproject

This project uses [Semantic Versioning](https://semver.org/).

**Pre-1.0 (current):**
- **MAJOR (`0`)**: stays at `0` until first deployable release.
- **MINOR (`0.X.0`)**: substantive scope changes once code exists — new feature, new system-doc area landed, breaking change to a docs convention that affects code/system-doc consumers, breaking change to interface/schema.
- **PATCH (`0.0.X`)**: refinements — bug fixes, system-doc corrections, small additions inside an existing module.

**Post-1.0 (future):**
- **MAJOR**: breaking changes to the wire protocol the server emulates, or to the storage schema.
- **MINOR**: backward-compatible feature additions.
- **PATCH**: bug fixes, system-doc updates, refinements.

**Per-entry rules:**
1. Append an entry under a new version section that reflects the change's scope.
2. Group changes under the standard headings: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
3. Date each version (UTC).

**Historic entries are immutable.** Once a version section is appended *for a code or system-doc change*, do not edit it. To correct an error, add a follow-up entry under a new patch version describing the correction.

---

_No releases yet. Implementation has not begun; the subproject is currently in the shaping phase. The first entry will land when the first code change or `docs/system/` update is committed._
