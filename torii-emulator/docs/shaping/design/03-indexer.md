---
title: "Indexer"
status: draft
plans: []
---

# 03 — Indexer

> **Frozen when `status` is `implemented` or `deprecated`.** To change shipped behavior, supersede this with a new design and link the replacement here. Day-to-day truth about how the system works lives in [`../../system/`](../../system/).

## Context

Game state lives on a private katana (see [`00-overview`](./00-overview.md)). The indexer is the Rust task that reads state from katana and writes it into our sqlite, then fans changes out to active subscriptions.

## Goals

- Eventually-consistent: every committed katana state change visible in sqlite within a small bounded delay.
- Efficient subscription fanout: handle many concurrent long-lived gRPC subscriptions without per-subscriber polling.
- Decode Pistols models using `dojo-types` so wire shapes match what the SDK expects.

## Non-goals

- Reorg handling beyond what katana naturally needs (katana doesn't reorg in normal operation).
- Indexing multiple chains simultaneously.
- Backfilling historical state across long ranges in one pass — we seed once (see [`04-state-seeding`](./04-state-seeding.md)), then index forward.

## Detail

### Polling vs. push

Katana exposes starknet JSON-RPC. We poll for new blocks, fetch their state diffs, decode, and apply. Simple and good enough for a single-tenant private chain.

### Decode pipeline

1. Fetch new block via starknet RPC.
2. For each event matching our world address, decode using `dojo-types::ContractEntity` decoders (or equivalent).
3. Determine which model is being written (Cairo selector → namespace + name lookup loaded at startup from the Pistols manifest).
4. Upsert into the per-model sqlite table; update `entities` and `entities_historical`.
5. For event messages (historical + transient), append to `events`/`event_messages` and `event_messages_historical`.
6. Push update to subscription fanout.

### Subscription fanout

Each gRPC subscription has a filter (entity model + clauses, or event topic). The indexer maintains a broadcast channel per "filter shape" and dispatches updates only to matching streams. Goal: O(updates × matching subscribers), not O(updates × all subscribers).

### Reusing torii crates

The torii repo's `crates/sqlite/sqlite/`, `crates/grpc/server/`, and proto definitions may be importable as libraries. If usable, we save weeks. Worth investigating before writing fresh.

## Decisions

### Open

- _2026-04-30_: Polling interval — 1s vs. block-event-driven. Lean: 1s for the spike, optimize later.
- _2026-04-30_: How much of the torii Rust crate ecosystem is library-grade reusable. Spike required.
- _2026-04-30_: State diff source — `starknet_getStateUpdate` (precise) vs. event log (simpler; may miss non-event mutations). Pistols Dojo models emit storage events on every change, so events alone may suffice.

### Closed

_None yet._

## Plans

_None yet._
