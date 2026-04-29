---
title: "Deployment"
status: draft
plans: []
---

# 06 — Deployment

> **Frozen when `status` is `implemented` or `deprecated`.** To change shipped behavior, supersede this with a new design and link the replacement here. Day-to-day truth about how the system works lives in [`../../system/`](../../system/).

## Context

Sketches the runtime topology and deployment story. Light on detail until we have a working spike — most concrete answers come once we know the actual binary shape.

## Goals

- Single-process or small-process deployment (no kubernetes overhead).
- Configurable via env vars / TOML, matching the rest of the Pistols stack.
- Reproducible local-dev story — a developer can run the whole thing on their laptop.

## Non-goals

- Multi-region HA. Single-region is fine.
- Auto-scaling. Pistols load is small.
- Zero-downtime deploys initially.

## Detail

### Processes

At minimum:
- One `katana` process (Cartridge's starknet devnet binary) with persistent state.
- One `torii-emulator` process (Rust) hosting gRPC + HTTP, with a sqlite file alongside.

The indexer task lives inside the `torii-emulator` process for the simplest deployment story; it can be split later.

### Configuration

Mirror the parent project's conventions:
- Env vars for the small handful of knobs the Pistols stack uses (`TORII_URL`, `RPC_URL`, world address, sqlite path, log level).
- Per-environment TOML files for the rest (analogous to `dojo_dev.toml`, `dojo_mainnet.toml`).

### Persistence

- Katana state directory.
- Sqlite file (the indexer's working set).
- Both must survive process restarts. Backup strategy TBD.

### Hosting

TBD. Likely a single VM or container in the same provider as the rest of the Pistols infra. Defer until we have a binary to run.

## Decisions

### Open

- _2026-04-30_: Hosting — single VM, container, or Cartridge's slot infra (if available).
- _2026-04-30_: Backup cadence and target for sqlite + katana state.
- _2026-04-30_: Observability — logs only initially, or set up metrics from day one.

### Closed

_None yet._

## Plans

_None yet._
