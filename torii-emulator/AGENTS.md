# Agent Instructions — torii-emulator

This is the canonical agent-instructions file for the `torii-emulator` subproject. `CLAUDE.md` and `AGENT.md` in this directory are symlinks to this file — edit only this file.

For machine-specific overrides (local clone paths, env-specific notes), see [`AGENTS.local.md`](./AGENTS.local.md) — gitignored, present only on developer machines.

## Project context

`torii-emulator` is a Rust server that re-implements the subset of the [torii](https://github.com/dojoengine/torii) indexer wire interface used by the Pistols client, so the game can run while torii itself is being refactored upstream. See [`README.md`](./README.md) for the overview, [`docs/`](./docs/) for all documentation, and [`docs/shaping/wip/STATUS.md`](./docs/shaping/wip/STATUS.md) for current state at a glance.

## External references

Code and documentation outside this subproject that agents will need to consult:

- **Upstream torii**: [https://github.com/dojoengine/torii](https://github.com/dojoengine/torii). Wire-format internals, sqlite migrations, crate boundaries. We pin against torii **v1.8.0** (the version the Pistols SDK pins). If a local clone is available, see `AGENTS.local.md` for the path and prefer reading code locally.
- **Pistols Cairo contracts**: `../dojo/src/` — the world's models, systems, and events. Source of truth for the data model.
- **Pistols TypeScript SDK**: `../sdk/src/` — wraps torii on the client side. Read to understand exact call shapes the emulator must serve.
- **Pistols client**: `../client/src/` — the consumer. SQL queries, subscription patterns, and Cartridge Controller wiring all live here.
- **Pistols manifests**: `../manifest_mainnet.json`, `../manifest_sepolia.json`, `../manifest_dev.json` — deployed world addresses, contract addresses, model selectors.

## Documentation structure

Two top-level categories under `docs/`. The split is semantic and load-bearing.

```
docs/
├── README.md                # top-level entry point
├── shaping/                 # the process of building (mutable, historicized)
│   ├── README.md
│   ├── design/              # what we're building & why
│   │   ├── README.md
│   │   └── TEMPLATE.md
│   ├── plans/               # how we're going to build it (append-only)
│   │   ├── README.md
│   │   └── TEMPLATE.md
│   ├── research/            # external/upstream investigations that inform designs
│   │   └── README.md
│   └── wip/                 # transient working state
│       ├── README.md
│       ├── STATUS.md
│       ├── CHANGELOG.md
│       └── TASKS.md
└── system/                  # the as-built artifact (kept in sync with code)
    ├── README.md
    ├── template.md
    ├── architecture/        # how it fits together: components, data flow, topology
    │   └── README.md
    └── reference/           # what it is: wire format, schema, config, CLI
        └── README.md
    # ops/ added later, when there's something to operate
```

Every folder has a `README.md` as its "start here" entry. Templates use the all-caps `TEMPLATE.md` name (no number prefix) so they're not confused with real numbered docs.

### Shaping (`docs/shaping/`)

About the **process of building**.

- **`design/`** — what we're building and why. Mutable but historicized. Numbered by topic group (e.g. `01-wire-protocol.md`), not chronology. Decisions tracked inline (`Open` / `Closed` sections); no separate ADRs.
- **`plans/`** — how we're going to build it. Append-only. Numbered chronologically (`0001-*.md`); plan numbers don't change once assigned.
- **`research/`** — external/upstream investigations that inform designs but don't themselves drive code. Snapshots at a point in time (e.g. an upstream-bug post-mortem, a competitor-protocol breakdown, a benchmarking report). Topic-named, no numeric prefix. Lighter frontmatter (`kind: research`, `date`); not subject to the design↔plan sync rule. Designs may cite research; research need not cite back.
- **`wip/`** — transient working state: STATUS, CHANGELOG, TASKS.

A design may be implemented by several plans; a plan may implement parts of several designs. Every design lists every plan that implements it; every plan lists every design it implements. Both ends must agree. Research sits outside this graph — designs reference it the way they reference any external source.

### System (`docs/system/`)

About the **as-built artifact**. Mutable; kept in sync with code.

- **`architecture/`** — explanation: component boundaries, data flow, sequence diagrams, deployment topology. No number prefixes; navigate via `README.md`.
- **`reference/`** — lookup: wire format actually implemented, sqlite schema, config keys, CLI commands.
- **`ops/`** — runbooks, deployment, debugging. Added later.

System docs use lighter frontmatter (no `status`); see [`docs/system/template.md`](./docs/system/template.md).

## Frontmatter

### Shaping docs (designs and plans)

```yaml
---
title: "..."
status: draft        # draft | shaping | implemented | deprecated
plans: [0001, 0002]  # designs only — plan numbers that implement this design
designs: [01, 03]    # plans only — design numbers this plan implements
---
```

Status values:

| Status | Design | Plan |
|--------|--------|------|
| `draft` | exists, not yet ready for review | written, not started |
| `shaping` | under active refinement | being refined / scope still moving |
| `implemented` | all linked plans done; doc reflects shipped reality | complete and merged |
| `deprecated` | superseded; keep with pointer to replacement | abandoned; keep with note |

### System docs (architecture and reference)

```yaml
---
title: "..."
last-verified: 2026-04-30   # date confirmed against current code
version: 0.X.Y              # SEMVER it describes
---
```

No `status`; system docs are either accurate or out-of-date. `last-verified` is the cheap accountability signal — if it's stale, treat the doc with suspicion.

## Bidirectional linking and sync

Within shaping:
- Each **design** lists every plan that implements it, both in `plans:` frontmatter and as a "Plans" section in the body.
- Each **plan** lists every design it implements, both in `designs:` frontmatter and as a "Design references" section in the body.
- Both ends must agree. Reviewers check before PR submission — there is no automation.

**Sync rule:** Any edit to a design must update its linked plans, and any edit to a plan must update its linked designs. Default assumption: a change requires updating both ends. If a change has no linked-side impact, say so explicitly in the commit message (e.g. `plans unchanged: edit clarifies wording only`).

System docs do not require this strict cross-linking; they may reference each other and shaping docs freely.

## Immutability rules

- **A shaping doc with terminal status (`implemented` or `deprecated`) is frozen.** To change shipped behavior, supersede it with a new design (or new plan) and link the replacement in the original. Day-to-day truth about the running system lives in `docs/system/`.
- **CHANGELOG entries are immutable once committed.** To correct a mistake, add a follow-up entry under a new patch version — never edit a historic version section.
- **Plans, once `implemented`, are not re-edited** even if scope changes. Add a new plan if more work is needed.

## Lifecycle: shaping → system

When a plan reaches `status: implemented`:
1. The plan stays in `shaping/plans/` (append-only, frozen).
2. The linked design(s) get a body update reflecting what shipped, then move to `status: implemented` if all their linked plans are done.
3. Durable architecture/reference content is added or updated in `docs/system/`. The plan's `## Implementation docs` acceptance criterion lists exactly which system docs land or change.
4. The CHANGELOG entry mentions both the plan completion and the system-doc updates.
5. `docs/shaping/wip/STATUS.md` is updated.

This is the discipline that prevents design docs from becoming load-bearing reference docs that drift from reality.

## Commits

Work on this branch (`torii-emulator`) is recorded as WIP commits. The branch is bundled into one or more PRs to `main` when scope is complete; commits inside the branch don't have to be PR-clean.

### Per-commit rules

- **Granular but complete.** A commit is a self-contained unit of work, kept as small as it can sensibly be. Don't bundle unrelated changes; don't split mid-thought changes.
- **Update STATUS.md** if the commit changes design/plan/research status, ownership, or current focus, or adds a notable shaping change to the _Recently changed_ table.
- **Code or `docs/system/` changes also:** bump the SEMVER version per the rules at the top of [`docs/shaping/wip/CHANGELOG.md`](./docs/shaping/wip/CHANGELOG.md) and append a changelog entry. Never edit historic changelog entries.
- **Shaping-only and meta-only commits do not bump the version or touch the changelog.** Edits confined to `docs/shaping/`, `AGENTS.md`, `README.md`, `.gitignore`, and similar working/meta files are recorded in git history and (where notable) in `STATUS.md`'s _Recently changed_ section. The changelog is reserved for the as-built artifact.

### Pre-PR review

Before opening a PR to `main`, walk through every changed shaping and system doc and confirm:
1. Linked-side shaping documents are consistent (no stale references; status values match reality).
2. System docs reflect what was actually built (`last-verified` and `version` updated where applicable).
3. `docs/shaping/wip/STATUS.md` reflects current state.
4. If the PR touches code or system docs, `docs/shaping/wip/CHANGELOG.md` entries accurately describe the changes and the final version is appropriate for the PR's overall scope. If the PR is shaping-only, the changelog should be untouched.

## Implementation conventions

_(Coding style, test policy, and tooling will be filled in once implementation begins. Until then, this file covers documentation work only.)_
