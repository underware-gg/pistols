---
title: "Data model"
status: draft
plans: []
---

# 02 — Data model

> **Frozen when `status` is `implemented` or `deprecated`.** To change shipped behavior, supersede this with a new design and link the replacement here. Day-to-day truth about how the system works lives in [`../../system/`](../../system/).

## Context

The torii client expects a particular sqlite shape because its hand-written SQL queries reference torii's table names directly (e.g. `select * from "pistols-Challenge"`). Our server's storage must mirror torii's schema closely enough that those queries return correct results unchanged.

The Pistols Cairo world (in `../../../../dojo/src/`) defines 21 models and 9 events (5 historical, 4 transient). See research synthesized 2026-04-30 for the full inventory.

## Goals

- Sqlite schema that the Pistols client's hand-written SQL queries work against unchanged.
- Per-model tables synthesized at startup from the Cairo manifest; columns derived from each model's `Ty`.
- Schema lineage close enough to torii's that we can borrow torii's migrations as reference.

## Non-goals

- Generic Dojo schema generation for other worlds. Pistols-specific bindings welcome.
- Schema versioning across the indexer's lifetime — at this stage we wipe and rebuild on Cairo schema changes.

## Detail

### Static tables (mirroring torii)

Required because client SQL queries reference them directly:

- `contracts(id, contract_address, contract_type, head, …)` — `WHERE contract_type = 'WORLD'` for head block lookups.
- `models` — drives `World.Worlds` response.
- `entities` (and `entities_historical`) — with `world_address`, `entity_id`, slash-delimited `keys` for `KeysClause` REGEXP matching.
- `event_messages` (and `event_messages_historical`), `event_model`.
- `events`.
- `tokens`, `token_balances`, `token_transfers` — `token_id` is U256, composite SQL key `{contract}:{token_id_hex}`.
- `controllers` — address ↔ Cartridge username (may be stubbed; see [`05-onchain-boundary`](./05-onchain-boundary.md)).

### Per-model dynamic tables

At world bootstrap, for each registered Dojo model we synthesize a sqlite table named `"namespace-Model"` (e.g. `"pistols-Challenge"`). Columns come from the model's `Ty`:

- Primitives → typed columns.
- Struct/enum/array members → JSON columns.
- Struct member access via dotted paths (e.g. `[pistols-Challenge].[premise.value]`).

### Pistols model clusters

(For sizing and seeding — see [`04-state-seeding`](./04-state-seeding.md).)

| Cluster | Models | Volume estimate |
|---|---|---|
| Players | 6 | 10k–100k |
| Duelists | 3 | 10k–100k |
| Challenges/Rounds/Pacts | 4 | 100k–1M historical |
| Seasons/Leaderboards | 3 | 10s seasons |
| Tournaments | 5 | 10s tournaments |
| Rings | 2 | 100s |
| Packs | 1 | 1000s |
| Matchmaking/Banking/Config/Quizzes | 9 | small |

Total expected DB size: 0.5–2 GB.

### dojo-types integration

We rely on the upstream `dojo-types` crate for `Ty` decoding/encoding so `Model.schema` BLOBs round-trip through the SDK's deserializer without reinventing.

## Decisions

### Open

- _2026-04-30_: Borrow torii's migration files directly vs. write fresh schema. Lean: borrow as reference, write fresh (cleaner for our subset).
- _2026-04-30_: Historical event retention — keep all events forever (matches torii) vs. cap by season/age.
- _2026-04-30_: Whether to expose a torii-emulator-specific schema version table for our own bookkeeping.

### Closed

- _2026-04-30_: SQLite is the storage backend. Reason: matches torii (so client SQL works unchanged), and our scale fits comfortably.

## Plans

_None yet._
