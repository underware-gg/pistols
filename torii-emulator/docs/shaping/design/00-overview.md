---
title: "Overview"
status: draft
plans: []
---

# 00 — Overview

> **Frozen when `status` is `implemented` or `deprecated`.** To change shipped behavior, supersede this with a new design and link the replacement here. Day-to-day truth about how the system works lives in [`../../system/`](../../system/).

## Context

The Pistols game has been offline for ~6 months because the upstream torii indexer has a bug that prevents it from running our world. The Cartridge team is in the middle of a large-scale torii refactor; we don't know when it will land.

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

Three architectures considered (2026-04-30 strategy synthesis):

1. **Pure emulator (no chain).** Re-implement Pistols game logic in Rust; server is the source of truth. Highest fidelity to user experience (no gas, fastest UX) but enormous scope: ~10 Cairo systems re-implemented, plus VRF, ERC20, ERC721. High bug surface and divergence risk.
2. **Private katana + slim indexer.** Run pistols' existing Cairo contracts on a local katana (Starknet devnet). Build a Rust service that polls katana and re-exposes the torii wire surface the client uses. Cartridge Controller still works; it signs against our katana.
3. **Mainnet-only indexer.** Index mainnet directly via starknet RPC; transactions still go to mainnet. This is "build torii" — the thing the upstream team has been struggling with for 6 months. Don't.

**Chose option 2.** Cheapest path that keeps the game correct. The Cairo contracts are reused unchanged so game logic is exactly what was audited. Private katana means no mainnet ops, satisfying the "wouldn't be onchain" goal from the user perspective. Work scope is roughly: a Rust gRPC + sqlite server, an indexer task that reads katana, and a one-shot seeding tool for mainnet → katana migration.

### High-level shape

```
[ pistols client ] ── gRPC-Web / HTTP ──> [ torii-emulator ] ── starknet RPC ──> [ katana ]
                                              │                                       ▲
                                              │                                       │
                                              └── sqlite (mirrors torii schema)        │
                                                                                       │
        [ pistols client ] ─────────────── tx (Cartridge Controller) ──────────────────┘
```

The emulator never executes transactions; it only reads katana state. All mutations happen via Cartridge Controller signing transactions to katana on the player's behalf.

### How the design splits across this folder

- [`01-wire-protocol.md`](./01-wire-protocol.md) — which torii RPCs and HTTP endpoints we implement, with wire-format invariants.
- [`02-data-model.md`](./02-data-model.md) — the sqlite schema (mirroring torii) and per-model dynamic tables.
- [`03-indexer.md`](./03-indexer.md) — katana RPC polling, decoding, subscription fanout.
- [`04-state-seeding.md`](./04-state-seeding.md) — one-shot mainnet → katana state migration.
- [`05-onchain-boundary.md`](./05-onchain-boundary.md) — Cartridge Controller, VRF, what stays real.
- [`06-deployment.md`](./06-deployment.md) — runtime topology and config.

## Decisions

### Open

- _2026-04-30_: VRF on private katana — does Cartridge's VRF deployment work against a private chain, or do we need a stub? See [`05-onchain-boundary`](./05-onchain-boundary.md) for the open question; this is the largest unknown for option 2's feasibility.
- _2026-04-30_: How much of the upstream torii Rust crate ecosystem (proto, sqlite, grpc-server) is reusable as a library vs. writing fresh. Spike required.
- _2026-04-30_: Seeding strategy detail — see [`04-state-seeding`](./04-state-seeding.md).

### Closed

- _2026-04-30_: Private katana + slim indexer (option 2 above) chosen over pure emulator (option 1) and mainnet indexer (option 3). Reason: lowest scope, highest correctness, reuses audited Cairo contracts.

## Plans

_None yet — to be decomposed into Phase 0 (spike), Phase 1 (read path), Phase 2 (indexer feed), Phase 3 (seeding + cutover) once design drafts are reviewed._
