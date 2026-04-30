# Tasks

Transient working TODOs that don't yet warrant becoming a plan. Promote to `docs/shaping/plans/NNNN-*.md` once shape is clear and ownership is assigned. Delete once done.

## Open

- [ ] Fold findings from [`research/torii-skipped-model-upgrades`](../research/torii-skipped-model-upgrades.md) into [`00-overview`](../design/00-overview.md) Context and Decisions (the hazard is older than v1.7 — latent since v1.5.0 — but the user-visible bug only fires on cold re-index under v1.8.x; reinforces the case for owning schema management end-to-end), and into [`04-state-seeding`](../design/04-state-seeding.md) (which Pistols models can be sourced from a torii sqlite dump vs. require direct RPC reads, given the bug timeline).
- [ ] Spike VRF on private katana to confirm whether Cartridge's deployment works there, or whether we need a stub. Tracked in [`05-onchain-boundary`](../design/05-onchain-boundary.md).
- [ ] Investigate which torii Rust crates (`crates/proto/`, `crates/grpc/server/`, `crates/sqlite/sqlite/`) are reusable as libraries vs. writing fresh. Read directly against the local checkout at `~/Development/Underware/torii`. Tracked in [`03-indexer`](../design/03-indexer.md).
- [ ] Review and promote design drafts from `draft` to `shaping` after first round of feedback.
- [ ] Draft Plan 0001 (Phase 0 spike: tonic-web + `World.Worlds` + `POST /sql` against hand-built sqlite, end-to-end client handshake) once relevant designs are in `shaping`.

## Done

- [x] Draft initial design documents based on 2026-04-30 strategy synthesis.
- [x] Tighten design drafts and add external-references section once architectural decision settled.
- [x] Deliver upstream torii bug-investigation report — see [`research/torii-skipped-model-upgrades`](../research/torii-skipped-model-upgrades.md). Follow-up integration into designs is now its own open task above.
