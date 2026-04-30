---
title: "Overview"
status: draft
plans: []
---

# 00 — Overview

> **Frozen when `status` is `implemented` or `deprecated`.** To change shipped behavior, supersede this with a new design and link the replacement here. Day-to-day truth about how the system works lives in [`../../system/`](../../system/).

## Context

The Pistols game has been offline for ~6 months because of a specific upstream bug introduced after **torii v1.7**: when a registered Dojo model's schema is upgraded (e.g. a new field is added to an existing model), torii skips applying the corresponding sqlite column-add migration. Subsequent inserts that try to write the new column fail, breaking ingest for that model. Because Pistols has evolved its model schemas since v1.7, mainnet torii cannot serve up-to-date state.

The Cartridge team is mid-way through a large-scale torii refactor; we don't know when a fix will land. An investigation into the specific bug is in progress (handled by a separate agent). Findings will inform how confident we are that the upstream fix is the right long-term answer (vs. this emulator becoming permanent).

This subproject builds a Rust server that emulates the subset of the torii wire interface used by the Pistols client, so the existing client can run against it without code changes. The client points at our server URL instead of a Cartridge-hosted torii.

## Goals

- Game playable end-to-end (matchmaking, duels, packs, tournaments) without a working torii.
- Client requires zero code changes — same gRPC, `/sql`, subscriptions surface.
- Cartridge Controller (login + tx signing) keeps working.
- Existing Cairo game contracts run unchanged. We do **not** re-implement game logic in Rust.
- State can be seeded from current mainnet so existing duelists, leaderboards, and balances persist.

## Non-goals

- Faithfully implementing the full torii API surface. Only the methods the Pistols client actually calls.
- Indexing arbitrary Dojo worlds. Pistols-specific.
- Long-term replacement of torii. Once the upstream refactor lands and works for Pistols, we expect to switch back. Until then this is the production indexer.
- Running on mainnet. The system runs against a private starknet chain (katana).

## Detail

### Architectural decision: private katana + slim indexer

Run pistols' existing Cairo contracts on a private katana (Starknet devnet). Build a Rust service that polls katana via starknet RPC and re-exposes the torii wire surface the Pistols client uses. Cartridge Controller still works — it just signs against our katana RPC instead of mainnet.

The emulator never executes transactions; it only reads katana state. All mutations happen via Cartridge Controller signing transactions to katana on the player's behalf.

#### Why not the alternatives

- **Pure emulator (no chain).** Re-implementing ~10 Cairo systems plus VRF / ERC20 / ERC721 in Rust is enormous scope and high divergence risk. Rejected as too much new code for too much new bug surface.
- **Mainnet-only indexer.** Indexing mainnet directly via starknet RPC is "build torii" — the thing the upstream team has been struggling with for 6 months. Rejected as the same problem we're trying to avoid.
- **Patch torii directly.** A targeted fix for the v1.7+ schema-upgrade skip might be smaller than this whole subproject. We can't rule it out yet — pending the bug-investigation report. Even if a torii patch turns out viable, the work in this subproject (state seeding, deployment topology, onchain-boundary decisions) is mostly reusable. We proceed in parallel.

### High-level shape

```
[ pistols client ] ── gRPC-Web / HTTP ──> [ torii-emulator ] ── starknet RPC ──> [ katana ]
                                              │                                       ▲
                                              │                                       │
                                              └── sqlite (mirrors torii schema)        │
                                                                                       │
        [ pistols client ] ─────────────── tx (Cartridge Controller) ──────────────────┘
```

### How the design splits across this folder

- [`01-wire-protocol.md`](./01-wire-protocol.md) — which torii RPCs and HTTP endpoints we implement, with wire-format invariants.
- [`02-data-model.md`](./02-data-model.md) — the sqlite schema (mirroring torii) and per-model dynamic tables.
- [`03-indexer.md`](./03-indexer.md) — katana RPC polling, decoding, subscription fanout.
- [`04-state-seeding.md`](./04-state-seeding.md) — one-shot mainnet → katana state migration.
- [`05-onchain-boundary.md`](./05-onchain-boundary.md) — Cartridge Controller, VRF, what stays real.
- [`06-deployment.md`](./06-deployment.md) — runtime topology and config.

## Decisions

### Open

- _2026-04-30_: Whether to invest in patching torii directly (pinning to a fix) as an alternative to running this emulator long-term. Pending the bug-investigation report. Even if torii is patchable, this subproject's seeding and deployment work is mostly reusable.
- _2026-04-30_: VRF on private katana — does Cartridge's VRF deployment work against a private chain, or do we need a stub? See [`05-onchain-boundary`](./05-onchain-boundary.md). Largest unknown for the emulator path.
- _2026-04-30_: How much of the upstream torii Rust crate ecosystem (`crates/sqlite/sqlite/`, `crates/grpc/server/`, `crates/proto/`) is reusable as a library vs. writing fresh. Spike required against the local torii checkout.
- _2026-04-30_: Seeding strategy detail — see [`04-state-seeding`](./04-state-seeding.md).

### Closed

- _2026-04-30_: Private katana + slim indexer chosen over pure emulator and mainnet-only indexer. Reason: lowest scope; reuses audited Cairo contracts; sidesteps the broken torii ingest path entirely (we own schema management end-to-end so the v1.7+ schema-upgrade-skip bug doesn't apply to us).

## Plans

_None yet — to be decomposed into Phase 0 (spike), Phase 1 (read path), Phase 2 (indexer feed), Phase 3 (seeding + cutover) once design drafts are reviewed._
