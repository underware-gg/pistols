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

**Note on data freshness**: the upstream torii bug (post-v1.7 schema-upgrade skip) means a torii sqlite dump's freshness varies by model. Models that haven't gained new fields since v1.7 may still be tracked correctly; models that have been upgraded since then will have stale or missing data in any torii dump. Direct mainnet RPC reads (`getStorageAt`) are authoritative regardless. The bug-investigation report (in progress) will help quantify which Pistols models are still trackable via a torii dump vs. which require direct RPC reads.

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

For models known to be unaffected by the schema-upgrade bug (per the investigation report), we may pull from a recent torii sqlite dump if obtainable — significantly faster than mainnet RPC for bulk reads. For models that *are* affected, direct RPC reads are required.

### Option C: Event replay

Replay all `PlayerActivityEvent` + system events from genesis to rebuild state in katana. Most faithful but most work.

**Recommended: Option B.** Faithful enough for player continuity; far less work than C.

## Decisions

### Open

- _2026-04-30_: Source of mainnet snapshot per model — direct `getStorageAt` polling vs. recent torii sqlite dump. Decision split by model based on the bug-investigation report findings.
- _2026-04-30_: Whether to seed historical events too, or only current-state models. Lean: current-state only initially; historical events accumulate from cutover forward.
- _2026-04-30_: Communication plan for in-flight duels/queues that won't survive the migration.

### Closed

- _2026-04-30_: Choose Option B (snapshot import) over A (cold start) and C (event replay). Reason: continuity matters; replay is over-investment.

## Plans

_None yet._
