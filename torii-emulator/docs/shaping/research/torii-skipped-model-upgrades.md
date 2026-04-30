---
title: "Torii skipped-model-upgrade bug"
kind: research
date: 2026-04-30
informs: [00, 04]
---

# Torii skipped-model-upgrade bug — investigation

## TL;DR

Torii's indexer keeps an in-memory `ModelCache` in sync with the model schema, but **does not clear that cache when a chunk-level rollback occurs**. When an `InvalidEnumSelector` (or any other) error fires inside the same chunk as a `ModelUpgraded` event, the SQL transaction is rolled back (so `ALTER TABLE … ADD COLUMN` is discarded) while `ModelCache::register_model` remains updated to the new schema. On retry, `UpgradeModelProcessor` reads `prev_schema` from the (now-poisoned) cache, computes `new_schema.diff(prev_schema) == None`, and silently returns without re-issuing the `ALTER TABLE`. The model row in the `models` table gets re-upserted, the schema JSON is "updated", but the column never exists in SQLite — every subsequent `INSERT`/`UPDATE` for that column fails with `table … has no column named …` and entity reads via gRPC fail with `no such column`.

The structural hazard is **older than the standalone torii repo**: it effectively dates to **Nov 14 2024** in the `dojoengine/dojo` monorepo (see "Origin of the hazard" below) and has been present in every tagged torii release since **v1.5.0 (2025-04-29)** — including HEAD (v1.8.15) at time of writing. The parser failure that exposes it is still separate, but the evidence is now sharper than when this investigation started. Checking torii's pinned `dojo-types` source shows `Primitive` only accepts numeric selectors `0..=15`, so `actual_selector: 18` is almost certainly **not** a real `Primitive` discriminant; it is a higher-level enum decode failure surfacing through `PrimitiveError`. Direct historical chain reads also falsify the simplest early theory: by the time the Oct 15-28 2025 replay window begins, both sepolia and mainnet already expose `EnlistedRankedDuelist` in `pistols-PlayerActivityEvent` on chain. The remaining directed suspects are therefore: **(a)** the failing `18` belongs to a different enum introduced in the same rollout window, or **(b)** torii is binding the wrong historical event schema version to a selector during cold replay. As long as Pistols was being indexed continuously by torii ≤ 1.8.0 (mainnet) the rolled-back-then-retry codepath never executed for a `Config` upgrade chunk, so the latent cache-poison stayed invisible. Re-indexing cold under torii ≥ 1.8.1 hits the deserialize failure, exposes the latent bug, and drops the column.

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
- Reproduces on a fresh delete+create of the Slot Sepolia indexer on torii ≥ 1.8.1 (still failing on 1.8.7). Mainnet (which had been continuously indexed under an older binary) was unaffected initially.
- `blocks_chunk_size = 10240` triggers it; **lowering to `1024` works around it** locally.
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

By Dec 19 the same class of error had spread to `pistols-DuelistAssignment.season_id`, `pistols-MatchQueue.enlisted_duelist_ids`, `pistols-Duelist.released_fame`, etc. — anything added by a `ModelUpgraded` whose chunk also contained a failing event. glihm summarised it as "Torii somehow skips some upgrade of the schema of the model. which causes future inserts to not work due to the column not being added properly."

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

The blast radius is a single chunk. With `blocks_chunk_size = 10240`, the failing event (`InvalidEnumSelector { actual_selector: 18 }`) is very likely to fall in the same chunk as the `Config` upgrade, so every retry of that chunk hits the cache-poison path and the column never lands. The exact offender is still a historical/event-deserialization problem, but direct chain checks make the earlier "it must be `PlayerActivityEvent.activity = 18` against missing on-chain metadata" story too weak to treat as the lead anymore.

With `blocks_chunk_size = 1024` the upgrade event and the failing event end up in different chunks roughly 9× out of 10. The upgrade chunk commits cleanly on its first attempt (cache and DB stay aligned); the *failing* chunk just keeps retrying forever (or skipping forward, depending on backoff config) but it no longer corrupts the schema of unrelated models.

This is a workaround, not a fix — the underlying cache-poisoning is still latent and any future error inside an upgrade chunk will reproduce it.

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

- the failing value looked very likely to be `PlayerActivityEvent.activity = EnlistedRankedDuelist (18)`
- the schema torii used for that event therefore looked like it lacked option index `18`
- on a fresh DB, that made a pure torii cache-ordering explanation unlikely, because `RegisterEventProcessor` fetches chain schema directly and `EventMessageProcessor` depends on the same-selector register/upgrade task

That was a reasonable first pass, but direct historical chain verification changes the conclusion materially.

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
| sepolia | `2560000` | `2025-10-15 05:32:18` | same upgraded resource still includes `EnlistedRankedDuelist`, hours before the Oct 15 matchmaker rollout |
| mainnet | `2831000` | `2025-10-09 13:25:29` | event resource `0x05d875a0…`, `Activity` enum length `0x13`, `EnlistedRankedDuelist` **present** |
| mainnet | `2834000` | `2025-10-09 14:36:18` | same resource, still includes `EnlistedRankedDuelist` |

This matters a lot:

- on **sepolia**, variant `18` was already on chain by block `2272000`, more than two weeks before the Oct 15 queue/activity rollout
- on **mainnet**, variant `18` was already on chain by block `2831000`, well before the Oct 15-28 replay window that matters for the poisoned model upgrades

So the simple thesis "`PlayerActivityEvent.activity = 18` is failing because the world never exposed variant 18" is **false** for the actual replay window under discussion.

What the chain data does show is that the same selector moved across **different event resource contracts** over time on sepolia. That is relevant because torii does **not** version event schemas by resource contract:

- `ModelCache` is keyed only by `(world_address, selector)` (`crates/cache/src/lib.rs`)
- `storage.register_model` upserts `models.id = world_address:model_selector` (`crates/sqlite/sqlite/src/storage.rs:1726-1788`)
- `EventMessageProcessor` looks up the schema with `ctx.cache.model(ctx.contract_address, event.selector)` and ignores the emitting event resource `contract_address` (`crates/processors/src/processors/event_message.rs`)

That is a real torii-side weakness for historical replay. If the failing payload comes from an event whose schema changed across resource versions, torii currently has no way to bind deserialization to the exact emitting event resource version. But the chain checks above also mean we should stop treating `PlayerActivityEvent.activity = 18` as proven. It is now only one candidate among a smaller, better-defined set.

**Summary.** The hazard has been latent in *every* torii release since at least v1.5.0 (April 2025), originating from two dojoengine/dojo monorepo commits that were both in tree by **Nov 14 2024** (one authored earlier on Nov 4). The user-visible bug for Pistols first appeared in **cold re-indexes on the v1.8.x line** because replay hit a deserialize failure inside the same chunk as a model upgrade. The rollback/cache bug is definite. The exact `actual_selector: 18` trigger is still separate, but the direct chain evidence now points **away** from "missing `PlayerActivityEvent` variant 18 on chain" and **toward** either a different enum or torii's historical event-schema versioning.

## Bug remediations

### 1. Immediate patch: clear model cache on rollback

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

The `Cache` trait already exposes `clear_models` on the versions checked (including v1.7.5 and v1.8.15), so the code change is just wiring that existing invalidation call into the rollback path. Re-population happens lazily via `RegisterModelProcessor` / `UpgradeModelProcessor` on the next pass; or you can eagerly rebuild via `storage.models(&[], &[]).await`.

This is the smallest, lowest-risk fix and the one I would ship first for Pistols. It directly fixes the skipped-upgrade / poisoned-schema bug described above, and it also fixes the same rollback hazard for event schema upgrades in `register_event.rs` / `upgrade_event.rs`.

### 2. Broader rollback hardening: rebuild all commit-sensitive cache state

The model cache is the bug Pistols is hitting, but it is not the only cache with the same shape. Torii also mutates token-registration cache before SQL commit:

- `try_register_token_contract` enqueues `storage.register_token_contract(...)` and then immediately calls `cache.mark_token_registered(...)` in `crates/processors/src/erc.rs`.
- `try_register_nft_token_metadata` does the same for NFT token rows, then also mutates balance-diff cache.

If a later error in the same chunk triggers `storage.rollback()`, the DB can lose those token rows while cache still thinks the token is registered, causing the retry to skip re-registration.

So the cleaner upstream remediation is not "clear models only", but "restore cache state to the last committed DB state on rollback". Concretely, that likely means one of:

- add a cache `reload_from_storage` / `reset_from_storage` path and call it from the engine rollback arm
- add explicit rollback invalidators for both model cache and token-registration cache, then lazily repopulate from storage on retry

This is a little broader than the immediate Pistols hotfix, but still a small patch, not an architectural rewrite.

### 3. Stronger invariant: defer cache writes until after `storage.execute()`

Buffer `cache.register_model` calls in a per-chunk staging area (e.g. a `Vec<(Felt, Felt, Model)>` on the engine) and flush them only after `self.storage.execute().await?` returns `Ok`. On rollback, drop the staging buffer.

This is a little more invasive than (A) but keeps the cache strictly in sync with committed SQL state, which is arguably the correct invariant. It also closes the (smaller) window where `set_entity` calls running concurrently in the same task can read a "future" schema from the cache.

### 4. Not recommended: bypass cache when reading `prev_schema`

Revert PR #356 so `UpgradeModelProcessor` reads `prev_schema` via `ctx.storage.model(...)`. This *alone* doesn't fix the bug because `Sql::model()` itself still preferentially returns from cache (since v1.8.0 / PR #353). To make this approach work you'd need to add a "skip cache" path for the upgrade processor specifically — i.e. read the `models` row directly from sqlx during an upgrade. Not recommended; (A) is cleaner.

## Reproducing and testing

You do **not** need a full Sepolia replay to prove the skipped-upgrade / poisoned-cache bug. You probably do need **one** instrumented real replay to prove the exact `actual_selector: 18` trigger payload.

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

One cold replay with that patch should turn the current trigger hypothesis into proof.

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
- `PlayerActivityEvent.activity` variants `18`, `19`, `20` land in Pistols commit `bc5ad295` on **2025-10-15**; the enum itself first gains `EnlistedRankedDuelist` in `b9840a17` on **2025-09-27**
- `DuelistAssignment.season_id` lands in `59c9e266` on **2025-10-22**
- `Duelist.released_fame` lands in `6dc79473` on **2025-10-22**
- `MatchQueue.enlisted_duelist_ids` lands in `720655ce` on **2025-10-22**
- local `manifest_mainnet.json` and `manifest_sepolia.json` already include `EnlistedRankedDuelist` under `pistols-PlayerActivityEvent`, so the repo's compile-time schema is current
- useful historical schema-check blocks derived from the Pistols migration commits are:
  - **sepolia** `2270000` (`2025-09-27 23:06:55 UTC`) and `2272000` (`2025-09-28 01:58:05 UTC`) bracketing the actual on-chain transition from "no variant 18" to "variant 18 present"
  - **sepolia** `2560000` (`2025-10-15 05:32:18 UTC`) at the start of the queue/activity rollout; variant 18 is already present there
  - **mainnet** `2831000` (`2025-10-09 13:25:29 UTC`) and `2834000` (`2025-10-09 14:36:18 UTC`) showing variant 18 already live before the Oct 15-28 replay window
  - **mainnet** `3050000` (`2025-10-17 16:18:44 UTC`), `3100000` (`2025-10-20 15:02:32 UTC`), `3150000` (`2025-10-23 15:23:26 UTC`), and `3210000` (`2025-10-27 13:58:44 UTC`) bracketing the ranked-queue / poisoned-model rollout
  - **sepolia** `2640000` (`2025-10-22 13:38:06 UTC`) and `2710000` (`2025-10-29 03:49:19 UTC`) bracketing the same rollout on the network where cold replay first failed
- current and historical `pistols-PlayerActivityEvent` resource addresses observed during this investigation:
  - **mainnet latest**: `0x07723a839830c3be1233ba576a42a10f6f5f885a035bd99079502197c76282ec`
  - **mainnet historical (`2831000` / `2834000`)**: `0x05d875a0f1b636af8709ab7a2f20e6a6d00abae8512dfa01076da6157c133cc4`
  - **sepolia latest**: `0x0248389b7274b6f96b067903e8ad5af2af99054bdca9623f235e0e9af1c0608f`
  - **sepolia historical pre-upgrade (`2270000`)**: `0x0280394e1d66c3bfcf5e5cb52608216124a7dcd2fac389a98e6b472be5ad7df6`
  - **sepolia historical post-upgrade (`2272000`, `2560000`)**: `0x022c1242998b48e110928f178da4d3b205da9d98998adbc2f9d7146e7c4882bf`
- the failure reproduces on cold index with `blocks_chunk_size = 10240` and is avoided locally with `1024`
- mata's Oct 28 executor errors were:

  ```text
  2025-10-28T16:52:32.674533Z ERROR torii::sqlite::executor: Failed to execute query. type=Other error=Sqlx(Database(SqliteError { code: 1, message: "table pistols-DuelistAssignment has no column named season_id" }))
  2025-10-28T16:52:32.677529Z ERROR torii::sqlite::executor: Failed to execute query. type=Other error=Sqlx(Database(SqliteError { code: 1, message: "table pistols-Duelist has no column named released_fame" }))
  2025-10-28T16:52:32.679636Z ERROR torii::sqlite::executor: Failed to execute query. type=Other error=Sqlx(Database(SqliteError { code: 1, message: "table pistols-MatchQueue has no column named enlisted_duelist_ids" }))
  ```

For a practical repro, the highest-signal replay window is the Oct 15-28 2025 ranked-queue / FAME rollout period rather than the earlier `Config.realms_address` migration alone.

## Trigger investigation: `InvalidEnumSelector { actual_selector: 18 }`

Whatever event produces `PrimitiveError(InvalidEnumSelector { actual_selector: 18 })` is its own bug. Even with the immediate rollback patch above, that chunk will keep rolling back forever and indexing won't progress past it.

The torii-side failure site is very likely one of the entity/event deserializers, not the upgrade processors themselves:

- `StoreSetRecordProcessor` -> `entity.deserialize(...)`
- `StoreUpdateRecordProcessor` -> `entity.deserialize(...)`
- `StoreUpdateMemberProcessor` -> `member.ty.deserialize(...)`
- `EventMessageProcessor` -> `entity.deserialize(...)`

Important narrowing result from code review: torii **v1.8.1** pins `dojo-types` to Dojo rev `711cb72`, and current torii HEAD pins `0afeb1bc`. In both revisions, `dojo_types::primitive::Primitive` only defines numeric selectors `0..=15` (`Bool` through `EthAddress`). So `actual_selector: 18` cannot be a legitimate `Primitive` discriminant. The error name is therefore slightly misleading evidence: it points to a **generic enum-deserialization failure path** that happens to surface as `PrimitiveError::InvalidEnumSelector`.

One more concrete narrowing result: event models are always registered with `use_legacy_store = true` in `register_event.rs` and `upgrade_event.rs`, and `dojo_types::schema::Ty::deserialize(...)` only subtracts `1` from enum selectors for **non-legacy** storage. So for a historical event replay, `actual_selector: 18` means the active schema had **no option at index 18**.

The key implication is on a **fresh DB**:

- `RegisterEventProcessor` fetches the schema directly from chain via `ModelRPCReader::schema()`
- `strict_model_reader` defaults to `false`, so that fetch is against the provider's latest state unless explicitly overridden
- `EventMessageProcessor` depends on the same-selector register/upgrade task before it deserializes the event payload

That rules out one tempting explanation: this is **not** "the first `activity = 18` event happened in the same chunk as `EventUpgraded`, but torii processed them in the wrong order." The task graph forces the event message to wait on the same-selector register/upgrade task.

That rules out the "same block, wrong order" explanation, but it does **not** prove the failing event is `PlayerActivityEvent`. The direct chain checks above now make the older favorite theory too weak to lead with:

- `dojo/src/models/events.cairo` defines `Activity::EnlistedRankedDuelist` at **selector 18**
- the same file marks `PlayerActivityEvent` as `#[dojo::event(historical:true)]`, so torii replays it through `EventMessageProcessor` on cold index
- `dojo/src/systems/matchmaker.cairo` emits `Activity::EnlistedRankedDuelist`
- the `Activity` enum variants `18`, `19`, and `20` were added together in commit `bc5ad295` on **2025-10-15**; variant `21` followed in `720655ce` on **2025-10-20**
- the poisoned-column log cluster from **2025-10-28** (`season_id`, `released_fame`, `enlisted_duelist_ids`) lines up with the same Oct 15-22 ranked-queue / FAME rollout window as those new `Activity` variants

But the historical chain reads prove `PlayerActivityEvent` variant `18` was already live before the Oct 15-28 replay window on both networks. So the directed trigger theories are now:

1. the failing `18` belongs to a **different enum** introduced during the same Oct 15-28 rollout window
2. torii is resolving the **wrong historical event schema version** because it stores exactly one event model per `(world_address, selector)` even when the underlying event resource contract changes over time

The second theory is torii-specific and backed directly by both code and chain history:

- `ModelCache` is keyed only by `(world_address, selector)` (`crates/cache/src/lib.rs`)
- `storage.register_model` upserts one `models` row per `world_address:model_selector`, not per event resource contract version (`crates/sqlite/sqlite/src/storage.rs:1726-1788`)
- `EventMessageProcessor` loads schema by selector alone and ignores the emitting event resource `contract_address` (`crates/processors/src/processors/event_message.rs`)
- historical chain reads on **sepolia** show `pistols-PlayerActivityEvent` moved across different resource contracts between blocks `2270000` and `2272000`

That does **not** prove selector-only versioning is the exact cause of the `18` failure, but it is now the strongest torii-side theory that still fits both the code and the chain data.

### Other plausible `18` sources to keep in mind

If the instrumented replay shows the failure is **not** in `EventMessageProcessor` for `PlayerActivityEvent`, the next most useful local references are:

- `pistols::types::duelist_profile::GenesisKey::Groggus = 18`
  - appears in generated Pistols model schema and can surface through entity/model deserialization paths
  - relevant if the failing processor is `StoreSetRecordProcessor`, `StoreUpdateRecordProcessor`, or `StoreUpdateMemberProcessor`
- `pistols::types::trophies::Trophy::TricksterDeath = 18`
  - appears in generated schemas and achievement event types (`TrophyCreation`, `TrophyProgression`)
  - relevant if the failing processor turns out to be an achievement-related event/model path rather than the Pistols historical activity feed

These are weaker candidates than the historical event-schema versioning theory above, but they are worth preserving because they are concrete local enum discriminants at `18` and would be easy to miss in a later debugging session.

### Trigger bug remediations

#### 1. Immediate diagnostic patch

Before trying to "fix" the trigger, make torii tell us exactly what is failing. Add temporary logging around `PrimitiveError::InvalidEnumSelector` in:

- `crates/processors/src/processors/event_message.rs`
- `crates/processors/src/processors/store_set_record.rs`
- `crates/processors/src/processors/store_update_record.rs`
- `crates/processors/src/processors/store_update_member.rs`

On failure, log at least:

- namespace / model name
- selector / member selector
- raw event keys / values
- whether the failing path was event-message or store-update

One replay with that patch should turn the current hypothesis into proof.

#### 2. Primary torii-side fix to test: version historical event schemas by resource contract

If the trigger turns out to be in `EventMessageProcessor`, the cleanest code fix is no longer "update Pistols metadata". It is to stop collapsing multiple historical event resource versions into a single `(world_address, selector)` schema slot.

The concrete change would be:

- key event schemas by `(world_address, selector, contract_address)` or `(world_address, selector, class_hash)`, not just `(world_address, selector)`
- make `EventMessageProcessor` resolve the schema for the emitting historical event resource version, not merely the selector
- keep model/entity schemas on the existing selector-based path; this versioning issue is specific to event resources

That is the most specific torii-side fix that still fits all current evidence.

#### 3. Secondary torii hardening: self-heal on enum mismatch

Torii can still be made more robust here.

A targeted hardening patch would be:

- in `EventMessageProcessor`, catch `PrimitiveError::InvalidEnumSelector`
- refetch the event schema from chain for that selector
- if the fetched schema differs from cached schema, update cache/storage and retry the deserialize once

This is a **hardening** patch, not the primary root fix. It helps if torii has cached the wrong schema version or if DB state is lagging. It does **not** solve selector-only historical versioning by itself.

#### 4. Low-confidence torii hardening: strict block-aligned schema reads

Torii already has a `strict_model_reader` switch, but it defaults to `false`. That means `register_model`, `upgrade_model`, `register_event`, and `upgrade_event` fetch schema at the provider's latest block unless strict mode is enabled.

This is worth testing, but it is not the main theory:

- force `set_block(BlockId::Number(ctx.block_number))` for historical replay
- or at least test cold replay with `strict_model_reader = true`

I consider this a lower-confidence hardening lever, not the main fix. It helps validate whether the reader is pulling an unexpected schema snapshot, but it does not address the selector-only versioning problem above.

#### 5. If logging shows the failing enum is not `PlayerActivityEvent`

Then stop optimizing around `PlayerActivityEvent` entirely and fix the schema/model that actually appears in the log.

That sounds obvious, but it matters because the original `PlayerActivityEvent` thesis was strong enough to bias implementation in the wrong direction. The next replay should be used to identify the exact failing processor + namespace/model/event combination before any parser patch is merged.

#### 6. If logging still points at `PlayerActivityEvent`

Then the problem is no longer "Pistols forgot to publish variant 18". The two realistic explanations become:

- torii is binding the wrong historical event schema version to the selector
- or there is a higher-level enum-deserializer bug in `dojo_types`

At that point the torii versioning fix above becomes the first code change I would try before touching `dojo_types`.

#### 7. Not recommended: generic "ignore unknown enum selector"

Do not apply a blanket parser patch that swallows unknown enum discriminants globally.

The reason is structural: once enum decoding accepts an unknown selector, torii no longer knows how many felts to consume for that variant payload. For unit variants this might appear harmless; for payload-bearing variants it can desynchronize the rest of the decode stream and create harder-to-debug corruption.

If a local workaround is needed, it should be narrow and model-specific.

#### 8. Last-resort local workaround

If we need to get a cold reindex through before the trigger bug is fixed upstream, a local torii patch could catch the exact logged deserialization failure and drop that historical event instead of rolling back the whole chunk.

That would trade correctness in the affected historical event stream for forward progress of the indexer, so it should be treated as an emergency workaround, not the preferred fix.

## Reference timeline

This is the compact reconstruction reference for recreating the bug across **torii**, **Pistols**, and **chain state**.

| Date / time | Project | Ref | Chain / block reference | Why it matters |
|---|---|---|---|---|
| `2024-11-14` | dojo/torii ancestry | `32196a67` | n/a | rollback path lands without cache invalidation |
| `2024-11-14` | dojo/torii ancestry | `45a0a650` | n/a | model/event upgrade path lands with immediate cache mutation |
| `2025-04-29` | torii | `v1.5.0` / `d392987f` | n/a | first standalone torii release carrying the latent rollback/cache bug |
| `2025-09-27 18:45:27 -03:00` | Pistols code | `b9840a17` | sepolia `2270000` -> old schema, `2272000` -> upgraded schema | `PlayerActivityEvent` first gains `EnlistedRankedDuelist` locally; chain confirms sepolia publishes it within this window |
| `2025-09-27 22:34:19 -03:00` | Pistols deploy | `4712654a` (`migrate sepolia`) | sepolia `2270000` / `2272000` | best sepolia replay bracket for the actual event-schema transition |
| `2025-09-29 18:07:42 -03:00` | Pistols deploy | `9a3171a1` (`migrate mainnet`) | mainnet later confirmed upgraded by `2831000` | early mainnet deployment point for the same era |
| `2025-09-30` | torii | `v1.7.3` / `0155915d` | n/a | hazard already present before Pistols starts seeing it |
| `2025-10-06` | torii | `v1.7.5` / `e0ba3fc5` | n/a | verified locally to have the same rollback/cache bug as HEAD |
| `2025-10-08` | torii | `v1.8.0` / `dffb1c36` | Dojo pin `6daa3d0` | mainnet continuous indexing still not visibly poisoned |
| `2025-10-09` | torii | `v1.8.1` / `053de409` | Dojo pin `711cb72` | first version that bites cold re-indexes in user reports |
| `2025-10-09 13:25:29 UTC` | chain check | mainnet `2831000` | event resource `0x05d875a0…` | proves `PlayerActivityEvent` variant `18` is already live on mainnet before the later replay window |
| `2025-10-15 17:20:37 -03:00` | Pistols code | `bc5ad295` | sepolia `2560000` already includes variant `18` | adds `PlayerActivityEvent` variants `18`, `19`, `20` to the queue/activity rollout |
| `2025-10-15 15:13:41 -03:00` | Pistols deploy | `9cf55b97` (`migrate sepolia`) | sepolia `2560000` | replay anchor at the start of the queue/activity rollout |
| `2025-10-16 18:11:18 -03:00` | Pistols deploy | `beec5840` (`migrate mainnet`) | mainnet between `3000000` and `3050000` | replay anchor for mainnet rollout start |
| `2025-10-17 12:28:31 -03:00` | Pistols code | `59c9e266` | mainnet `3050000` | `DuelistAssignment.season_id` added |
| `2025-10-20 11:29:39 -03:00` | Pistols code | `6dc79473` | mainnet `3100000` | `Duelist.released_fame` added |
| `2025-10-20 16:30:17 -03:00` | Pistols code | `028e2893` | mainnet `3100000` | `MatchQueue.enlisted_duelist_ids` indexing added |
| `2025-10-20 18:31:51 -03:00` | Pistols code | `720655ce` | mainnet `3100000` | `PlayerActivityEvent` variant `21` added |
| `2025-10-22` | torii | `v1.8.7` / `21031a24` | n/a | user still reproduces poisoned cold indexes here |
| `2025-10-22 14:27:30 -03:00` | Pistols deploy | `d0c79771` (`migrate sepolia`) | sepolia `2640000` | good sepolia replay point inside the poisoned-model rollout |
| `2025-10-22 14:50:20 -03:00` | Pistols deploy | `871b572f` (`migrate mainnet`) | mainnet `3150000` | good mainnet replay point inside the poisoned-model rollout |
| `2025-10-28 16:52:32 UTC` | user log | mata executor errors | sepolia `2710000`, mainnet `3210000` are nearby replay anchors | first concrete multi-column poisoned-DB log captured in this investigation |
| `2026-02-17` | torii | `v1.8.15` / `2193fc5d` | Dojo pin `0afeb1bc` | local HEAD checked during this research; bug still present |

### Minimal reproduction map

For a developer starting fresh, the shortest useful sequence is:

1. verify the rollback/cache bug locally in torii with a deterministic test
2. reproduce the historical chain side around:
   - sepolia `2270000` / `2272000` for the `PlayerActivityEvent` schema transition
   - sepolia `2560000`, `2640000`, `2710000` for the cold-replay failure window
   - mainnet `3050000`, `3100000`, `3150000`, `3210000` for the corresponding mainnet rollout window
3. run one instrumented cold replay and record:
   - failing processor
   - namespace / model / event
   - raw keys / values
   - block number
4. if the failure is in `EventMessageProcessor`, test the selector-only historical event-schema versioning theory first
5. if the failure is in a store-update processor instead, pivot to the concrete enum-at-`18` model types listed above

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

1. Pin Slot torii config to `blocks_chunk_size ≤ 1024` for **fresh** Sepolia indexes. Already verified by mataleone to avoid the column-loss path on local indexes.
2. Avoid `delete + create` of the indexer when an upgrade chunk has already been observed to fail. The mainnet DB that survived from before 1.8.1 is the cleanest thing we have; we should not throw it away.
3. If we hit the missing-column state again, use the repair procedure above. The important invariant is: fix the table DDL, not the `models.schema` JSON.
4. Once a fix is merged upstream, redeploy on a torii ≥ that version and re-index sepolia from genesis.

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
