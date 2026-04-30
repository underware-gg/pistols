# Tasks

Transient working TODOs that don't yet warrant becoming a plan. Promote to `docs/shaping/plans/NNNN-*.md` once shape is clear and ownership is assigned. Delete once done.

## Open

- [ ] Integrate findings from the upstream torii bug-investigation report (in progress, separate agent) into [`00-overview`](../design/00-overview.md) Context and Decisions, and into [`04-state-seeding`](../design/04-state-seeding.md) (which models can be sourced from a torii dump vs. require direct RPC reads).
- [ ] Spike VRF on private katana to confirm whether Cartridge's deployment works there, or whether we need a stub. Tracked in [`05-onchain-boundary`](../design/05-onchain-boundary.md).
- [ ] Investigate which torii Rust crates (`crates/proto/`, `crates/grpc/server/`, `crates/sqlite/sqlite/`) are reusable as libraries vs. writing fresh. Read directly against the local checkout at `~/Development/Underware/torii`. Tracked in [`03-indexer`](../design/03-indexer.md).
- [ ] Review and promote design drafts from `draft` to `shaping` after first round of feedback.
- [ ] Draft Plan 0001 (Phase 0 spike: tonic-web + `World.Worlds` + `POST /sql` against hand-built sqlite, end-to-end client handshake) once relevant designs are in `shaping`.

## Done

- [x] Draft initial design documents based on 2026-04-30 strategy synthesis (0.1.0).
- [x] Tighten design drafts and add external-references section once architectural decision settled (0.1.1).
