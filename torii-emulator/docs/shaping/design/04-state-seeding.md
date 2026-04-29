---
title: "State seeding"
status: draft
plans: []
---

# 04 — State seeding

> **Frozen when `status` is `implemented` or `deprecated`.** To change shipped behavior, supersede this with a new design and link the replacement here. Day-to-day truth about how the system works lives in [`../../system/`](../../system/).

## Context

Pistols has 6+ months of mainnet game history: live duelists, leaderboards, ring claims, season scores, pack ownership. Restarting on a private katana with empty state would erase all of that.

This design covers how we seed the private katana from current mainnet state so existing players retain continuity.

## Goals

- Existing duelists, duels (settled and in-flight), rings, pack ownership, season scores, and leaderboards survive the transition.
- One-shot operation, run once before the cutover.
- Idempotent enough to test on a throwaway katana before the final run.

## Non-goals

- Faithful replay of the entire onchain history. We seed snapshot state, not history.
- Preserving in-flight matchmaking queues or partially-played duels in their most ephemeral states. Players re-enter.
- Mainnet → katana sync after cutover. Mainnet stops being load-bearing once the cutover happens.

## Detail

Three options considered:

### Option A: Cold start

Deploy contracts to katana, mint nothing, players start fresh. Simplest. Acceptable only if continuity is not a priority — likely not the case here.

### Option B: Snapshot import (recommended)

For each entity in each Dojo model on mainnet, read storage via `provider.getStorageAt` keyed by entity hash. Produce an admin-mode migration that:

- Re-mints duelist NFTs, duel NFTs, ring NFTs, and pack NFTs to current holders.
- Sets `Config`, `SeasonConfig`, `Pool`, `Leaderboard`, `Player`, `Duelist`, `RingBalance` directly via admin entrypoints.
- Skips ephemeral state (active matchmaking queues, duels mid-commit-reveal — those players re-enter).

Alternatively pull from a recent torii sqlite dump if we can get one (faster than mainnet RPC for bulk reads).

### Option C: Event replay

Replay all `PlayerActivityEvent` + system events from genesis to rebuild state in katana. Most faithful but most work.

**Recommended: Option B.** Faithful enough for player continuity; far less work than C.

## Decisions

### Open

- _2026-04-30_: Source of mainnet snapshot — direct `getStorageAt` polling vs. obtaining a recent torii sqlite dump (from Cartridge or a self-hosted instance). Lean: try torii dump first if obtainable.
- _2026-04-30_: Whether to seed historical events too, or only current-state models. Lean: current-state only initially; historical events accumulate from cutover forward.
- _2026-04-30_: Communication plan for in-flight duels/queues that won't survive the migration.

### Closed

- _2026-04-30_: Choose Option B (snapshot import) over A (cold start) and C (event replay). Reason: continuity matters; replay is over-investment.

## Plans

_None yet._
