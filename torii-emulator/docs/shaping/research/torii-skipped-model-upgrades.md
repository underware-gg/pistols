---
title: "Torii skipped-model-upgrade bug"
kind: research
date: 2026-05-01
informs: [00, 04]
---

# Torii skipped-model-upgrade bug — confirmed report

## Preamble

In **Oct 2025**, fresh torii recreates for Pistols on **Sepolia** began returning missing-column failures. On **2025-10-10**, mataleone reported that `pistols-Config.realms_address`, added two weeks earlier, was absent from the SQL schema, and gRPC entity reads were failing with `no such column: pistols-Config.realms_address`. The same missing-column symptom was also seen on cold-indexed **mainnet** torii recreates. In **Dec 2025**, the last previously working mainnet torii was cold-reindexed. From the outside, the issue presented as torii recreates dropping columns during replay. This report explains the confirmed cause, the exact historical replay window, the local repro, and the torii patch that now gets the known Pistols path through cleanly.

## TL;DR

Pistols torii cold-index failures first surfaced publicly on **Sepolia** in **Oct 2025**, but the same replay bug already applied to **mainnet** and was only masked by older continuously running indexers that never had to cold-replay the bad window. The failure was the combination of two torii bugs: a historical event-task dependency bug around `PlayerActivityEvent.activity = 18` at Sepolia block `2271871`, and a rollback/cache divergence bug that could then skip `ALTER TABLE` on retry and poison the DB. A local patch that merges dependencies into existing historical tasks, preserves late prerequisite links, clears rollback-sensitive cache state, and reloads model definitions from committed storage now replays the exact failure window cleanly and lands the missing schema changes.

## Summary

- The Pistols cold-reindex failure is the interaction of **two torii bugs**, not one.
- The **trigger bug** is in historical event tasking: torii groups `PlayerActivityEvent` replay work by `(world, selector, player)`, then appends later same-player events to an existing task **without merging newly discovered dependencies**.
- The captured failing payload is the `pistols-matchmaker` `PlayerActivityEvent` at **Sepolia block `2271871`** with `activity = 18` (`EnlistedRankedDuelist`), and it occurs **after** the `PlayerActivityEvent` schema upgrade at block `2270724`.
- Because that later event is replayed on an already-existing same-player task that never acquired the `EventUpgraded(PlayerActivityEvent)` dependency, torii decodes it against the **pre-18 schema** and throws `InvalidEnumSelector { actual_selector: 18 }`.
- The **poisoned-DB bug** is in rollback handling: chunk rollback discards queued SQL but leaves commit-sensitive cache state ahead of the database. On retry, torii can skip `ALTER TABLE`, leaving schema metadata newer than the actual SQLite table.
- This is exactly how `pistols-Config.realms_address` and the later Oct 2025 missing columns were lost.
- The local repro is now complete end-to-end:
  - unpatched `torii 1.8.7` reproduces the stale DB state
  - patched torii crosses the exact Sepolia trigger window cleanly
  - `Config.realms_address` lands
  - `PlayerActivityEvent` upgrades to include `EnlistedRankedDuelist`
  - replay continues without `InvalidEnumSelector`
- The confirmed local remediation is:
  - merge dependencies into existing historical event tasks
  - retain late prerequisite links in `TaskNetwork`
  - clear rollback-sensitive cache state on rollback
  - reload model definitions from committed storage after rollback instead of relying on an emptied cache

## Scope

Both Pistols networks use the same world address.

| Network | World address |
|---|---|
| `mainnet` | `0x8b4838140a3cbd36ebe64d4b5aaf56a30cc3753c928a79338bf56c53f506c5` |
| `sepolia` | `0x8b4838140a3cbd36ebe64d4b5aaf56a30cc3753c928a79338bf56c53f506c5` |

Affected torii status:

- The rollback/cache hazard was introduced in the old `dojoengine/dojo` monorepo on **2024-11-14**.
- It is present in every standalone torii release since **`v1.5.0`**.
- It is still present in local source at **`v1.8.15`**.
- The first public Pistols cold-reindex failures show up on **`v1.8.1`**.

## Reported symptom

What operators saw:

- `ModelUpgraded` events succeeded on chain and torii logged `Upgraded model. namespace=pistols name=...`.
- Torii schema metadata and `/schema` output showed the new field.
- The backing SQLite table did **not** have the new column.
- Reads then failed with errors like:
  - `no such column: pistols-Config.realms_address`
  - `no such column: pistols-Duelist.released_fame`
  - `no such column: pistols-Pack.pegged_lords_amount`
- Writes then failed with errors like:
  - `table pistols-Config has no column named realms_address`
  - `table pistols-DuelistAssignment has no column named season_id`
  - `table pistols-MatchQueue has no column named enlisted_duelist_ids`
- The indexer could still appear to be alive, because row-level executor failures are logged asynchronously and do not necessarily stop the main loop.
- The first public Sepolia report was `pistols-Config.realms_address` on **2025-10-10**.
- In that same first Sepolia report, another recently added field, `pistols-Player.referrer_address`, was indexing correctly. That matters because it shows the failure was not "torii cannot apply upgrades at all"; it was selective and chunk-local from the start.
- By **2025-10-28** and **2025-12-19/20**, the same pattern had spread to multiple fields from the Oct 2025 ranked-queue / FAME rollout.

`blocks_chunk_size` matters:

- `10240` reproduces the bug
- `1024` avoids schema poisoning locally by separating the upgrade from the failing event into different chunks

That is a workaround, not a fix.

## Confirmed cause

The failure has two stages: a **trigger bug** and then a **rollback/cache divergence bug**.

### 1. Trigger bug: historical event tasks lose upgrade dependencies

The captured failing path is now explicit:

- processor: `EventMessageProcessor`
- event: `pistols-PlayerActivityEvent`
- system: `pistols-matchmaker` (`0x16f7e3c140b4778e776221c7bb8b880d20d247c3ab0d06fab9a8eb96e7098bb`)
- failing block: **`2271871`**
- failing discriminant: `activity = 18`
- failing schema version at decode time: the **pre-18** `PlayerActivityEvent` resource

The exact mechanism is:

1. Earlier `PlayerActivityEvent`s for the **same player** already exist in the same replay chunk before block `2270724`.
2. `EventMessageProcessor` groups historical event replay by `(world, selector, player)`.
3. Those earlier events create the historical replay task for that player.
4. `EventUpgraded(PlayerActivityEvent)` occurs on chain at **block `2270724`**.
5. The later `activity = 18` event at **block `2271871`** is appended to the existing same-player task.
6. `TaskManager::add_parallelized_event_with_dependencies(...)` did not merge the new selector-upgrade dependency into that existing task.
7. `TaskNetwork::add_task_with_dependencies(...)` also dropped unresolved dependencies whose prerequisite task did not yet exist.
8. The replay task therefore runs the later `activity = 18` event against the **old pre-18 schema** and throws `InvalidEnumSelector`.

This is the trigger.

### 2. Poisoned-DB bug: rollback leaves cache ahead of SQLite

Once the trigger fires in the same chunk as a `ModelUpgraded`:

1. Torii has already queued `ALTER TABLE` work for the model upgrade.
2. Torii has already updated in-memory model cache state to the new schema.
3. The chunk fails on `InvalidEnumSelector`.
4. The executor transaction is rolled back.
5. The in-memory cache is not restored to the last committed state.
6. On retry, `UpgradeModelProcessor` reads `prev_schema` from the cache, sees no diff, and skips the `ALTER TABLE`.

That is how you get:

- `models.schema` / `/schema` saying the field exists
- SQLite table still missing the column
- all later writes and reads for that field failing

### 3. Combined failure chain

For the reported `Config.realms_address` case, the full chain is:

1. Replay enters the incident-era Sepolia chunk.
2. Earlier same-player `PlayerActivityEvent`s create a historical replay task on the old event schema.
3. Torii processes `EventUpgraded(PlayerActivityEvent)` at block `2270724`.
4. Torii processes `ModelUpgraded(Config)` in the same chunk.
5. The later `PlayerActivityEvent.activity = 18` at block `2271871` is appended to the existing task without the selector-upgrade dependency.
6. `EventMessageProcessor` decodes it against the old pre-18 schema and throws `InvalidEnumSelector`.
7. SQL rolls back.
8. Cache state remains ahead of SQL state.
9. Retry skips the `Config` schema change.
10. `realms_address` is missing permanently in that DB.

## Timeline of decisive events

| Date / time | Event | Why it matters |
|---|---|---|
| `2024-11-14` | rollback-without-cache-invalidation and synchronous model/event cache mutation both exist in the monorepo | hazard introduced |
| `2025-04-29` | `torii v1.5.0` | first standalone release containing the hazard |
| `2025-09-28 00:40:00 UTC` | Sepolia `EventUpgraded(PlayerActivityEvent)` at block `2270724` | first on-chain `18`-capable `PlayerActivityEvent` schema |
| `2025-09-28 01:47:02 UTC` | captured failing `PlayerActivityEvent.activity = 18` at block `2271871` | exact trigger payload |
| `2025-10-10` | first public Sepolia report: `Config.realms_address` missing on fresh `v1.8.1` recreate | first visible user impact |
| `2025-10-14` | local log shows `UpgradeEvent(PlayerActivityEvent)` then `UpgradeModel(Config)` then `InvalidEnumSelector` | the event/model pairing was already visible |
| `2025-10-28` | broader missing-column rollout (`season_id`, `released_fame`, `enlisted_duelist_ids`) | same bug shape on more fields |
| `2026-04-30` | local instrumented replay captures exact failing processor, event, block, and raw payload | root cause pinned down |
| `2026-05-01` | local patched replay crosses the bad window cleanly | remediation confirmed locally |

## Reproduction and confirmation

### Repro config

The incident-era Sepolia repro config used for the confirmed local replay was:

```toml
#
# Dedicated torii config for reproducing the historical Sepolia
# skipped-model-upgrade / poisoned-DB failure.
#
# This intentionally mirrors the narrower incident config from the Oct 2025
# reports rather than the current broader checked-in Sepolia config.
#
world_address = "0x8b4838140a3cbd36ebe64d4b5aaf56a30cc3753c928a79338bf56c53f506c5"
rpc = "https://api.cartridge.gg/x/starknet/sepolia/rpc/v0_9"

[events]
raw = true

[sql]
historical = [
  "pistols-PlayerActivityEvent",
  "pistols-LordsReleaseEvent",
  "pistols-PurchaseDistributionEvent",
  "pistols-TrophyProgression",
]

# [grpc]
# subscription_buffer_size = 10000

[indexing]
world_block = 23920
blocks_chunk_size = 10240
# max_concurrent_tasks = 40
transactions = true
controllers = true
pending = true
contracts = [
  "erc721:0x2e9c711b1a7e2784570b1bda5082a92606044e836ba392d2b977d280fb74b3c", # duel_token
  "erc721:0x7aaa9866750a0db82a54ba8674c38620fa2f967d2fbb31133def48e0527c87f", # duelist_token
  "erc721:0x71333ac75b7d5ba89a2d0c2b67d5b955258a4d46eb42f3428da6137bbbfdfd9", # pack_token
  "erc721:0x14aa76e6c6f11e3f657ee2c213a62006c78ff2c6f8ed40b92c42fd554c246f2", # ring_token
  # "erc721:$tournament_token", # tournament_token
  "erc20:0x2549653a4ae1ff8d04a20b8820a49cbe97486c536ec0e4c8f68aa33d80067cf", # fame_coin
  "erc20:0x68a7a07e08fc3e723a878223d00f669106780d5ea6665eb15d893476d47bf3b", # fools_coin
  "erc20:0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210", # lords
]
```

### Why `blocks_chunk_size = 10240` reproduces it

With `world_block = 23920` and `blocks_chunk_size = 10240`, the critical replay chunk is:

- **`2266480 .. 2276720`**

That single chunk contains:

- earlier same-player `PlayerActivityEvent`s
- `EventUpgraded(PlayerActivityEvent)` at `2270724`
- `ModelUpgraded(Config)`
- the later `PlayerActivityEvent.activity = 18` at `2271871`

That is exactly the shape needed to trigger the bug.

### Unpatched local repro

Using unpatched **`torii 1.8.7`** with the repro config against a fresh SQLite DB:

- replay advanced to world head **`2344836`**
- `pistols-Config` still lacked `realms_address`
- `pistols-PlayerActivityEvent` still had the old `activity_check` ending at `ClaimedRing`
- `models.schema` for both `Config` and `PlayerActivityEvent` was still stale

The relevant DB shape was:

```sql
SELECT head FROM contracts WHERE contract_type = 'WORLD';
-- 2344836

PRAGMA table_info([pistols-Config]);
-- key, treasury_address, lords_address, vrf_address, current_season_id, is_paused
-- no realms_address

SELECT name,
       instr(schema, 'realms_address') > 0,
       instr(schema, 'EnlistedRankedDuelist') > 0
FROM models
WHERE namespace = 'pistols'
  AND name IN ('Config', 'PlayerActivityEvent')
ORDER BY name;
-- Config|0
-- PlayerActivityEvent|0
```

That reproduces the stale DB state locally.

### Instrumented trigger capture

The instrumented replay then captured the exact failing event:

- block: **`2271871`**
- tx: `0x69d9c453590c8173f711e74ab0b962caa869abe6ca3e127ad9fa064d8595580`
- event: `PlayerActivityEvent`
- raw values: `[0x68d89396, 0x12, 0x351, 0x1]`
- `activity = 0x12 = 18`
- same player had earlier activity events in the same chunk before `2270724`

The failing log is reproduced in Appendix B.

### Patched local confirmation

The patched torii binary was then resumed from a copied pre-critical DB at world head **`2262908`**.

That replay crossed the decisive checkpoints:

- earlier same-player events in the chunk
- `EventUpgraded(PlayerActivityEvent)` at `2270724`
- the captured failing payload block `2271871`

After the crossing:

- world head continued to **`2273149`**, then **`2283390`**, then **`2293631`**
- `Config` flipped from `0` to `1` for `realms_address`
- `PlayerActivityEvent` flipped from `0` to `1` for `EnlistedRankedDuelist`
- `PRAGMA table_info([pistols-Config])` now includes `realms_address`
- `activity_check` now includes `EnlistedRankedDuelist`
- at head `2293631`, the table already contained `EnlistedRankedDuelist` rows
- torii continued logging `Store event message. namespace=pistols name=PlayerActivityEvent system=0x16f7e3c1…` without `InvalidEnumSelector`

That is the local end-to-end confirmation.

## Confirmed fix

### Local patch contents

The local torii patch that resolved the repro did four things:

1. **Merge dependencies into existing historical event tasks**
   - `crates/processors/src/task_manager.rs`
   - when a task already exists, new dependencies are merged instead of dropped

2. **Retain late prerequisite links in `TaskNetwork`**
   - `crates/task-network/src/lib.rs`
   - dependencies are not discarded just because the prerequisite task has not been inserted yet

3. **Clear rollback-sensitive cache state on rollback**
   - `crates/indexer/engine/src/engine.rs`
   - clear model cache state and balance-diff state when a chunk rolls back

4. **Reload model definitions from committed storage after rollback**
   - processors that need model definitions read them via committed storage instead of trusting an emptied cache
   - this avoids the `CacheError(ModelNotFound(...))` failure mode seen with bare `clear_models()`

### Why `clear_models()` alone was not enough

`clear_models()` alone was the right diagnosis for the poisoned-DB bug, but not the whole fix.

What local testing showed:

- unpatched replay: stale schema / missing-column failure
- patched replay with only `clear_models()`: hit `CacheError(ModelNotFound(...))` after rollback
- patched replay with storage-backed model reloads: crossed the failure window cleanly

So the confirmed practical fix is:

- rollback-time cache clearing
- plus storage-backed model reloads after rollback

### What is confirmed

This report proves the Pistols replay path end-to-end:

- the trigger bug is the missing dependency merge for existing historical event tasks
- the poisoned-DB bug is rollback/cache divergence
- the combined local fix above resolves the confirmed Sepolia repro

This report does **not** claim that every rollback-sensitive cache path in torii has been exhaustively audited. It proves the Pistols repro path and the fix for that path.

### Recommended upstream remediation

The confirmed upstream direction is:

1. merge dependencies into existing historical event tasks
2. retain unresolved dependencies until their prerequisite task exists
3. clear rollback-sensitive cache state on rollback
4. reload model definitions from committed storage after rollback
5. add regression tests for:
   - existing-task dependency merge
   - late prerequisite insertion
   - chunk rollback after `ModelUpgraded`
   - historical replay through the `PlayerActivityEvent` Sepolia window

Optional hardening ideas remain useful, but they are not required to explain or fix the proven Pistols bug path. Those are collected in Appendix E.

## Operational notes

### Temporary mitigation before an upstream patch

If a patched torii release is not available yet:

- use `blocks_chunk_size <= 1024` for fresh cold reindexes
- avoid unnecessary delete+create of a long-running healthy DB
- if the DB is already poisoned, repair the SQLite table shape directly

### Poisoned DB repair

The detailed repair procedure is in Appendix A.

The short version:

1. stop torii
2. back up the DB
3. verify that `models.schema` includes the field but `PRAGMA table_info` does not
4. `ALTER TABLE ... ADD COLUMN ...` for the missing flattened columns
5. restart torii

## Appendix A: Repairing a poisoned DB

This is the recovery procedure for a DB already in the poisoned state: torii's `models.schema` JSON and `/schema` output mention a field, but the backing SQLite table is missing the corresponding column. It only covers **additive** `ModelUpgraded` diffs like the observed Pistols failures. It does **not** fix torii itself, and it does **not** resolve a chunk that is still actively failing on `InvalidEnumSelector`.

1. Stop torii and take a cold backup of the sqlite files. If the deployment uses WAL mode, copy the main DB plus any sibling `-wal` / `-shm` files after torii has stopped.
2. Confirm the table is poisoned. For a suspected `pistols-Config` failure:

   ```sql
   SELECT namespace, name FROM models WHERE namespace = 'pistols' AND name = 'Config';
   SELECT schema FROM models WHERE namespace = 'pistols' AND name = 'Config';
   PRAGMA table_info([pistols-Config]);
   ```

   The poisoned signature is: the field exists in `models.schema` (and usually torii `/schema`) but does **not** appear in `PRAGMA table_info`.
3. Determine the missing flattened column definitions. Torii's schema flattener in `crates/sqlite/sqlite/src/lib.rs:416-606` uses these rules:
   - nested structs flatten to dot-joined column names, e.g. `rules.realms_address`
   - tuples flatten by numeric segment, e.g. `position.0`, `position.1`
   - arrays, fixed-size arrays, and byte arrays are stored as `TEXT`
   - enums use a discriminator column of the form `TEXT CONSTRAINT [<col>_check] CHECK([<col>] IN (...))` and may add payload columns for non-empty variants
   - verified primitive storage classes from current torii, cross-checked via `map_row_to_ty` in `crates/sqlite/sqlite/src/model.rs:223-320`:
     - `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `bool` -> `INTEGER`
     - `i128`, `u64`, `u128`, `u256`, `felt252`, `class_hash`, `contract_address`, `eth_address` -> `TEXT`

   For the observed Pistols failures this gives:
   - `pistols-Config.realms_address` (`ContractAddress`) -> `TEXT`
   - `pistols-DuelistAssignment.season_id` (`u32`) -> `INTEGER`
   - `pistols-MatchQueue.enlisted_duelist_ids` (`Array<u128>`) -> `TEXT`
   - `pistols-Duelist.released_fame` (`bool`) -> `INTEGER`

   For enums or more complex nested additions, the safest source of truth is `.schema` from a healthy DB built by the **same torii version**, then copy the missing `ADD COLUMN` definitions exactly.
4. Add the missing columns manually. SQLite requires one `ADD COLUMN` per statement, but you can wrap multiple statements in a single transaction:

   ```sql
   BEGIN IMMEDIATE;
   ALTER TABLE [pistols-Config] ADD COLUMN [realms_address] TEXT;
   ALTER TABLE [pistols-DuelistAssignment] ADD COLUMN [season_id] INTEGER;
   ALTER TABLE [pistols-MatchQueue] ADD COLUMN [enlisted_duelist_ids] TEXT;
   ALTER TABLE [pistols-Duelist] ADD COLUMN [released_fame] INTEGER;
   COMMIT;
   ```

   Add one statement per missing flattened column. Do **not** edit the `models` table's `schema` JSON row; in the poisoned state that metadata is already the desired end-state.
5. Recreate any missing indexes if torii would have created them. Torii names them `idx_<table>_<column>`. Compare `PRAGMA index_list([pistols-Config]);` against a healthy DB or the torii config. Missing indexes are mainly a performance concern; the missing column itself is the correctness blocker.
6. Restart torii and verify:
   - `PRAGMA table_info([pistols-Config]);` now shows the repaired column
   - executor errors of the form `table … has no column named …` stop
   - gRPC/entity reads stop failing with `no such column`
   - if torii still immediately retries the same chunk with `InvalidEnumSelector`, the DB repair worked but the independent replay failure still needs the torii fix

## Appendix B: Detailed local evidence

### Captured failing event

The instrumented replay captured the failing historical event as:

```text
ERROR torii::indexer::processors::event_message:
  Failed to deserialize event message.
  namespace=pistols
  name=PlayerActivityEvent
  selector=0x46a192c105a4598953e7aeaf3809703964eb9e6d65403156d0458dcd2ee379b
  model_contract_address=0x463f225e1e0947bdee8c6602c36489f95e2288b10a918045fb6d26677346536
  class_hash=0x30f045ec01d80f780a5e9c2d8e1bbf509281083c9aac074cb662d6184286c8a
  use_legacy_store=true
  raw_keys=[0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f]
  raw_values=[0x68d89396, 0x12, 0x351, 0x1]
  error=InvalidEnumSelector { actual_selector: 18 }
```

Immediately after, torii logged:

```text
INFO  upgrade_event: Upgraded event. namespace=pistols name=PlayerActivityEvent
      contract_address=0x22c1242998b48e110928f178da4d3b205da9d98998adbc2f9d7146e7c4882bf
      class_hash=0x1ed241446f4c94ccbb186927f5d06c685adcbf043935d99bf54bb90ef5723b4

INFO  upgrade_model: Upgraded model. namespace=pistols name=Config
ERROR engine: Processing fetched data. error=Processors(TaskNetworkError(TaskError(
      PrimitiveError(InvalidEnumSelector { actual_selector: 18 }))))
```

### Exact chain proof

Direct `starknet_getEvents` checks prove:

- the captured failing payload is the world `EventEmitted` at **block `2271871`**
- tx hash: `0x69d9c453590c8173f711e74ab0b962caa869abe6ca3e127ad9fa064d8595580`
- the third key resolves to the `pistols-matchmaker` system
- the same player already had earlier `PlayerActivityEvent`s in the same chunk at:
  - `2268329`
  - `2268359`
  - `2268364`
  - `2268403`
  - `2268406`
  - `2268420`
  - `2268449`
  - `2269979`
  - `2270482`

### Unpatched DB snapshot

At head `2344836`, the unpatched replay still looked like this:

```sql
SELECT head FROM contracts WHERE contract_type = 'WORLD';
-- 2344836

SELECT name,
       instr(schema, 'realms_address') > 0,
       instr(schema, 'EnlistedRankedDuelist') > 0
FROM models
WHERE namespace = 'pistols'
  AND name IN ('Config', 'PlayerActivityEvent')
ORDER BY name;
-- Config|0
-- PlayerActivityEvent|0
```

The `pistols-PlayerActivityEvent` DDL still ended at:

```text
... CHECK([activity] IN (
  'Undefined', 'TutorialFinished', 'PackStarter', 'PackPurchased',
  'PackOpened', 'DuelistSpawned', 'DuelistDied', 'ChallengeCreated',
  'ChallengeCanceled', 'ChallengeReplied', 'MovesCommitted',
  'MovesRevealed', 'PlayerTimedOut', 'ChallengeResolved',
  'ChallengeDraw', 'ClaimedGift', 'AirdroppedPack', 'ClaimedRing'
))
```

### Patched DB snapshot

After the patched replay crossed the same window:

```sql
SELECT head FROM contracts WHERE contract_type = 'WORLD';
-- 2293631

SELECT 'Config', instr(schema,'realms_address')>0
FROM models WHERE namespace='pistols' AND name='Config';
-- Config|1

SELECT 'PlayerActivityEvent', instr(schema,'EnlistedRankedDuelist')>0
FROM models WHERE namespace='pistols' AND name='PlayerActivityEvent';
-- PlayerActivityEvent|1

PRAGMA table_info([pistols-Config]);
-- now includes realms_address

SELECT count(*) FROM [pistols-PlayerActivityEvent]
WHERE activity='EnlistedRankedDuelist';
-- 2
```

And the `pistols-PlayerActivityEvent` DDL now includes:

```text
'EnlistedRankedDuelist'
```

### Why the poisoned indexer can still look alive

One operationally confusing part of this bug is that torii can stay visibly active after the DB is already poisoned.

The reason is architectural:

1. many row writes are queued asynchronously to the SQLite executor
2. row-level SQL failures are logged by the executor
3. those row-level failures do not necessarily abort the main indexing loop

So once a table is missing a column, torii can keep:

- advancing world head
- processing later chunks
- logging read/write failures for the poisoned models

That is why the Dec 2025 reports could show both:

- repeated `no such column` / `has no column named` errors
- and an indexer that still appeared to be indexing

This is not a separate root cause. It is a consequence of the executor design, and it makes the bug operationally worse because the system can look partially healthy while silently dropping writes and serving broken reads.

## Appendix C: Full reference timeline

| Date / time | Project | Ref | Chain / block reference | Why it matters |
|---|---|---|---|---|
| `2024-11-14` | dojo/torii ancestry | `32196a67` | n/a | rollback path lands without cache invalidation |
| `2024-11-14` | dojo/torii ancestry | `45a0a650` | n/a | model/event upgrade path lands with immediate cache mutation |
| `2025-04-25 13:47:39 +10:00` | Pistols code | `64fb06ba` | n/a | `PlayerDuelistStack` model lands |
| `2025-04-29` | torii | `v1.5.0` / `d392987f` | n/a | first standalone torii release carrying the latent rollback/cache bug |
| `2025-05-04 20:04:01 -03:00` | Pistols code | `28a3f8c9` | n/a | `GenesisKey::Groggus = 18` lands after `PlayerDuelistStack` already exists |
| `2025-05-05 12:56:03 UTC` | chain check | mainnet `1375000` | `ContractNotFound` for current world | current mainnet world definitely does **not** exist yet; this makes pre-Groggus mainnet schema replay a weak explanation |
| `2025-05-06 19:48:47 UTC` | chain check | sepolia `750000` | world exists | current sepolia world appears only in a narrow May 2-6 window around `Groggus`, so it is not a strong cross-network explanation |
| `2025-09-27 18:45:27 -03:00` | Pistols code | `b9840a17` | sepolia `2270000` -> old schema, `2272000` -> upgraded schema | `PlayerActivityEvent` first gains `EnlistedRankedDuelist` locally; chain confirms sepolia publishes it within this window |
| `2025-09-27 22:34:19 -03:00` | Pistols deploy | `4712654a` (`migrate sepolia`) | sepolia `2270000` / `2272000` | best sepolia replay bracket for the actual event-schema transition |
| `2025-09-28 00:40:00 UTC` | chain check | sepolia `2270724` | `EventUpgraded`: `0x0280394e… -> 0x022c1242…` | direct proof the world emitted the `PlayerActivityEvent` upgrade to the first schema that includes `18` |
| `2025-09-28 05:50:51 UTC` | chain check | mainnet `2500000` | event resource `0x05fbad80…` | mainnet still on the pre-upgrade `PlayerActivityEvent` resource here |
| `2025-09-29 18:07:42 -03:00` | Pistols deploy | `9a3171a1` (`migrate mainnet`) | mainnet later confirmed upgraded by `2831000` | mainnet deployment point for the same schema era |
| `2025-09-29 19:44:47 UTC` | chain check | mainnet `2544507` | `EventUpgraded`: `0x05fbad80… -> 0x05d875a0…` | direct proof the world emitted the mainnet `PlayerActivityEvent` upgrade that makes `18` valid |
| `2025-09-30` | torii | `v1.7.3` / `0155915d` | n/a | hazard already present before Pistols starts seeing it |
| `2025-10-01 22:19:21 UTC` | chain check | mainnet `2600000` | event resource `0x05d875a0…` | mainnet has already switched to the `PlayerActivityEvent` resource that later proves variant `18` is live |
| `2025-10-06` | torii | `v1.7.5` / `e0ba3fc5` | n/a | verified locally to have the same rollback/cache bug as HEAD |
| `2025-10-09` | torii | `v1.8.1` / `053de409` | Dojo pin `711cb72` | first version that bites cold re-indexes in user reports |
| `2025-10-09 13:25:29 UTC` | chain check | mainnet `2831000` | event resource `0x05d875a0…`, variants `0..18` | proves `PlayerActivityEvent` variant `18` is already live on mainnet before the later replay window |
| `2025-10-10 06:15` | Discord report | mataleone -> nas | fresh sepolia `delete+create` on `v1.8.1` | first public report: `Config.realms_address` missing while `Player.referrer_address` is fine |
| `2025-10-14 14:03:08 UTC` | local torii log | thread repro | sepolia config with `world_block = 23920`, default chunking | `UpgradeEvent(PlayerActivityEvent)` then `UpgradeModel(Config)` immediately followed by `PrimitiveError(InvalidEnumSelector { actual_selector: 18 })` |
| `2025-10-15 17:20:37 -03:00` | Pistols code | `bc5ad295` | sepolia `2560000` already includes variant `18` | adds `PlayerActivityEvent` variants `19` and `20` to the queue/activity rollout; `18` was already live |
| `2025-10-15 15:13:41 -03:00` | Pistols deploy | `9cf55b97` (`migrate sepolia`) | sepolia `2560000` | replay anchor at the start of the queue/activity rollout |
| `2025-10-16 18:11:18 -03:00` | Pistols deploy | `beec5840` (`migrate mainnet`) | mainnet between `3000000` and `3050000` | replay anchor for mainnet rollout start |
| `2025-10-16 22:47:20 UTC` | chain check | sepolia `2568610` | `EventUpgraded`: `0x022c1242… -> 0x0130d4f2…` | direct proof the later sepolia `PlayerActivityEvent` upgrade was also emitted on chain |
| `2025-10-17 12:28:31 -03:00` | Pistols code | `59c9e266` | mainnet `3050000` | `DuelistAssignment.season_id` added |
| `2025-10-17 16:18:44 UTC` | chain check | mainnet `3050000` | event resource `0x05be8170…`, variants `0..20` | later mainnet resource version adds `19/20`; cannot explain exact `18` by itself |
| `2025-10-20 11:29:39 -03:00` | Pistols code | `6dc79473` | mainnet `3100000` | `Duelist.released_fame` added |
| `2025-10-20 16:30:17 -03:00` | Pistols code | `028e2893` | mainnet `3100000` | `MatchQueue.enlisted_duelist_ids` indexing added |
| `2025-10-20 18:31:51 -03:00` | Pistols code | `720655ce` | mainnet `3100000` | `PlayerActivityEvent` variant `21` added |
| `2025-10-22` | torii | `v1.8.7` / `21031a24` | n/a | user still reproduces poisoned cold indexes here |
| `2025-10-22 14:27:30 -03:00` | Pistols deploy | `d0c79771` (`migrate sepolia`) | sepolia `2640000` | sepolia replay anchor inside the poisoned-model rollout |
| `2025-10-22 14:50:20 -03:00` | Pistols deploy | `871b572f` (`migrate mainnet`) | mainnet `3150000` | mainnet replay anchor inside the poisoned-model rollout |
| `2025-10-23 01:14:32 UTC` | chain check | mainnet `3033226` | `EventUpgraded`: `0x05d875a0… -> 0x05be8170…` | direct proof the later mainnet `PlayerActivityEvent` upgrade was also emitted on chain |
| `2025-10-28 10:43` | Discord report | mataleone | fresh `v1.8.7` sepolia recreate | repeated `table pistols-Config has no column named realms_address` on Slot and local |
| `2025-10-28 16:52:32 UTC` | user log | mata executor errors | sepolia `2710000`, mainnet `3210000` are nearby replay anchors | first concrete multi-column poisoned-DB log captured in this investigation |
| `2025-10-28 11:24:32 UTC` | mainnet torii log | recreated `pistols-mainnet` on `v1.8.7` | mainnet cold replay | `ModelMemberNotFound("0x1583394a…")`, which resolves to `released_fame` |
| `2025-10-29 03:56` | Discord report | mataleone | recreated `pistols-mainnet` on `v1.8.2` | even `1.8.2` cold mainnet recreate lacks `season_id`, `released_fame`, `enlisted_duelist_ids` |
| `2025-10-29 03:49:19 UTC` | chain check | sepolia `2710000` | event resource `0x04bdb668…`, variants `0..21` | later sepolia resource version adds `21`; again, not an explanation for exact `18` |
| `2026-02-17` | torii | `v1.8.15` / `2193fc5d` | Dojo pin `0afeb1bc` | local HEAD checked during this research; bug still present |
| `2026-04-30` | local repro | unpatched torii `1.8.7` + repro config | sepolia head `2344836` after replaying past critical window | stale schema reproduced locally |
| `2026-04-30 09:12:46 UTC` | local repro | patched torii with instrumentation | sepolia replay window around `2270724` | exact failing event captured |
| `2026-04-30` | local torii patch | dependency-merge + storage-backed rollback recovery | n/a | local fix implemented |
| `2026-05-01` | local confirmation | patched torii replay from pre-critical head `2262908` | heads `2273149`, `2283390`, `2293631` | replay crosses the exact trigger window cleanly |

## Appendix D: Ruled-out theories and dead ends

### 1. "`actual_selector: 18` means torii needs a new `Primitive` variant"

Ruled out.

- pinned `dojo-types` `Primitive` only accepts selectors `0..=15`
- `18` was not a missing low-level primitive variant
- it was a higher-level enum decode failure surfacing through `PrimitiveError`

### 2. "Pistols never published `PlayerActivityEvent` variant `18`"

Ruled out.

- chain history shows `EventUpgraded(PlayerActivityEvent)` at Sepolia block `2270724`
- the captured failing event is later, at block `2271871`
- by the time of the failure, the `18`-capable schema was already live on chain

### 3. "Torii just saw the later event before the earlier upgrade"

Ruled out in the simple sense.

- chain ordering is correct
- the bug is not raw provider order
- the bug is that the later event was appended to an already-existing task that never acquired the upgrade dependency

### 4. "`GenesisKey::Groggus = 18` is the real culprit"

Demoted to historical context only.

- `GenesisKey::Groggus` really is `18`
- before the exact failing payload was captured, it was a plausible model-side `18` candidate
- after the exact replay proof, it is no longer the explanation for the reproduced bug path
- it remains only a narrow fallback for some unrelated future stale-model investigation

### 5. "`Trophy::TricksterDeath = 18` from `TrophyProgression` is the culprit"

Retired.

- it is a real enum-at-18
- it is not the path captured in the failing replay

### 6. "`v1.8.1` / PR `#356` introduced the bug"

Ruled out.

- the rollback/cache hazard predates the standalone torii repo split
- the relevant pieces already existed in the old monorepo on `2024-11-14`
- `v1.8.1` made the Pistols cold-reindex failure visible, but it did not create the underlying bug

## Appendix E: Additional hardening ideas

These are still worth considering, but they are **not** required to explain or fix the proven Pistols failure path.

### 1. Version historical event schemas by resource contract or class hash

Potential hardening:

- key event schemas by `(world, selector, contract_address)` or `(world, selector, class_hash)`
- resolve historical event schema by emitting resource version, not selector alone

Useful for broader non-additive historical schema safety, but not required for the confirmed bug path.

### 2. Self-heal on enum mismatch

Potential hardening:

- on `InvalidEnumSelector`, refetch schema for that selector
- if schema differs, update local schema state and retry once

Useful as a guardrail, but it does not replace the task/dependency fix.

### 3. `strict_model_reader = true`

Potential diagnostic or hardening lever:

- force model/event schema reads at the replay block rather than latest provider state

Worth testing independently, but it is not the primary cause of the confirmed Pistols bug.

### 4. Defer cache writes until after `storage.execute()`

Stronger design invariant:

- stage cache changes per chunk
- only publish them after SQL commit

This would eliminate the rollback/cache divergence class more fundamentally, but it is a broader change than the confirmed local fix.

### 5. Not recommended: generic "ignore unknown enum selector"

Do **not** do this.

For payload-bearing variants, torii then no longer knows how many felts to consume, which can desynchronize the decode stream and create silent corruption.

## Appendix F: File pointers

Core torii paths involved in the confirmed bug:

- rollback site: `crates/indexer/engine/src/engine.rs`
- task manager: `crates/processors/src/task_manager.rs`
- task graph: `crates/task-network/src/lib.rs`
- event replay processor: `crates/processors/src/processors/event_message.rs`
- model upgrade processor: `crates/processors/src/processors/upgrade_model.rs`
- event upgrade processor: `crates/processors/src/processors/upgrade_event.rs`
- model cache: `crates/cache/src/lib.rs`
- SQLite storage / register model path: `crates/sqlite/sqlite/src/storage.rs`
- SQLite schema flattener: `crates/sqlite/sqlite/src/lib.rs`
- SQLite row -> type mapping: `crates/sqlite/sqlite/src/model.rs`

Paths changed in the confirmed local patch:

- `crates/processors/src/task_manager.rs`
- `crates/task-network/src/lib.rs`
- `crates/indexer/engine/src/engine.rs`
- `crates/processors/src/processors/event_message.rs`
- `crates/processors/src/processors/store_set_record.rs`
- `crates/processors/src/processors/store_update_record.rs`
- `crates/processors/src/processors/store_update_member.rs`
- `crates/processors/src/processors/store_del_record.rs`
- `crates/processors/src/processors/upgrade_model.rs`
- `crates/processors/src/processors/upgrade_event.rs`
