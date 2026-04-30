---
title: "Torii skipped-model-upgrade bug"
kind: research
date: 2026-05-01
informs: [00, 04]
---

# Torii skipped-model-upgrade bug — investigation

## TL;DR

Torii's indexer keeps an in-memory `ModelCache` in sync with the model schema, but **does not clear that cache when a chunk-level rollback occurs**. When an `InvalidEnumSelector` (or any other) error fires inside the same chunk as a `ModelUpgraded` event, the SQL transaction is rolled back (so `ALTER TABLE … ADD COLUMN` is discarded) while `ModelCache::register_model` remains updated to the new schema. On retry, `UpgradeModelProcessor` reads `prev_schema` from the (now-poisoned) cache, computes `new_schema.diff(prev_schema) == None`, and silently returns without re-issuing the `ALTER TABLE`. That is the clean code-level explanation for the **reported poisoned-DB state** where torii's schema metadata knows about a field but SQLite does not.

The structural hazard is **older than the standalone torii repo**: it effectively dates to **Nov 14 2024** in the `dojoengine/dojo` monorepo (see "Origin of the hazard" below) and has been present in every tagged torii release since **v1.5.0 (2025-04-29)** — including HEAD (v1.8.15) at time of writing. The parser failure that exposes it is now identified as well. Checking torii's pinned `dojo-types` source shows `Primitive` only accepts numeric selectors `0..=15`, so `actual_selector: 18` is **not** a real `Primitive` discriminant; it is a higher-level enum decode failure surfacing through `PrimitiveError`. Direct historical chain reads and the instrumented local replay prove the captured failing payload is the `pistols-matchmaker` `PlayerActivityEvent` at **Sepolia block `2271871`**, with `activity = 18`, and that this occurs **after** the `PlayerActivityEvent` schema upgrade at block `2270724`. The decisive local replay result is now in: historical `PlayerActivityEvent` work is grouped by `(world, selector, player)`, the same player already has multiple pre-upgrade activity events earlier in the same chunk, and later post-upgrade events were being appended to that existing task **without gaining the selector-upgrade dependency**. Once torii was patched to merge dependencies into existing historical event tasks, retain late prerequisite links, and reload model definitions from committed storage after rollback, the replay crossed block `2271871` cleanly, stored `PlayerActivityEvent` rows from `pistols-matchmaker` without `InvalidEnumSelector`, landed `Config.realms_address`, and upgraded `PlayerActivityEvent` to include `EnlistedRankedDuelist`. The older `GenesisKey::Groggus = 18` model path remains in this document as historical context only; it is not the confirmed explanation for the shared replay failure. As long as Pistols was being indexed continuously by older mainnet torii instances, the rolled-back-then-retry codepath never executed for the relevant upgrade chunks, so the latent cache-poison stayed invisible. Re-indexing cold under torii ≥ 1.8.1 hits the deserialize failure, exposes the latent bug, and drops the column.

The bug is still present on `main` (v1.8.15) as of writing. PR [#356](https://github.com/dojoengine/torii/pull/356) (v1.8.1, `refactor(processors): model upgrades to use cache`) is *not* the culprit — it just made the cache dependency direct; `Sql::model()` had been cache-first since PR #353 in v1.8.0 and v1.7.5's `UpgradeModelProcessor` was already reading from `ctx.cache.model(...)`.

## Pistols world addresses

Both networks share the same world address (the same Cairo class is deployed on both).

| Network | World address |
|---|---|
| **mainnet** | `0x8b4838140a3cbd36ebe64d4b5aaf56a30cc3753c928a79338bf56c53f506c5` |
| **sepolia** | `0x8b4838140a3cbd36ebe64d4b5aaf56a30cc3753c928a79338bf56c53f506c5` |

(Verified in `manifest_mainnet.json` and `manifest_sepolia.json` at the repo root — `world.address` field.)

## The reported symptom

From mataleone's reports (Oct 10 → Dec 19):

- `pistols-Config.realms_address` was added to the Cairo model on mainnet via a `ModelUpgraded`. The migration ran successfully — `world.upgrade_model` is on chain, and torii logs `Upgraded model. namespace=pistols name=Config`.
- The schema returned by torii's RPC (`/schema`) **does** include `realms_address`.
- But the SQLite table `pistols-Config` **does not** have a column for `realms_address`.
- gRPC `useSdkEntitiesGet` fails with: `no such column: pistols-Config.realms_address`.
- `INSERT/UPDATE` from `StoreUpdateMember` events fail in the executor:
  `Failed to execute query. … "table pistols-Config has no column named realms_address"`.
- Reproduces on a fresh delete+create of the Slot Sepolia indexer on torii ≥ 1.8.1 (still failing on 1.8.7). Older continuously indexed mainnet instances did not surface it initially, but cold-indexed mainnet recreates later showed the same failure class.
- `blocks_chunk_size = 10240` triggers it; **lowering to `1024` works around it** locally. This matters because `10240` is torii's own default (`crates/indexer/fetcher/src/lib.rs`, `crates/cli/src/options.rs`), so the bad case is not an unusual custom configuration.
- A telltale log line appears immediately after the offending upgrade:
  ```
  INFO upgrade_model: Upgraded model. namespace=pistols name=Config
  ERROR engine: Processing fetched data. error=Processors(TaskNetworkError(TaskError(
      PrimitiveError(InvalidEnumSelector { actual_selector: 18 }))))
  ```
  i.e. *something else in the same chunk* fails to deserialize, the chunk is rolled back, and the column never lands.
- A later log capture from **2025-10-28** shows the same failure pattern on three more fields introduced during the same ranked-queue / FAME rollout window:
  - `pistols-DuelistAssignment.season_id`
  - `pistols-Duelist.released_fame`
  - `pistols-MatchQueue.enlisted_duelist_ids`
  This clusters the poisoned upgrades around the Oct 15-22 2025 matchmaker changes rather than a one-off `Config` migration issue.
- A later **mainnet** recreate on torii `1.8.7` did not just miss columns; it entered an error loop with `ModelMemberNotFound("0x1583394ac5a692ac2860830bae36b55101ec515479ae3ada3135bdd13f021e1")`. Resolving that selector gives `released_fame`, so even the later mainnet failure loop points back to the same Oct 17-20 rollout wave rather than a separate unrelated schema issue.
- The first public Sepolia report is even earlier: **2025-10-10 06:15**. mataleone reported that a fresh torii **v1.8.1** `delete+create` indexer already had `pistols-Config.realms_address` missing, while another recently-added field, `pistols-Player.referrer_address`, was indexing correctly. That is important evidence:
  - it shows the cold-reindex failure was present from the start of the v1.8.1 Sepolia rollout, not only after later December rebuilds
  - it shows **not every recent upgrade was poisoned**
  - it fits a chunk-local failure much better than a global "torii 1.8.1 cannot apply upgrades correctly" theory
- A local repro from **2025-10-14** already showed the event/model pairing clearly. With the Sepolia config from the thread, torii logged:
  ```text
  INFO  torii::indexer::processors::upgrade_event: Upgraded event. namespace=pistols name=PlayerActivityEvent
  INFO  torii::indexer::processors::upgrade_model: Upgraded model. namespace=pistols name=Config
  ERROR torii::indexer::engine: Processing fetched data. error=Processors(TaskNetworkError(TaskError(PrimitiveError(InvalidEnumSelector { actual_selector: 18 }))))
  ```
  i.e. the first clearly reported cold-replay failure is not just "near" the `PlayerActivityEvent` upgrade; it happens immediately after torii says it upgraded `PlayerActivityEvent` and `Config` in the same pass.
- An earlier Oct 9 local log from the same thread also showed repeated SQLite errors `CHECK constraint failed: activity_check` after the `PrimitiveError`. In Pistols code, the relevant stored event model with an `activity` enum column is `pistols-PlayerActivityEvent`, and `activity = 18` is exactly `Activity::EnlistedRankedDuelist`. That makes the failing event family effectively identified even though the deserializer error itself only reports `actual_selector: 18`.
- A later capture from **2025-12-19 / 2025-12-20** confirms the poisoned state can persist while torii still advances:
  - executor writes fail with
    - `table pistols-DuelistAssignment has no column named season_id`
    - `table pistols-MatchQueue has no column named enlisted_duelist_ids`
  - query/read paths fail with
    - `no such column: pistols-Pack.pegged_lords_amount`
    - `no such column: pistols-Duelist.released_fame`
  - Luca noted that the indexer still appeared to be indexing rather than crashing
  This is consistent with torii's executor design: most entity/model writes are queued fire-and-forget, so row-level SQL failures are logged by the executor without necessarily aborting the main indexing loop.

By Dec 20 the same class of error had spread to `pistols-DuelistAssignment.season_id`, `pistols-MatchQueue.enlisted_duelist_ids`, `pistols-Duelist.released_fame`, `pistols-Pack.pegged_lords_amount`, etc. — anything added by a `ModelUpgraded` whose chunk also contained a failing event. glihm summarised it as "Torii somehow skips some upgrade of the schema of the model. which causes future inserts to not work due to the column not being added properly."

## Root cause walk-through

References below are to the local checkout at `~/Development/torii` (HEAD = v1.8.15).

### 1. `UpgradeModelProcessor` reads `prev_schema` from cache

`crates/processors/src/processors/upgrade_model.rs:63-78`:

```rust
let model = match ctx.cache.model(ctx.contract_address, event.selector).await {
    Ok(m) => m,
    Err(CacheError::ModelNotFound(_)) if !ctx.config.namespaces.is_empty() => return Ok(()),
    Err(e) => return Err(e.into()),
};
…
let prev_schema = model.schema;
```

Then it fetches `new_schema` from chain (at the **latest** block by default — `strict_model_reader` is `false` in `crates/processors/src/lib.rs:60` and `crates/cli/src/options.rs:294`):

```rust
let mut new_schema = model.schema().await?;
…
let schema_diff = new_schema.diff(&prev_schema);
if schema_diff.is_none() {
    return Ok(());        // <-- early-return; no ALTER TABLE issued
}
```

Whether or not an `ALTER TABLE` is emitted depends entirely on `prev_schema`, which comes from `ModelCache`.

### 2. Storage and cache are written in the same task, but commit at different times

`crates/processors/src/processors/upgrade_model.rs:143-180`:

```rust
ctx.storage.register_model(…, Some(&schema_diff), prev_schema.diff(&new_schema).as_ref(), …).await?;
ctx.cache.register_model(ctx.contract_address, event.selector, Model { … schema: new_schema, … }).await;
```

- `ctx.storage.register_model` enqueues `INSERT INTO models …` and `ALTER TABLE [pistols-Config] ADD COLUMN [realms_address] …` on the executor's mpsc channel (`crates/sqlite/sqlite/src/storage.rs:1726-1815` → `crates/sqlite/sqlite/src/lib.rs:259-413`).
- These queries run inside a single sqlx transaction held by the executor (`crates/sqlite/sqlite/src/executor/mod.rs:186,291,298`). The transaction is **only committed at the end of a chunk** via `self.storage.execute().await` (`crates/indexer/engine/src/engine.rs:228`).
- `ctx.cache.register_model` writes to the in-memory `RwLock<HashMap<…>>` immediately and is not transactional (`crates/cache/src/lib.rs:227-233`).

### 3. Chunk-level rollback drops the SQL but **not** the cache

`crates/indexer/engine/src/engine.rs:212-243` (the bug):

```rust
match self.process(&fetch_result, &contracts).await {
    Ok(_) => { … self.storage.execute().await?; }
    Err(e) => {
        …
        self.storage.rollback().await?;     // drops the in-flight sqlx transaction
        self.task_manager.clear_tasks();    // discards pending parallel tasks
        // <-- nothing clears self.cache.model_cache !
    }
}
```

`self.storage.rollback()` calls `transaction.rollback()` on the executor (`crates/sqlite/sqlite/src/executor/mod.rs:1302-1312`), so the queued `ALTER TABLE` is gone. But every `cache.register_model` that ran during the failed pass has already mutated the shared `ModelCache` and stays mutated.

### 4. Retry sees a "consistent" cache and skips the upgrade

When the engine retries the same chunk:

1. `RegisterModelProcessor`/`UpgradeModelProcessor` for `pistols-Config` runs again.
2. `ctx.cache.model(...)` returns the **post-upgrade** schema (with `realms_address`) — set during the previous, rolled-back attempt.
3. `model.schema().await?` returns the same on-chain latest schema (with `realms_address`).
4. `new_schema.diff(&prev_schema)` is `None` → early `return Ok(())`. **No `ALTER TABLE` is issued.**
5. Cursors advance. The chunk "succeeds" with a phantom upgrade.

Later, when entity events arrive (`StoreUpdateMember` with `member=realms_address`), the executor tries `UPDATE [pistols-Config] SET [realms_address] = ?` and fails with `no such column`. The `models.schema` JSON column shows `realms_address` (because `register_model`'s `INSERT … ON CONFLICT DO UPDATE` did run on the second pass), confirming the user's observation that **the schema knows about the column but the table doesn't**.

This also matches nas's debugging note in the thread:

> "mh so it seems like the cache has been updated but not the db / oh ok seems like thats why the DB migration hasnt been applied"

## Why `blocks_chunk_size` matters

The blast radius is a single chunk. With `blocks_chunk_size = 10240`, the failing event (`PlayerActivityEvent.activity = 18` at block `2271871`) falls in the same chunk as the `Config` upgrade, so every retry of that chunk hits the cache-poison path and the column never lands.

With `blocks_chunk_size = 1024` the upgrade event and the failing event end up in different chunks roughly 9× out of 10. The upgrade chunk commits cleanly on its first attempt (cache and DB stay aligned); the *failing* chunk just keeps retrying forever (or skipping forward, depending on backoff config) but it no longer corrupts the schema of unrelated models.

This is a workaround, not a fix — the underlying cache-poisoning is still latent and any future error inside an upgrade chunk will reproduce it.

## Why it may keep indexing anyway

The missing-column state does **not** necessarily crash torii once the DB is poisoned.

Two code-level details explain Luca's Dec 19-20 observation that the indexer was still moving:

1. `set_entity` / `set_event_message` enqueue most row writes with `QueryMessage::new(...)` and return immediately; they do **not** await a per-query response from the executor (`crates/sqlite/sqlite/src/storage.rs`).
2. The executor logs row-level SQL failures in `Executor::run()` (`Failed to execute query.`), but only chunk-level `Execute` / `Rollback` use `oneshot` responses that flow back to the engine (`crates/sqlite/sqlite/src/executor/mod.rs`).

That means a poisoned table can keep producing write-side errors like:

- `table pistols-DuelistAssignment has no column named season_id`
- `table pistols-MatchQueue has no column named enlisted_duelist_ids`

and read-side errors like:

- `no such column: pistols-Pack.pegged_lords_amount`
- `no such column: pistols-Duelist.released_fame`

while the main indexing loop continues to process later chunks. The result is worse than a clean crash: torii can look "alive" enough to keep advancing cursors while silently dropping writes and serving broken reads for whichever models were poisoned.

## When the bug was introduced / made visible

### Origin of the hazard

The cache-poison-on-rollback condition requires three pieces of code to coexist:

1. `UpgradeModelProcessor` reading `prev_schema` from a cache.
2. `register_model` mutating that cache *synchronously* during processing (before SQL commit).
3. The engine's chunk-error handler calling `storage.rollback()` without invalidating that cache.

Tracing each piece in git history:

- **(1) and (2)** were introduced together when model upgrades shipped: commit [`45a0a650`](https://github.com/dojoengine/dojo/pull/2637) — `feat(torii): model upgrades (#2637)`, **Nov 14 2024**, dojoengine/dojo monorepo (under `crates/torii/core/...`). The synchronous cache write was deliberate and the comment in `crates/torii/core/src/sql/mod.rs:301-303` at that commit makes the intent explicit:

  > `// we set the model in the cache directly`
  > `// because entities might be using it before the query queue is processed`

  i.e. downstream entity processors (`StoreSetRecord`, `StoreUpdateMember`, …) need the new schema visible *before* `db.execute()` commits the queued SQL, otherwise inserts in the same chunk would see the old schema. The hazard is the price of satisfying that requirement without rollback-aware cache state.

- **(3)** came from commit [`32196a67`](https://github.com/dojoengine/dojo) — `fix(torii/core): rollback transaction when engine retries`, also in dojoengine/dojo. It was **authored Nov 4 2024 and committed Nov 14 2024**; by the time model upgrades landed later that day, rollback-without-cache-invalidation was already in tree. The diff is two lines added to the engine's `Err` arm:

  ```rust
  // incase of error rollback the transaction
  self.db.rollback().await?;
  ```

  No corresponding cache invalidation was added.

Before `32196a67` landed on Nov 14 2024 there was no DB rollback path — on a chunk error the engine simply slept, applied backoff, and retried — so there was no DB rollback for the cache to diverge from.

**The latent hazard has therefore existed since Nov 14 2024**, when piece (1)/(2) joined the already-present rollback path. Both founding commits predate the dojoengine/torii repo split and shipped to consumers under dojo-monorepo tags first.

### Earliest tagged release containing the hazard

In the standalone `dojoengine/torii` repository, the earliest tag containing both founding commits is **v1.5.0 (2025-04-29)**, the first standalone torii release. Every torii release since has carried it.

| Tag | Date | Hazard present? |
|---|---|---|
| **v1.5.0** | **2025-04-29** | yes — first standalone torii tag |
| v1.7.3 | 2025-09-30 | yes |
| v1.7.5 | 2025-10-06 | yes |
| v1.8.0 | 2025-10-08 | yes |
| **v1.8.1** | **2025-10-09** | yes — first to bite Pistols |
| v1.8.2 | 2025-10-09 | yes |
| … | … | yes |
| v1.8.7 | 2025-10-22 | yes |
| v1.8.15 | 2026-02-17 | yes (HEAD) |

Verified directly against v1.7.5 source: `engine.rs` rollback path (`storage.rollback() + clear_tasks()`, no model-cache invalidation) is byte-identical to HEAD; `UpgradeModelProcessor` already reads `prev_schema` via `ctx.cache.model(event.selector).await`; `Sql::model()` already does cache-first-then-DB. None of the v1.8 refactors changed any of this materially.

### What actually changed in v1.8: the trigger, not the hazard

I initially suspected PR [#356](https://github.com/dojoengine/torii/pull/356) introduced the bug. Verifying against v1.7.5 disproves that — see above. The two often-cited recent commits were both behaviour-preserving refactors:

- [`04a7733b`](https://github.com/dojoengine/torii/pull/353) — `refactor(processors): try retrieve model from storage that uses cache (#353)`. Made `Sql::model()` consult `ModelCache` first and only fall back to SQLite on a miss (`crates/sqlite/sqlite/src/storage.rs:56-83`). **Shipped in v1.8.0** (2025-10-08). No-op vs. v1.7.5, which already did this.
- [`e74d8fc3`](https://github.com/dojoengine/torii/pull/356) — `refactor(processors): model upgrades to use cache (#356)`. Replaced `ctx.storage.model(...)` with `ctx.cache.model(...)` directly inside `UpgradeModelProcessor` and `UpgradeEventProcessor`. **Shipped in v1.8.1** (2025-10-09). No-op vs. v1.8.0 since `Sql::model()` was already cache-first.

What changed in v1.8.x is best understood as **cold replay exposing an existing schema mismatch**, not as v1.8 introducing the rollback hazard. Between torii **v1.8.0** and **v1.8.1**, the project did two things at once:

- merged PR [#356](https://github.com/dojoengine/torii/pull/356), which was the visible cache refactor discussed above
- changed the pinned Dojo dependency set from `6daa3d0` to `711cb72`, with two schema/deserializer-related commits in between:
  - `9115e319` — `fix(schema): unchecked bytearray deser`
  - `de4b29e8` — `chore(dojo): rev with bytearray lossy`

That matters because the pinned `dojo_types::primitive::Primitive` source is effectively unchanged across the inspected Dojo revs (`6daa3d0`, `711cb72`, and current HEAD pin `0afeb1bc`): it still defines only **16 numeric selectors (`0..=15`)**. So `PrimitiveError::InvalidEnumSelector { actual_selector: 18 }` does **not** mean "torii tried to decode a real `Primitive` variant 18". It means a higher-level enum decode path failed on value `18` and surfaced the error through `PrimitiveError`.

The first code-only reading was:

- the failing value mapped cleanly to `PlayerActivityEvent.activity = EnlistedRankedDuelist (18)`
- the schema torii used for that event therefore looked like it lacked option index `18`
- on a fresh DB, that made a pure torii cache-ordering explanation look weaker, because `RegisterEventProcessor` fetches chain schema directly and `EventMessageProcessor` declares a same-selector dependency on the register/upgrade task

That was a reasonable first pass, but the later local replay and task-graph inspection change the conclusion materially: the dependency declaration exists, but it is not robust once historical events for the same `(world, selector, player)` have already created the task earlier in the chunk.

Why it only bit Pistols on the v1.8.x line:

- Mainnet was being indexed *continuously* by torii ≤ 1.8.0. No chunk-level processing error ever landed inside the chunk containing the `Config` `ModelUpgraded` event, so the rollback-then-retry path simply never ran for that chunk. The latent cache-poison stayed invisible.
- Sepolia (and any cold re-index under torii ≥ 1.8.1) replays the world from genesis. When torii reaches the historical payload that later surfaces as `InvalidEnumSelector { actual_selector: 18 }`, decode fails, and that error falls in the same chunk as the `Config` upgrade. Rollback fires, cache stays poisoned, retry skips the upgrade.

mataleone's report — "I wasn't seeing this problem in the 1.8.0 mainnet deployment, just sepolia [on 1.8.1]" — fits this exactly: mainnet's continuous index never tripped the trigger; the cold sepolia re-index did.

### Historical on-chain verification

I checked the chain directly by calling the Pistols world's `resource(selector)` entrypoint for `pistols-PlayerActivityEvent` (`0x46a192c105a4598953e7aeaf3809703964eb9e6d65403156d0458dcd2ee379b`), then calling `schema()` on the resolved event resource contract at specific historical blocks.

The exact replayable command pattern is:

```bash
starkli call <world> resource <player_activity_selector> --rpc <network_rpc> --block <block_number>
starkli call <resolved_event_resource> schema --rpc <network_rpc> --block <block_number>
```

The useful historical results are:

| Network | Block | UTC time | Result |
|---|---:|---|---|
| sepolia | `2270000` | `2025-09-27 23:06:55` | old event resource `0x0280394e…`, `Activity` enum length `0x12` (18 options), **no** `EnlistedRankedDuelist` |
| sepolia | `2272000` | `2025-09-28 01:58:05` | new event resource `0x022c1242…`, `Activity` enum length `0x13` (19 options), `EnlistedRankedDuelist` **present** |
| sepolia | `2560000` | `2025-10-15 05:32:18` | same `0x022c1242…` resource still exposes only variants `0..18` |
| sepolia | `2710000` | `2025-10-29 03:49:19` | new resource `0x04bdb668…`, `Activity` enum length `0x16` (22 options), variants `0..21` present |
| mainnet | `2000000` | `2025-09-04 14:40:58` | old event resource `0x05fbad80…` |
| mainnet | `2500000` | `2025-09-28 05:50:51` | same old resource `0x05fbad80…` still active |
| mainnet | `2600000` | `2025-10-01 22:19:21` | new resource `0x05d875a0…` already active |
| mainnet | `2831000` | `2025-10-09 13:25:29` | event resource `0x05d875a0…`, `Activity` enum length `0x13`, `EnlistedRankedDuelist` **present** |
| mainnet | `2834000` | `2025-10-09 14:36:18` | same `0x05d875a0…` resource, still only variants `0..18` |
| mainnet | `3050000` | `2025-10-17 16:18:44` | new resource `0x05be8170…`, `Activity` enum length `0x15` (21 options), variants `0..20` present |
| mainnet | `3210000` | `2025-10-27 13:58:44` | same `0x05be8170…` resource, still variants `0..20` |

This matters a lot:

- on **sepolia**, variant `18` was already on chain by block `2272000`, more than two weeks before the Oct 15 queue/activity rollout
- on **mainnet**, variant `18` was already on chain by block `2831000`, well before the Oct 15-28 replay window that matters for the poisoned model upgrades
- on **both networks**, the later rollout-era resource transitions add `19`, `20`, and `21`, but they never make `18` invalid again

So the simple thesis "`PlayerActivityEvent.activity = 18` is failing because the world never exposed variant 18" is **false** for the actual replay window under discussion.

One more detail from the Oct 10 Discord report now lines up extremely well with the chain history:

- on sepolia, `pistols-Player` only shows a `ModelUpgraded` at block **`2202995`**
- on sepolia, `pistols-Config` shows a later `ModelUpgraded` at block **`2270724`**
- that same block **`2270724`** is also where `pistols-PlayerActivityEvent` upgrades from the pre-18 resource to the first resource that includes `Activity::EnlistedRankedDuelist = 18`

Those two model-upgrade blocks are about **67,729 blocks apart**, so they cannot share a single default `10240` replay chunk. That directly explains mataleone's Oct 10 observation that:

- `pistols-Config.realms_address` was missing on a fresh `v1.8.1` Sepolia delete+create
- `pistols-Player.referrer_address` was fine

This is strong evidence for the chunk-local theory. Something about the replay around block `2270724` poisoned the `Config` upgrade path specifically; the earlier `Player` upgrade sat in a different replay chunk and committed cleanly.

It also matches torii's default chunking mechanically. With the actual Sepolia config from the thread (`world_block = 23920`) and `blocks_chunk_size = 10240`, block `2270724` falls in the replay window **`2266480 .. 2276720`**. The first directly observed sepolia `PlayerActivityEvent.activity = 18` payloads we found during this investigation are at blocks **`2271871`** and **`2272012`**, which are inside that same default chunk. That is exactly the shape needed to:

1. process `ModelUpgraded(Config)` and mutate cache
2. later hit the `actual_selector: 18` deserialize failure in the same chunk
3. roll back SQL but keep the upgraded cache
4. retry and skip the `ALTER TABLE`

### Current world deployment window

I also checked when the **current** Pistols world address first appears on chain, because that determines whether older enum candidates like `GenesisKey::Groggus = 18` can even be part of this world's historical schema.

Using the same `world.resource(selector)` call against `pistols-PlayerActivityEvent`:

| Network | Block | UTC time | Result |
|---|---:|---|---|
| mainnet | `1375000` | `2025-05-05 12:56:03` | `ContractNotFound` |
| mainnet | `1500000` | `2025-06-18 04:29:30` | world exists |
| sepolia | `740000` | `2025-05-02 10:48:58` | `ContractNotFound` |
| sepolia | `750000` | `2025-05-06 19:48:47` | world exists |

This changes the fallback ranking materially:

- on **mainnet**, the current world address definitely postdates the `2025-05-04` `GenesisKey::Groggus = 18` source change, so a **pre-Groggus** model schema on this world is not a serious mainnet explanation
- on **sepolia**, the deployment window only narrowly overlaps the `Groggus` commit window, so it remains theoretically possible there but is no longer a strong **cross-network** trigger
- by contrast, `PlayerActivityEvent.activity = 18` is a **post-deployment** enum addition on both networks, which is exactly what we would expect for a replay that later trips on `actual_selector: 18`

What the chain data does show is that the same selector moved across **different event resource contracts** over time on both networks, and that the old contracts stay deployed with their old schema. That is relevant because torii does **not** version event schemas by resource contract:

- `ModelCache` is keyed only by `(world_address, selector)` (`crates/cache/src/lib.rs`)
- `storage.register_model` upserts `models.id = world_address:model_selector` (`crates/sqlite/sqlite/src/storage.rs:1726-1788`)
- `EventMessageProcessor` looks up the schema with `ctx.cache.model(ctx.contract_address, event.selector)` and ignores the emitting event resource `contract_address` (`crates/processors/src/processors/event_message.rs`)
- `RegisterEventProcessor` and `UpgradeEventProcessor` do fetch the schema from the **concrete** `event.address` and `event.class_hash` carried by the world event, via `ModelRPCReader::new(...)` (`crates/processors/src/processors/register_event.rs`, `upgrade_event.rs`)

That last point matters because it rules out a weaker theory: torii is **not** asking the world for "whatever schema currently owns this selector". The lossy step happens after the fetch, when torii stores and later reloads event schemas by selector alone. If the failing payload is `PlayerActivityEvent.activity = 18`, the exact failure is therefore not "torii saw the Oct 2025 schema transition and got confused by `19/20/21`". It is "torii somehow reached an `18` payload while its active schema slot for that selector was still **pre-Sep-27 pre-18**". If the failing payload is not `PlayerActivityEvent`, the remaining concrete fallback is a model/entity path carrying `GenesisKey::Groggus = 18`, but that is now substantially weaker than it was earlier in the investigation.

### Missing-column rollout map

The observed poisoned columns are not random. They line up with a tight Oct 17-20 2025 Pistols rollout window:

| Model field | First relevant Pistols commit seen locally | Commit date |
|---|---|---|
| `pistols-Pack.pegged_lords_amount` | `1a06ae57` — `implemented new purchase/pegging cycle` | 2025-10-17 |
| `pistols-DuelistAssignment.season_id` | `59c9e266` — `added DuelistAssignment.season_id` | 2025-10-17 |
| `pistols-Duelist.released_fame` | `6dc79473` — `Duelist.released_fame` | 2025-10-20 |
| `pistols-MatchQueue.enlisted_duelist_ids` | `028e2893` — `index enlisted duelists per queue` | 2025-10-20 |

That clustering fits the torii bug better than any model-specific theory. Multiple additive `ModelUpgraded` events landed close together, then a later deserialize failure inside the same large replay chunk poisoned whichever upgrades shared that chunk.

**Summary.** The hazard has been latent in *every* torii release since at least v1.5.0 (April 2025), originating from two dojoengine/dojo monorepo commits that were both in tree by **Nov 14 2024** (one authored earlier on Nov 4). The user-visible bug for Pistols first appeared in **cold re-indexes on the v1.8.x line** because replay hit a deserialize failure inside the same chunk as a model upgrade. The rollback/cache bug is definite. The trigger is now effectively nailed down too: torii was replaying a **later** `PlayerActivityEvent.activity = 18` payload while the active schema bound to that player's historical event task was still **pre-18**, because the task had been created by earlier same-player events and later post-upgrade events were appended without gaining the selector-upgrade dependency. A local torii patch that merges dependencies into existing historical event tasks, retains late prerequisite links in `TaskNetwork`, and rebuilds post-rollback model reads from committed storage has now replayed the Sepolia trigger window cleanly and landed the missing schema changes.

## Bug remediations

### 1. Immediate rollback fix: clear model cache on rollback, then repopulate from committed storage

`crates/indexer/engine/src/engine.rs:230-242`:

```rust
Err(e) => {
    …
    self.storage.rollback().await?;
    self.task_manager.clear_tasks();
    self.cache.clear_models().await;          // <-- new; or rebuild from storage.models()
    …
}
```

The `Cache` trait already exposes `clear_models` on the versions checked (including v1.7.5 and v1.8.15), so the first code change is just wiring that existing invalidation call into the rollback path. The later local replay work showed that the practical fix must also repopulate model definitions from committed storage on the next pass; a bare empty-cache retry turns the original poison bug into `CacheError(ModelNotFound(...))`.

This is the smallest code change and the right first thing to test, because it directly targets the skipped-upgrade / poisoned-schema bug described above and also covers the same rollback hazard for event schema upgrades in `register_event.rs` / `upgrade_event.rs`.

Status after the current local replay work:

- **confirmed as the right direction for the poisoned-DB / skipped-upgrade bug class**
- **confirmed as insufficient as a standalone hotfix**
- **confirmed to need a storage-backed recovery path rather than an empty-cache retry**

That distinction matters. The Oct / Dec 2025 reports clearly show the poisoned state this patch is designed to fix: schema metadata says the field exists, SQLite says it does not. The later local replay work now closes the loop:

- the unpatched local `v1.8.7` replay gets stuck in an earlier stale state where both `models.schema` and the table DDL remain old even after the replay passes the historical upgrade window
- the patched replay with bare `clear_models()` reaches the exact `PlayerActivityEvent.activity = 18` failure, then starts throwing `CacheError(ModelNotFound(...))` on subsequent replay work
- the replay only stabilizes once processors reload model definitions via committed storage after rollback instead of trusting an emptied cache

So `clear_models()` on rollback is still the right idea, but the practical fix is to **pair rollback-time cache clearing with storage-backed model reloads**.

### 2. Broader rollback hardening: rebuild all commit-sensitive cache state

The model cache is the bug Pistols is hitting, but it is not the only cache with the same shape. Torii also mutates token-registration cache before SQL commit:

- `try_register_token_contract` enqueues `storage.register_token_contract(...)` and then immediately calls `cache.mark_token_registered(...)` in `crates/processors/src/erc.rs`.
- `try_register_nft_token_metadata` does the same for NFT token rows, then also mutates balance-diff cache.

If a later error in the same chunk triggers `storage.rollback()`, the DB can lose those token rows while cache still thinks the token is registered, causing the retry to skip re-registration.

So the cleaner upstream remediation is not "clear models only", but "restore cache state to the last committed DB state on rollback". Concretely, that likely means one of:

- add a cache `reload_from_storage` / `reset_from_storage` path and call it from the engine rollback arm
- add explicit rollback invalidators for both model cache and token-registration cache, then lazily repopulate from storage on retry

The current patched replay makes the first option look stronger than it did earlier in the investigation. Emptying the model cache entirely after rollback appears to leave later processors without required model definitions, which turns the original poison bug into a different `CacheError(ModelNotFound)` failure mode.

### 3. Stronger invariant: defer cache writes until after `storage.execute()`

Buffer `cache.register_model` calls in a per-chunk staging area (e.g. a `Vec<(Felt, Felt, Model)>` on the engine) and flush them only after `self.storage.execute().await?` returns `Ok`. On rollback, drop the staging buffer.

This is a little more invasive than (A) but keeps the cache strictly in sync with committed SQL state, which is arguably the correct invariant. It also closes the (smaller) window where `set_entity` calls running concurrently in the same task can read a "future" schema from the cache.

### 4. Not recommended: bypass cache when reading `prev_schema`

Revert PR #356 so `UpgradeModelProcessor` reads `prev_schema` via `ctx.storage.model(...)`. This *alone* doesn't fix the bug because `Sql::model()` itself still preferentially returns from cache (since v1.8.0 / PR #353). To make this approach work you'd need to add a "skip cache" path for the upgrade processor specifically — i.e. read the `models` row directly from sqlx during an upgrade. Not recommended; (A) is cleaner.

## Reproducing and testing

You do **not** need a full Sepolia replay to prove the skipped-upgrade / poisoned-cache bug. This investigation did use one instrumented real replay to prove the exact `actual_selector: 18` trigger payload and then a patched replay to confirm the fix.

### 1. Deterministic regression test for the torii rollback bug

The clean test target is torii itself, not Pistols production history.

Recommended shape:

1. stand up a tiny local world on Katana with a model that can be upgraded additively
2. index a chunk containing:
   - a `ModelUpgraded` event that adds one column
   - a second event in the **same chunk** that deterministically fails during processing
3. assert that, on the first pass, torii:
   - enqueues `ALTER TABLE`
   - mutates `ModelCache`
   - then rolls the SQL transaction back when the second event fails
4. retry the same chunk and assert the pre-fix behaviour:
   - cache still says the model is upgraded
   - `new_schema.diff(prev_schema) == None`
   - no second `ALTER TABLE` is emitted
   - the table remains missing the added column
5. apply the rollback patch (`self.cache.clear_models().await`) and assert the retry now replays the upgrade and lands the column

This is easiest as a local integration test rather than a pure unit test because `UpgradeModelProcessor` fetches the latest schema from a provider.

### 2. One instrumented replay to identify the trigger

For the `InvalidEnumSelector { actual_selector: 18 }` bug, the highest-leverage next step is a temporary logging patch in:

- `crates/processors/src/processors/event_message.rs`
- `crates/processors/src/processors/store_set_record.rs`
- `crates/processors/src/processors/store_update_record.rs`
- `crates/processors/src/processors/store_update_member.rs`

Log:

- namespace / model / event name
- model selector and member selector
- raw event keys and values
- which processor path raised the error

That replay turned the trigger hypothesis into proof.

Current local status from this investigation:

- the local torii checkout has already been patched to call `self.cache.clear_models().await` on rollback in `crates/indexer/engine/src/engine.rs`
- temporary diagnostics have also been added in:
  - `crates/processors/src/processors/event_message.rs`
  - `crates/processors/src/processors/upgrade_event.rs`

So the next local repro does not need fresh instrumentation work; it mainly needs a clean run against the known bad Sepolia replay window.

### 3. Focused deserialization test once the payload is known

After the instrumented replay identifies the failing model/event and raw felts, write a smaller targeted test around the exact deserialize path:

- `EventMessageProcessor` if it is a historical event replay
- `StoreUpdateMemberProcessor` if it is a model member update
- or directly `entity.deserialize(...)` / `member.ty.deserialize(...)` if the bug is entirely inside schema decoding

That gives you a stable upstream regression test for the trigger bug without needing another full chain replay.

### 4. Concrete repro anchors from this session

These are the most useful breadcrumbs gathered in this session for anyone building a targeted repro:

- torii **v1.8.0** pins Dojo deps to `6daa3d0`
- torii **v1.8.1** pins Dojo deps to `711cb72`
- current torii HEAD in the local checkout pins Dojo deps to `0afeb1bc`
- `PlayerActivityEvent.activity` first gains variant `18` (`EnlistedRankedDuelist`) in `b9840a17` on **2025-09-27**; variants `19` and `20` land later in `bc5ad295` on **2025-10-15**
- `PlayerDuelistStack` lands in `64fb06ba` on **2025-04-25**
- `GenesisKey::Groggus = 18` lands in `28a3f8c9` on **2025-05-04**
- `Pack.pegged_lords_amount` lands in `1a06ae57` on **2025-10-17**
- `DuelistAssignment.season_id` lands in `59c9e266` on **2025-10-17**
- `Duelist.released_fame` lands in `6dc79473` on **2025-10-20**
- `MatchQueue.enlisted_duelist_ids` lands in `028e2893` on **2025-10-20**
- local `manifest_mainnet.json` and `manifest_sepolia.json` already include `EnlistedRankedDuelist` under `pistols-PlayerActivityEvent`, so the repo's compile-time schema is current
- useful historical schema-check blocks derived from the Pistols migration commits are:
  - **sepolia** `2270000` (`2025-09-27 23:06:55 UTC`) and `2272000` (`2025-09-28 01:58:05 UTC`) bracketing the actual on-chain transition from "no variant 18" to "variant 18 present"
  - **sepolia** `2560000` (`2025-10-15 05:32:18 UTC`) at the start of the queue/activity rollout; variant 18 is already present there
  - **sepolia** `2710000` (`2025-10-29 03:49:19 UTC`) where the schema has advanced to variants `0..21`
  - **mainnet** `2831000` (`2025-10-09 13:25:29 UTC`) and `2834000` (`2025-10-09 14:36:18 UTC`) showing variant 18 already live before the Oct 15-28 replay window
  - **mainnet** `3050000` (`2025-10-17 16:18:44 UTC`), `3100000` (`2025-10-20 15:02:32 UTC`), `3150000` (`2025-10-23 15:23:26 UTC`), and `3210000` (`2025-10-27 13:58:44 UTC`) bracketing the ranked-queue / poisoned-model rollout
  - **sepolia** `2640000` (`2025-10-22 13:38:06 UTC`) and `2710000` (`2025-10-29 03:49:19 UTC`) bracketing the same rollout on the network where cold replay first failed
- current and historical `pistols-PlayerActivityEvent` resource addresses observed during this investigation:
  - **mainnet latest**: `0x07723a839830c3be1233ba576a42a10f6f5f885a035bd99079502197c76282ec`
  - **mainnet historical (`2831000` / `2834000`)**: `0x05d875a0f1b636af8709ab7a2f20e6a6d00abae8512dfa01076da6157c133cc4`
  - **mainnet historical (`3050000` / `3210000`)**: `0x05be81704a504c53270ca44e4e96cd6abdad6d3550aa415d7a4d54cb8563c4bb`
  - **sepolia latest**: `0x0248389b7274b6f96b067903e8ad5af2af99054bdca9623f235e0e9af1c0608f`
  - **sepolia historical pre-upgrade (`2270000`)**: `0x0280394e1d66c3bfcf5e5cb52608216124a7dcd2fac389a98e6b472be5ad7df6`
  - **sepolia historical post-upgrade (`2272000`, `2560000`)**: `0x022c1242998b48e110928f178da4d3b205da9d98998adbc2f9d7146e7c4882bf`
  - **sepolia historical later rollout (`2710000`)**: `0x04bdb6681781c04e372702a8d758b96e8ff1c71f9985aa46e63f979a39c339d7`
- old resource addresses stay callable with their old schema at `latest`, so the resource contract address really is the historical schema version boundary
- the failure reproduces on cold index with `blocks_chunk_size = 10240` and is avoided locally with `1024`
- mata's Oct 28 executor errors were:

  ```text
  2025-10-28T16:52:32.674533Z ERROR torii::sqlite::executor: Failed to execute query. type=Other error=Sqlx(Database(SqliteError { code: 1, message: "table pistols-DuelistAssignment has no column named season_id" }))
  2025-10-28T16:52:32.677529Z ERROR torii::sqlite::executor: Failed to execute query. type=Other error=Sqlx(Database(SqliteError { code: 1, message: "table pistols-Duelist has no column named released_fame" }))
  2025-10-28T16:52:32.679636Z ERROR torii::sqlite::executor: Failed to execute query. type=Other error=Sqlx(Database(SqliteError { code: 1, message: "table pistols-MatchQueue has no column named enlisted_duelist_ids" }))
  ```
- Luca's Dec 19 / Dec 20 follow-up confirmed the poisoned state can persist without a clean crash:

  ```text
  2025-12-19T19:21:29.293609Z ERROR torii::sqlite::executor: Failed to execute query. type=Other error=Sqlx(Database(SqliteError { code: 1, message: "table pistols-DuelistAssignment has no column named season_id" }))
  2025-12-19T19:21:29.298310Z ERROR torii::sqlite::executor: Failed to execute query. type=Other error=Sqlx(Database(SqliteError { code: 1, message: "table pistols-MatchQueue has no column named enlisted_duelist_ids" }))
  2025-12-20 useSdkEntitiesGet/provider errors: no such column: pistols-Pack.pegged_lords_amount
  2025-12-20 PistolQueryBuilder/provider errors: no such column: pistols-Duelist.released_fame
  ```

For a practical repro, the highest-signal replay window is the Oct 15-28 2025 ranked-queue / FAME rollout period rather than the earlier `Config.realms_address` migration alone.

## Trigger investigation: `InvalidEnumSelector { actual_selector: 18 }`

`PrimitiveError(InvalidEnumSelector { actual_selector: 18 })` turned out to be a separate trigger bug. Even with the immediate rollback patch above, that chunk would keep rolling back forever until the trigger bug was fixed as well.

The torii-side failure site is one of the entity/event deserializers, not the upgrade processors themselves:

- `StoreSetRecordProcessor` -> `entity.deserialize(...)`
- `StoreUpdateRecordProcessor` -> `entity.deserialize(...)`
- `StoreUpdateMemberProcessor` -> `member.ty.deserialize(...)`
- `EventMessageProcessor` -> `entity.deserialize(...)`

Important narrowing result from code review: torii **v1.8.1** pins `dojo-types` to Dojo rev `711cb72`, and current torii HEAD pins `0afeb1bc`. In both revisions, `dojo_types::primitive::Primitive` only defines numeric selectors `0..=15` (`Bool` through `EthAddress`). So `actual_selector: 18` cannot be a legitimate `Primitive` discriminant. The error name is therefore slightly misleading evidence: it points to a **generic enum-deserialization failure path** that happens to surface as `PrimitiveError::InvalidEnumSelector`.

One more concrete narrowing result: event models are always registered with `use_legacy_store = true` in `register_event.rs` and `upgrade_event.rs`, and `dojo_types::schema::Ty::deserialize(...)` only subtracts `1` from enum selectors for **non-legacy** storage. So for a historical event replay, `actual_selector: 18` means the active schema had **no option at index 18**.

The key implication is on a **fresh DB**:

- `RegisterEventProcessor` fetches the schema directly from chain via `ModelRPCReader::schema()`
- that fetch is bound to the concrete `event.address` and `event.class_hash` carried by the world event, not just the selector
- `strict_model_reader` defaults to `false`, so that fetch is against the provider's latest state unless explicitly overridden
- `EventMessageProcessor` declares a same-selector dependency on the register/upgrade task before it deserializes the event payload

That address/class-hash point is now directly verified against torii's pinned `dojo-world` source (`dojo` rev `0afeb1bc`): `ModelRPCReader::new(...)` constructs `ModelContractReader::new(address, world.provider())` and does **not** re-resolve the model or event by tag.

That dependency declaration turned out **not** to be enough. The later local replay showed the failing player already had multiple earlier `PlayerActivityEvent`s in the same chunk, and `TaskManager::add_parallelized_event_with_dependencies(...)` does not merge dependencies into an already-existing task. So a same-chunk ordering/tasking bug is now very much back on the table; the remaining question is the exact shape of that bug, not whether ordering can matter at all.

One generic explanation is still ruled out by code:

- `dojo_types::schema::Ty::diff()` explicitly treats enum-option additions as real diffs, so "the upgrade was ignored because only a nested enum changed" does **not** fit the pinned code

Taken alone, the code/chain review would still leave room for another event model. But the thread evidence now closes most of that gap:

- on **2025-10-14**, torii logs `Upgraded event. namespace=pistols name=PlayerActivityEvent` immediately before the first clearly reported `PrimitiveError(InvalidEnumSelector { actual_selector: 18 })`
- the same thread also shows repeated SQLite `CHECK constraint failed: activity_check`
- in Pistols code, the relevant event model carrying an `activity` enum column is `pistols-PlayerActivityEvent`, and `Activity::EnlistedRankedDuelist` is exactly variant `18`

So the failing event family is now confirmed: the replay is tripping on `pistols-PlayerActivityEvent.activity = 18`, and the remaining question that this investigation resolved was **which torii-side state was stale at that moment**.

Why `PlayerActivityEvent` was the right lead:

- `dojo/src/models/events.cairo` defines `Activity::EnlistedRankedDuelist` at **selector 18**
- the same file marks `PlayerActivityEvent` as `#[dojo::event(historical:true)]`, so torii replays it through `EventMessageProcessor` on cold index
- `dojo/src/systems/matchmaker.cairo` emits `Activity::EnlistedRankedDuelist`
- the `Activity` enum first gains `18` in `b9840a17` on **2025-09-27**; variants `19` and `20` land later in `bc5ad295` on **2025-10-15**; variant `21` follows in `720655ce` on **2025-10-20**
- on **mainnet**, the same selector is still on the old resource `0x05fbad80…` at block `2500000` (`2025-09-28 05:50:51 UTC`) and has moved to the new resource `0x05d875a0…` by block `2600000` (`2025-10-01 22:19:21 UTC`), so the historical resource boundary is real on both networks
- the poisoned-column log cluster from **2025-10-28** (`season_id`, `released_fame`, `enlisted_duelist_ids`) lines up with the same Oct 15-22 ranked-queue / FAME rollout window as those new `Activity` variants
- the very first public Sepolia failure report on **2025-10-10** already fits this path: `pistols-Config` upgrades at sepolia block `2270724`, which is the same block where `pistols-PlayerActivityEvent` first upgrades to an `18`-capable schema, while `pistols-Player` upgraded much earlier at `2202995` and was reported healthy

But the historical chain reads also prove something stricter: the **later** rollout-era resource transitions only add `19`, `20`, and `21`. They do not make `18` invalid. Combined with the local replay, the directed trigger theory is now:

1. torii reaches the later `PlayerActivityEvent.activity = 18` payload at block `2271871` while the active schema it is using for that player's historical event task is still **pre-18**
2. the task already exists because earlier pre-upgrade `PlayerActivityEvent`s for the same player occurred earlier in the chunk
3. the later `activity = 18` event is appended to that task without gaining the `EventUpgraded(PlayerActivityEvent)` dependency
4. the task therefore runs against old cached schema and fails on `actual_selector: 18`

That theory is torii-specific and backed directly by both code and chain history:

- `ModelCache` is keyed only by `(world_address, selector)` (`crates/cache/src/lib.rs`)
- `storage.register_model` upserts one `models` row per `world_address:model_selector`, not per event resource contract version (`crates/sqlite/sqlite/src/storage.rs:1726-1788`)
- `EventMessageProcessor::task_identifier` groups work by `(world, selector, entity_id)` and `task_dependencies()` only returns the selector-upgrade dependency when the event is added (`crates/processors/src/processors/event_message.rs`)
- `TaskManager::add_parallelized_event_with_dependencies(...)` appends to an existing historical task without merging dependencies (`crates/processors/src/task_manager.rs`)
- `TaskNetwork::add_task_with_dependencies(...)` silently ignores dependencies whose prerequisite task does not yet exist (`crates/task-network/src/lib.rs`)

Direct world-event reads now tighten that further. Querying `starknet_getEvents` on the Pistols world confirms the world did emit the relevant `EventUpgraded` records for `pistols-PlayerActivityEvent`:

- **sepolia `2270724`**: `0x0280394e… -> 0x022c1242…` (pre-18 -> includes `18`)
- **mainnet `2544507`**: `0x05fbad80… -> 0x05d875a0…` (pre-18 -> includes `18`)
- **sepolia `2568610`**: `0x022c1242… -> 0x0130d4f2…` (adds later variants after `18`)
- **mainnet `3033226`**: `0x05d875a0… -> 0x05be8170…` (adds later variants after `18`)

That removes one more world-side explanation: for this selector, the historical upgrade events were not merely implied by `resource(...)` state changes; they were actually published on chain. The remaining failure is therefore inside torii's replay/tasking behavior, not in missing upgrade publication.

### Other plausible `18` sources to keep in mind

Among the configured historical event set (`PlayerActivityEvent`, `LordsReleaseEvent`, `FamePegEvent`, `PurchaseDistributionEvent`, `TrophyProgression`), only `PlayerActivityEvent` has a rollout-era enum value at `18` that matches the captured failure. `LordsReleaseEvent` and `FamePegEvent` only carry small enums, `PurchaseDistributionEvent` has no enum-at-18 field, and `TrophyProgression` has no enum payload at all.

Before the local replay confirmed `EventMessageProcessor`, the main non-event fallback considered was:

- a full-record model path carrying `DuelistProfile`, most likely `Duelist` or `PlayerDuelistStack`
  - `Duelist` carries `duelist_profile: DuelistProfile` and is directly adjacent to one of the poisoned upgrades: `Duelist.released_fame`
  - `PlayerDuelistStack` also carries `duelist_profile: DuelistProfile` and is rewritten during `memorialize_duelists(...)`
  - both are only relevant if the failing processor is `StoreSetRecordProcessor` or `StoreUpdateRecordProcessor`; `StoreUpdateMemberProcessor` only deserializes the changed member type
  - `GenesisKey::Groggus = 18` remains the most concrete model-side `18`, but it is only historical context now: the current mainnet world postdates the `Groggus` source change and sepolia only leaves a narrow deployment overlap window

The earlier `Trophy::TricksterDeath = 18` branch is now retired as a lead. The stored historical achievement event torii indexes here is `TrophyProgression`, and that payload does **not** carry a `Trophy` enum field.

## Ruled-out theories

This is the compact list of explanations that looked plausible earlier in the investigation but no longer fit the code and chain evidence.

### 1. "`actual_selector: 18` means torii needs a new `Primitive` variant"

Ruled out by torii's pinned `dojo-types` source.

- inspected Dojo revs `711cb72` and `0afeb1bc`
- `dojo_types::primitive::Primitive` only accepts numeric selectors `0..=15`
- `18` therefore cannot be a legitimate primitive discriminant

Conclusion: this is a **higher-level enum decode failure** surfacing through `PrimitiveError`, not a missing primitive type.

### 2. "The event/schema upgrade was ignored because only a nested enum changed"

Ruled out by `dojo_types::schema::Ty::diff()`.

- the pinned `schema.rs` implementation diffs enum options by name
- appending a new enum variant produces a non-`None` diff
- `PlayerActivityEvent.Activity` gaining `EnlistedRankedDuelist` is therefore a real schema upgrade from torii's perspective

Conclusion: the `18` trigger is not explained by `Ty::diff()` silently treating the upgrade as a no-op.

### 3. "torii fetched the wrong schema because `ModelRPCReader` ignored the historical resource address"

Ruled out by torii's pinned `dojo-world` source.

- `ModelRPCReader::new(namespace, name, address, class_hash, world)` stores the passed `address`
- it constructs `ModelContractReader::new(address, world.provider())`
- schema reads therefore target the concrete resource contract address carried by the world event

Conclusion: this is not "torii resolved latest schema by selector/tag even though the world event pointed at an older resource."

### 4. "`PlayerActivityEvent.activity = 18` failed because Pistols never published variant `18` on chain"

Ruled out by direct historical chain reads.

- `resource(selector)` checks show variant `18` already live on sepolia by block `2272000`
- the same check shows variant `18` already live on mainnet by block `2544507` and certainly by `2831000`
- later rollout-era resource versions only add `19`, `20`, and `21`; they do not make `18` invalid again

Conclusion: the simple "missing on-chain metadata" story is false for the replay window that matters.

### 5. "The world resource changed, but no `EventUpgraded` was emitted for torii to follow"

Ruled out for `pistols-PlayerActivityEvent` by direct `starknet_getEvents` queries.

- sepolia emits `EventUpgraded` at blocks `2270724` and `2568610`
- mainnet emits `EventUpgraded` at blocks `2544507` and `3033226`
- the event data shows the old and new event resource contract addresses for the same selector

Conclusion: for the leading selector, Pistols/Dojo did publish the upgrade events torii would need. If torii is still stale later, the failure is in torii's replay state, not in the absence of upgrade publication.

### 6. "torii just processed the payload before the upgrade because of a simple ordering race"

Partially revived, but in a **more specific** form than the original theory.

What is still ruled out:

- this is not a generic provider race where Starknet returned the `activity = 18` payload before the earlier `EventUpgraded`
- direct `starknet_getEvents` queries show the relevant world events in ascending block order
- the captured failing payload is at **block `2271871`**, while the `PlayerActivityEvent` upgrade is at **block `2270724`**

What is now supported by code and chain evidence:

- the failing player already had earlier `PlayerActivityEvent`s in the same chunk before block `2270724`
- `EventMessageProcessor` groups those historical events into one task keyed by `(world, selector, player)`
- `TaskManager::add_parallelized_event_with_dependencies(...)` does not merge dependencies when appending to an existing task
- `TaskNetwork::add_task_with_dependencies(...)` also ignores dependencies whose prerequisite task does not yet exist

Conclusion: a **specific task/dependency ordering bug** now looks like the best explanation for the observed failure. What is ruled out is only the weaker version of the theory: "torii randomly saw the later event first."

### 7. "The real culprit is a model-side `GenesisKey::Groggus = 18` decode"

Demoted to a narrow fallback, effectively ruled out as the **general** explanation.

- the current mainnet world does not exist at block `1375000` (`2025-05-05 12:56:03 UTC`)
- it does exist by block `1500000` (`2025-06-18 04:29:30 UTC`)
- `Groggus = 18` lands on `2025-05-04`, before the current mainnet world even exists
- sepolia only leaves a narrow deployment overlap window (`740000` not found, `750000` exists)

Conclusion: `Groggus` remains a conceivable sepolia-only fallback if the failing processor is a full-record `Duelist` or `PlayerDuelistStack` path, but it is not a strong cross-network explanation for the shared trigger.

### 8. "The `18` is `Trophy::TricksterDeath` from `TrophyProgression`"

Retired as a live lead.

- `TricksterDeath = 18` is real in `dojo/src/types/trophies.cairo`
- but the historical event torii indexes is `TrophyProgression`
- that payload does **not** carry a `Trophy` enum field in the way `PlayerActivityEvent` carries `Activity`
- it also does not line up cleanly with the Oct 15-22 ranked-queue / FAME rollout that clusters the poisoned model upgrades

Conclusion: `TrophyProgression` is not the best use of investigation time unless instrumented replay explicitly points there.

### Trigger bug remediations

#### 1. Immediate diagnostic patch

The first useful step was to make torii tell us exactly what was failing. Add temporary logging around `PrimitiveError::InvalidEnumSelector` in:

- `crates/processors/src/processors/event_message.rs`
- `crates/processors/src/processors/store_set_record.rs`
- `crates/processors/src/processors/store_update_record.rs`
- `crates/processors/src/processors/store_update_member.rs`

On failure, log at least:

- namespace / model name
- selector / member selector
- raw event keys / values
- whether the failing path was event-message or store-update

One replay with that patch did turn the hypothesis into proof.

#### 2. Confirmed torii-side fix: preserve selector-upgrade dependencies for existing historical event tasks

The current local replay points to a tasking bug more directly than to a schema-versioning design bug.

What the repro now shows:

- the failing payload is the `PlayerActivityEvent` at **block `2271871`**
- the same player (`0x550212d3…`) already has multiple earlier `PlayerActivityEvent`s in the same chunk, before block `2270724`
- `EventMessageProcessor::task_identifier` groups historical event work by `(world, selector, entity_id)`; for `PlayerActivityEvent`, `entity_id` is the player key
- `TaskManager::add_parallelized_event_with_dependencies` only attaches dependencies when it **creates** a task; if the task already exists, it just appends the event

That means the likely exact failure mechanism is:

1. a pre-upgrade `PlayerActivityEvent` for the same player creates the historical event task
2. the later `EventUpgraded(PlayerActivityEvent)` task is inserted separately
3. the post-upgrade `activity = 18` event at block `2271871` is appended to the already-existing player task
4. because the task already exists, the selector-upgrade dependency is not added to it
5. the task runs against old cached schema and `activity = 18` fails to deserialize

The most direct torii fix is therefore:

- when `add_parallelized_event_with_dependencies` sees an existing task, merge in any new dependencies instead of ignoring them
- and/or teach `TaskNetwork` to retain unresolved dependencies instead of logging `Ignoring non-existent dependency.`

For this specific Pistols failure, that is now the first fix that has been **validated locally** before any deeper schema-versioning redesign.

That local torii patch now exists and is the one confirmed by the live replay. The changes are:

- `TaskManager::add_parallelized_event_with_dependencies` now merges newly discovered dependencies into an existing task instead of only appending the event
- `TaskNetwork` now retains unresolved dependencies and activates them once the prerequisite task is inserted, instead of dropping them as "non-existent"
- rollback handling now clears `balances_diff` as well as model cache state
- processors that need model definitions now read them via `ctx.storage.model(...)` rather than `ctx.cache.model(...)`, so rollback-time cache clears can repopulate from committed storage instead of failing with `CacheError(ModelNotFound(...))`

Local validation status:

- `cargo test -p torii-task-network` passes, including new tests covering late-added dependencies and dependency merges into existing tasks
- `cargo build -p torii` passes for the patched binary
- the patched Sepolia cold replay crossed **all three decisive points**: earlier same-player events (`2268329`), the schema upgrade (`2270724`), and the captured failing payload block (`2271871`)
- after that crossing, `pistols-Config` gained `realms_address`, `pistols-PlayerActivityEvent` gained `EnlistedRankedDuelist`, and torii continued storing `PlayerActivityEvent` messages from `pistols-matchmaker` (`0x16f7e3c1…`) without `InvalidEnumSelector`

That is enough to treat the task/dependency fix as **locally confirmed** for the historical replay trigger.

#### 3. Secondary torii-side hardening: version historical event schemas by resource contract

This is still a valid hardening direction, but it is no longer the best first explanation for the captured `activity = 18` failure.

If torii needs to support non-additive historical event schema changes safely, the stronger long-term design is still:

- key event schemas by `(world_address, selector, contract_address)` or `(world_address, selector, class_hash)`, not just `(world_address, selector)`
- make `EventMessageProcessor` resolve the schema for the emitting historical event resource version, not merely the selector

But the current Pistols repro now has a more direct task/dependency explanation, so this should be treated as a broader hardening improvement, not the primary fix for the observed bug.

#### 4. Secondary torii hardening: self-heal on enum mismatch

Torii can still be made more robust here.

A targeted hardening patch would be:

- in `EventMessageProcessor`, catch `PrimitiveError::InvalidEnumSelector`
- refetch the event schema from chain for that selector
- if the fetched schema differs from cached schema, update cache/storage and retry the deserialize once

This is a **hardening** patch, not the primary root fix. It helps if torii has cached the wrong schema version or if DB state is lagging. It does **not** solve the task/dependency hole above by itself.

#### 5. Low-confidence torii hardening: strict block-aligned schema reads

Torii already has a `strict_model_reader` switch, but it defaults to `false`. That means `register_model`, `upgrade_model`, `register_event`, and `upgrade_event` fetch schema at the provider's latest block unless strict mode is enabled.

This is worth testing, but it is not the main theory:

- force `set_block(BlockId::Number(ctx.block_number))` for historical replay
- or at least test cold replay with `strict_model_reader = true`

I consider this a lower-confidence hardening lever, not the main fix. It helps validate whether the reader is pulling an unexpected schema snapshot, but it does not address the selector-only versioning problem above.

#### 6. If logging shows the failing enum is not `PlayerActivityEvent`

This branch was not taken in the local replay. It is kept here as discarded contingency logic from the live investigation.

If logging shows a different enum in a future case, stop optimizing around `PlayerActivityEvent` entirely and fix the schema/model that actually appears in the log.

#### 7. If logging still points at `PlayerActivityEvent`

This is the branch the local replay confirmed. Once logging still points at `PlayerActivityEvent`, the problem is no longer "Pistols forgot to publish variant 18". The two realistic explanations become:

- torii is binding the wrong historical event schema version to the selector
- or there is a higher-level enum-deserializer bug in `dojo_types`

At that point the first validation step is to inspect torii's stored `models` row for `pistols-PlayerActivityEvent` while the replay is failing:

- if `contract_address` / `class_hash` still point at the old pre-18 resource, torii's historical event-schema state is the issue
- if they point at the upgraded resource and the schema JSON still lacks the option, the problem is deeper in schema persistence / deserialization

If either of those checks confirms stale event-schema state, the torii versioning fix above becomes the first code change I would try before touching `dojo_types`.

#### 8. Not recommended: generic "ignore unknown enum selector"

Do not apply a blanket parser patch that swallows unknown enum discriminants globally.

The reason is structural: once enum decoding accepts an unknown selector, torii no longer knows how many felts to consume for that variant payload. For unit variants this might appear harmless; for payload-bearing variants it can desynchronize the rest of the decode stream and create harder-to-debug corruption.

If a local workaround is needed, it should be narrow and model-specific.

#### 9. Last-resort local workaround

If we need to get a cold reindex through before the trigger bug is fixed upstream, a local torii patch could catch the exact logged deserialization failure and drop that historical event instead of rolling back the whole chunk.

That would trade correctness in the affected historical event stream for forward progress of the indexer, so it should be treated as an emergency workaround, not the preferred fix.

## Reference timeline

This is the compact reconstruction reference for recreating the bug across **torii**, **Pistols**, and **chain state**.

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
| `2025-09-29 18:07:42 -03:00` | Pistols deploy | `9a3171a1` (`migrate mainnet`) | mainnet later confirmed upgraded by `2831000` | early mainnet deployment point for the same era |
| `2025-09-29 19:44:47 UTC` | chain check | mainnet `2544507` | `EventUpgraded`: `0x05fbad80… -> 0x05d875a0…` | direct proof the world emitted the mainnet `PlayerActivityEvent` upgrade that makes `18` valid |
| `2025-09-30` | torii | `v1.7.3` / `0155915d` | n/a | hazard already present before Pistols starts seeing it |
| `2025-10-01 22:19:21 UTC` | chain check | mainnet `2600000` | event resource `0x05d875a0…` | mainnet has already switched to the `PlayerActivityEvent` resource that later proves variant `18` is live |
| `2025-10-06` | torii | `v1.7.5` / `e0ba3fc5` | n/a | verified locally to have the same rollback/cache bug as HEAD |
| `2025-10-08` | torii | `v1.8.0` / `dffb1c36` | Dojo pin `6daa3d0` | mainnet continuous indexing still not visibly poisoned |
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
| `2026-04-30` | local repro | unpatched torii `1.8.7` + `dojo/torii_sepolia_repro.toml` | sepolia head `2344836` after replaying past critical window `2266480 .. 2276720` | `pistols-Config` still lacks `realms_address`, `pistols-PlayerActivityEvent` still ends at `ClaimedRing`, and historical event tables truncate around `2025-10-03` / `2025-10-06` |
| `2026-04-30 09:12:46 UTC` | local repro | patched torii with event-message instrumentation | sepolia replay window around `2270724` | direct proof: `EventMessageProcessor` fails on `pistols-PlayerActivityEvent` with `raw_values=[0x68d89396, 0x12, 0x351, 0x1]`, `actual_selector: 18`, while using pre-upgrade resource `0x463f225e…`; same window also logs `UpgradeEvent(PlayerActivityEvent -> 0x22c12429…)` and `UpgradeModel(Config)` |
| `2026-04-30` | local torii patch | dependency-merge + storage-backed rollback recovery | n/a | local fix lands: merge dependencies into existing historical event tasks, retain late prerequisite links in `TaskNetwork`, clear rollback-sensitive cache state, and rebuild model reads from committed storage after rollback |
| `2026-05-01` | local confirmation | patched torii replay from pre-critical head `2262908` | sepolia heads `2273149`, `2283390`, `2293631` | replay crosses the exact trigger window cleanly: `Config.realms_address` flips `0 -> 1`, `PlayerActivityEvent.EnlistedRankedDuelist` flips `0 -> 1`, `activity_check` now includes `EnlistedRankedDuelist`, and torii continues storing `PlayerActivityEvent` rows from `pistols-matchmaker` without `InvalidEnumSelector` |

### Minimal reproduction map

For a developer starting fresh, the shortest useful sequence is:

1. verify the rollback/cache bug locally in torii with a deterministic test
2. reproduce the historical chain side around:
   - mainnet `1375000` / `1500000` and sepolia `740000` / `750000` if you need to re-check whether a model-side `Groggus` path is even plausible on the current world
   - sepolia `2270000` / `2272000` for the `PlayerActivityEvent` schema transition
   - mainnet `2500000` / `2600000` for the corresponding mainnet `PlayerActivityEvent` resource transition
   - sepolia `2560000`, `2640000`, `2710000` for the cold-replay failure window
   - mainnet `3050000`, `3100000`, `3150000`, `3210000` for the corresponding mainnet rollout window
3. run one instrumented cold replay and record:
   - failing processor
   - namespace / model / event
   - raw keys / values
   - block number
   - if reproducing from this repo, use [`dojo/torii_sepolia_repro.toml`](../../../dojo/torii_sepolia_repro.toml) to pin the historically relevant Sepolia settings explicitly (`world_block = 23920`, `blocks_chunk_size = 10240`, narrower historical event list)
4. in this investigation, the failure **was** in `EventMessageProcessor`, and the decisive follow-up was the **historical task/dependency** check:
   - earlier same-player events had already created the task before the selector upgrade
   - the later post-upgrade event was appended without acquiring the upgrade dependency
5. the store-update processor path remains documented above only as discarded fallback context; it was not the failing path in the confirmed local repro

### Current local repro status

We now have a real cold-replay result from this repo, not just historical logs.

Using unpatched **torii `1.8.7`** with [`dojo/torii_sepolia_repro.toml`](../../../dojo/torii_sepolia_repro.toml) against a fresh sqlite DB, the replay has already advanced past the critical Sepolia window:

- `world_block = 23920`
- `blocks_chunk_size = 10240`
- checked world head during the run: **`2344836`**
- critical window from the Oct 2025 reports: **`2266480 .. 2276720`**

At that point the DB is still on the old schema shape:

- `pistols-Config` table still lacks `realms_address`
- `pistols-PlayerActivityEvent` still enforces the old `activity_check` enum constraint ending at `ClaimedRing`
- the corresponding `models.schema` rows also still do **not** contain `realms_address` or `EnlistedRankedDuelist`

The same run also shows the configured historical event tables truncating well before the replay head:

- `pistols-PlayerActivityEvent`: `47` rows, latest `internal_executed_at = 2025-10-03T12:24:40+00:00`
- `pistols-LordsReleaseEvent`: `5` rows, latest `internal_executed_at = 2025-10-03T12:24:40+00:00`
- `pistols-TrophyProgression`: `82` rows, latest `internal_executed_at = 2025-10-03T12:24:40+00:00`
- `pistols-CallToChallengeEvent`: `130` rows, latest `internal_executed_at = 2025-10-06T18:21:35+00:00`

That is earlier than the Oct 14-15 transition where the historical reports first show `InvalidEnumSelector { actual_selector: 18 }`. So the local replay is not just "missing one later additive schema change"; it appears to be losing historical event progress before the critical transition and then continuing world sync anyway.

The relevant direct sqlite reads from that run were:

```sql
SELECT head FROM contracts WHERE contract_type = 'WORLD';
-- 2344836

PRAGMA table_info([pistols-Config]);
-- key, treasury_address, lords_address, vrf_address, current_season_id, is_paused
-- no realms_address

SELECT sql
FROM sqlite_master
WHERE type = 'table' AND name = 'pistols-PlayerActivityEvent';
-- ... CHECK([activity] IN (
--   'Undefined', 'TutorialFinished', 'PackStarter', 'PackPurchased',
--   'PackOpened', 'DuelistSpawned', 'DuelistDied', 'ChallengeCreated',
--   'ChallengeCanceled', 'ChallengeReplied', 'MovesCommitted',
--   'MovesRevealed', 'PlayerTimedOut', 'ChallengeResolved',
--   'ChallengeDraw', 'ClaimedGift', 'AirdroppedPack', 'ClaimedRing'
-- ))

SELECT name,
       instr(schema, 'realms_address') > 0,
       instr(schema, 'EnlistedRankedDuelist') > 0
FROM models
WHERE namespace = 'pistols'
  AND name IN ('Config', 'PlayerActivityEvent')
ORDER BY name;
-- Config|0|0
-- PlayerActivityEvent|0|0
```

That result matters for two reasons:

1. It reproduces the Oct 2025 failure mode locally with a clean cold replay and the historically correct config shape.
2. It shows the unpatched replay can advance **well past** the known upgrade block (`2270724`) without ever landing either the `Config` additive column or the `PlayerActivityEvent` enum expansion. So the problem is not just "one noisy log line near the transition"; it leaves the DB observably stale after the replay has moved on.
3. It suggests the broader cold-replay failure is at least partly **historical-event-specific**. The replay head continues advancing, but the indexed historical event tables stop days earlier than the reported trigger window.

By contrast, the current patched local replay from a copied pre-critical DB state **does** pass the same window cleanly. Starting from head `2262908`, it crossed the three decisive milestones:

- earlier same-player `PlayerActivityEvent`s in the chunk
- `EventUpgraded(PlayerActivityEvent)` at `2270724`
- the captured failing payload block `2271871`

And after those crossings:

- world head continued to **`2273149`**, then **`2283390`**, then **`2293631`**
- `pistols-Config` flipped from `Config|0` to `Config|1` and `PRAGMA table_info([pistols-Config])` now includes `realms_address`
- `pistols-PlayerActivityEvent` flipped from `PlayerActivityEvent|0` to `PlayerActivityEvent|1`
- the table DDL now includes `EnlistedRankedDuelist` in `activity_check`
- the table contains `EnlistedRankedDuelist` rows
- torii logs continue to show `Store event message. namespace=pistols name=PlayerActivityEvent system=0x16f7e3c1…` after the upgrade window, with **no** `InvalidEnumSelector`

That is the local end-to-end confirmation that the current torii patch fixes the historical replay trigger and allows the missing schema upgrades to land.

### Patched replay breakthrough: exact trigger captured

The patched local torii build has now captured the exact failing historical event in instrumented logs.

At `2026-04-30T09:12:46Z`, `EventMessageProcessor` logged:

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

Immediately after that same replay window, torii logged:

```text
INFO  upgrade_event: Upgraded event. namespace=pistols name=PlayerActivityEvent
      contract_address=0x22c1242998b48e110928f178da4d3b205da9d98998adbc2f9d7146e7c4882bf
      class_hash=0x1ed241446f4c94ccbb186927f5d06c685adcbf043935d99bf54bb90ef5723b4

INFO  upgrade_model: Upgraded model. namespace=pistols name=Config
ERROR engine: Processing fetched data. error=Processors(TaskNetworkError(TaskError(
      PrimitiveError(InvalidEnumSelector { actual_selector: 18 }))))
```

This is the clearest root-cause evidence gathered so far:

- the failing processor is **definitively** `EventMessageProcessor`
- the failing event is **definitively** `pistols-PlayerActivityEvent`
- the failing selector is **definitively** `activity = 18`
- the failing decode is using the **pre-upgrade** event resource contract `0x463f225e…`
- in the same replay window, torii also processes the `PlayerActivityEvent` upgrade to the first `18`-capable resource `0x22c12429…` and the `Config` model upgrade

So the confirmed failure chain is:

1. torii reaches a historical `PlayerActivityEvent` payload whose `activity` discriminant is `18`
2. it tries to decode that payload against the **older pre-18 resource schema**
3. the same replay window also contains the `EventUpgraded(PlayerActivityEvent)` and `ModelUpgraded(Config)` events
4. the deserialize failure aborts the chunk
5. the rollback/cache bug then turns that trigger into the reported poisoned-DB state

This also demotes the remaining ambiguity sharply. We no longer need to ask "is the failing path really `PlayerActivityEvent`?" or "is `18` really the `activity` enum?". Those two questions are now answered.

Targeted chain follow-up narrows the torii-side mechanism further.

- the failing payload timestamp `0x68d89396` decodes to **`2025-09-28 01:47:02 UTC`**
- `starknet_getEvents` confirms that exact payload is the world `EventEmitted` at **block `2271871`**, tx `0x69d9c453…`
- the same event's third key is system address `0x16f7e3c1…`, which resolves to **`pistols-matchmaker`**
- the same query also shows the same player (`0x550212d3…`) already had multiple earlier `PlayerActivityEvent`s in the same chunk at blocks `2268329`, `2268359`, `2268364`, `2268403`, `2268406`, `2268420`, `2268449`, `2269979`, and `2270482`
- those earlier events all use pre-18 `activity` values (`7`, `10`, `11`, `13`, …), so they are compatible with the old schema and can create the historical event task before the upgrade is reached

That is the strongest current explanation for why torii is still on the old schema at block `2271871`: the task was created from earlier same-player events and the later `activity = 18` event was appended to it without acquiring the schema-upgrade dependency.

### Patch confirmation: dependency merge + storage-backed rollback recovery

After the exact trigger was captured, the local torii checkout was patched in the direction the repro now points:

- preserve selector-upgrade dependencies when later historical events are appended to an already-existing task
- keep unresolved dependencies in `TaskNetwork` until the prerequisite task is inserted
- clear rollback-sensitive cache state (`models`, `balances_diff`) on chunk rollback
- make replay processors reload model definitions from committed storage after rollback instead of crashing on an empty model cache

This is the first local patch that actually matches the current root-cause picture. It is broader than the original one-line `clear_models()` rollback fix, but still narrowly targeted at the two failure modes the repro has already shown:

1. the exact `PlayerActivityEvent.activity = 18` task/dependency bug
2. the follow-on `CacheError(ModelNotFound(...))` caused by emptying model cache without a storage-backed recovery path

Validation status:

- the patch builds successfully (`cargo build -p torii`)
- targeted `torii-task-network` tests pass after the dependency changes
- the replay has now crossed Sepolia block `2271871` cleanly
- schema state flipped from stale to upgraded in the DB itself, not just in logs
- `PlayerActivityEvent` rows from the captured failing system continue to be stored after the former trigger point

That is enough to treat the current torii patch as **locally confirmed**:

1. the trigger bug is the missing dependency merge for existing historical event tasks
2. the rollback bug still needs cache invalidation, but in practice that invalidation must be paired with storage-backed model reloads rather than a bare empty cache
3. together, those changes get the Pistols Sepolia replay through the known failure window and land the missing schema changes

## Repairing a poisoned DB

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
   - if torii still immediately retries the same chunk with `InvalidEnumSelector`, the DB repair worked but the independent parser failure still needs the chunk-size workaround or an upstream fix

## Pistols-side mitigations until upstream is fixed

1. If running an **unpatched** torii, pin `blocks_chunk_size ≤ 1024` for fresh cold indexes. This was verified locally to avoid the column-loss path by separating the upgrade from the failing event into different chunks.
2. If the DB is already poisoned, use the repair procedure above. The important invariant is: fix the table DDL, not the `models.schema` JSON.
3. If using the local torii patch confirmed in this investigation, prefer a clean cold replay rather than continuing from a previously poisoned DB.
4. Once an upstream fix is available, redeploy on a torii ≥ that version and re-index from genesis.

## File pointers (torii)

- Engine main loop / rollback site: `crates/indexer/engine/src/engine.rs:212-243`
- Process pipeline / commit point: `crates/indexer/engine/src/engine.rs:279-336`
- ModelCache (in-memory, RwLock-protected): `crates/cache/src/lib.rs:151-238`
- `Sql::model()` cache-then-DB fallback: `crates/sqlite/sqlite/src/storage.rs:56-83`
- `register_model` storage path (issues `ALTER TABLE`): `crates/sqlite/sqlite/src/storage.rs:1722-1815` and `crates/sqlite/sqlite/src/lib.rs:259-413`
- `UpgradeModelProcessor`: `crates/processors/src/processors/upgrade_model.rs`
- `RegisterModelProcessor`: `crates/processors/src/processors/register_model.rs`
- `UpgradeEventProcessor`: `crates/processors/src/processors/upgrade_event.rs`
- `EventMessageProcessor`: `crates/processors/src/processors/event_message.rs`
- Store-value deserializers: `crates/processors/src/processors/store_set_record.rs`, `store_update_record.rs`, `store_update_member.rs`
- Token-registration cache mutation before commit: `crates/processors/src/erc.rs`
- `TaskManager` (per-task sequential, cross-task parallel): `crates/processors/src/task_manager.rs`
- Executor (single sqlx transaction per chunk, rollback): `crates/sqlite/sqlite/src/executor/mod.rs:186,291,298,1154,1302-1312`
