# Changelog

All notable changes to the `torii-emulator` subproject. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## SEMVER usage in this subproject

This project uses [Semantic Versioning](https://semver.org/). Each commit on this branch increments the version and appends an entry below.

**Pre-1.0 (current):**
- **MAJOR (`0`)**: stays at `0` until first deployable release.
- **MINOR (`0.X.0`)**: substantive scope changes — new design doc added, new plan added, plan completed, breaking change to a docs convention, breaking change to interface/schema once implementation begins.
- **PATCH (`0.0.X`)**: refinements — wording fixes, decision updates that don't break linked plans, small additions inside an existing doc.

**Post-1.0 (future):**
- **MAJOR**: breaking changes to the wire protocol the server emulates, or to the storage schema.
- **MINOR**: backward-compatible feature additions.
- **PATCH**: bug fixes, documentation, refinements.

**Per-commit rules:**
1. Append an entry under a new version section that reflects the change's scope.
2. Group changes under the standard headings: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
3. Date each version (UTC).

**Historic entries are immutable.** Once a version section is appended, do not edit it. To correct an error, add a follow-up entry under a new patch version describing the correction.

---

## [0.1.1] - 2026-04-30
### Changed
- Tightened design drafts now that the architectural decision (private katana + slim indexer) is settled.
- `00-overview.md` Context replaced with the specific upstream torii bug detail (post-v1.7 model schema-upgrade skip causing column-missing insert failures). Rewrote the architectural-decision section to lead with the chosen path; kept rejected alternatives as concise prose. Added a `Closed` decision noting that we own schema management end-to-end so the upstream bug class doesn't apply to us.
- `02-data-model.md` calls out that we re-derive schema from the Cairo manifest at every startup (no in-place migrations) and so are immune to the upstream bug. Added a corresponding `Closed` decision.
- `03-indexer.md` lists which torii crates to evaluate for reuse, in priority order.
- `04-state-seeding.md` notes that a torii sqlite dump's freshness varies by model depending on the bug timeline; some models will require direct mainnet RPC reads.
- Renamed design and plan templates from `00-template.md` / `0000-template.md` to `TEMPLATE.md` (no number prefix). The numeric prefixes were misleading because they suggested the templates were real numbered docs. Updated `AGENTS.md` and the design/plans README index references accordingly.
- References to upstream torii in `AGENTS.md`, `01-wire-protocol.md`, `02-data-model.md`, and `03-indexer.md` use the canonical GitHub URL ([https://github.com/dojoengine/torii](https://github.com/dojoengine/torii)). Machine-specific paths (e.g. local clone) live in `AGENTS.local.md`.
### Added
- `External references` section in `AGENTS.md` pointing at the upstream torii repo, Pistols Cairo contracts, SDK, client, and manifests.
- New open decisions in `00-overview.md`: whether to invest in patching torii directly as an alternative (pending the bug-investigation report), and how much of the torii Rust crates are reusable.
- `AGENTS.local.md` (gitignored) for machine-specific agent instructions, with `CLAUDE.local.md` symlinked to it.
- `.gitignore` excluding `*.local.md` and `.DS_Store`.
- TASKS entry to integrate findings from the upstream-bug investigation when the report is delivered.

## [0.1.0] - 2026-04-30
### Added
- Subproject scaffold: `README.md`, `AGENTS.md` (with `CLAUDE.md` and `AGENT.md` symlinks).
- Documentation structure under `docs/`, split into `shaping/` (design, plans, wip) and `system/` (architecture, reference). Every doc folder has a `README.md` "start here" entry.
- Templates: `docs/shaping/design/00-template.md`, `docs/shaping/plans/0000-template.md`, `docs/system/template.md`. Shaping templates carry a terminal-status freeze banner; the plan template includes an `## Implementation docs` section to enforce the shaping → system lifecycle.
- WIP tracking: `docs/shaping/wip/STATUS.md`, `docs/shaping/wip/CHANGELOG.md` (this file), `docs/shaping/wip/TASKS.md`.
- Working agreements in `AGENTS.md` covering doc structure, status values (draft → shaping → implemented → deprecated), system-doc frontmatter (`last-verified`, `version`), bidirectional sync rule between designs and plans, immutability rules for terminal shaping docs and historic CHANGELOG entries, the shaping → system lifecycle, and per-commit conventions.
- Initial design drafts based on the 2026-04-30 strategy synthesis:
  - `00-overview.md` — architectural decision (private katana + slim indexer).
  - `01-wire-protocol.md` — torii subset to implement, with wire-format invariants.
  - `02-data-model.md` — sqlite schema, per-model tables, dojo-types integration.
  - `03-indexer.md` — katana RPC polling, decode pipeline, subscription fanout.
  - `04-state-seeding.md` — mainnet → katana migration via snapshot import.
  - `05-onchain-boundary.md` — Cartridge Controller, VRF, what stays real.
  - `06-deployment.md` — runtime topology and configuration.
