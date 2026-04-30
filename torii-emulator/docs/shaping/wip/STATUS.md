# Status

Snapshot of design and plan state. Updated as part of any commit that changes design/plan status, ownership, or current focus.

## Current focus

Initial designs drafted and tightened around the chosen architecture (private katana + slim indexer). A review pass is pending — open question on whether to reconsider toward a fully-offchain emulator (no katana) before promoting designs out of `draft`. Awaiting the upstream torii bug-investigation report; once delivered, integrate its findings into [`00-overview`](../design/00-overview.md) and [`04-state-seeding`](../design/04-state-seeding.md).

## Designs

| ID | Title | Status | Plans |
|----|-------|--------|-------|
| 00 | [Overview](../design/00-overview.md) | draft | _none_ |
| 01 | [Wire protocol](../design/01-wire-protocol.md) | draft | _none_ |
| 02 | [Data model](../design/02-data-model.md) | draft | _none_ |
| 03 | [Indexer](../design/03-indexer.md) | draft | _none_ |
| 04 | [State seeding](../design/04-state-seeding.md) | draft | _none_ |
| 05 | [Onchain boundary](../design/05-onchain-boundary.md) | draft | _none_ |
| 06 | [Deployment](../design/06-deployment.md) | draft | _none_ |

## Plans

| ID | Title | Status | Designs |
|----|-------|--------|---------|

_None yet._

## Recently changed

| Date | What | Where |
|------|------|-------|
| 2026-04-30 | Tightened designs around chosen architecture; renamed templates; introduced `AGENTS.local.md`; switched torii refs to GitHub URL (0.1.1) | `AGENTS*.md`, `docs/shaping/`, `.gitignore` |
| 2026-04-30 | Subproject scaffolded with docs structure and initial design drafts (0.1.0) | `torii-emulator/` |
