# Tasks

Transient working TODOs that don't yet warrant becoming a plan. Promote to `docs/shaping/plans/NNNN-*.md` once shape is clear and ownership is assigned. Delete once done.

## Open

- [ ] Spike VRF on private katana to confirm whether Cartridge's deployment works there, or whether we need a stub. Tracked in [`05-onchain-boundary`](../design/05-onchain-boundary.md).
- [ ] Investigate which torii Rust crates (`crates/sqlite/sqlite/`, `crates/grpc/server/`, proto definitions) are reusable as libraries vs. writing fresh. Tracked in [`03-indexer`](../design/03-indexer.md).
- [ ] Review and promote design drafts from `draft` to `shaping` after first round of feedback.
- [ ] Draft Plan 0001 (Phase 0 spike: tonic-web + `World.Worlds` + `POST /sql` against hand-built sqlite, end-to-end client handshake) once relevant designs are in `shaping`.

## Done

- [x] Draft initial design documents based on 2026-04-30 strategy synthesis (0.1.0).
