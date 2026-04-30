# Torii skipped-model-upgrade bug — confirmed report

**Date:** 2026-05-01

## Preamble

In **Oct 2025**, fresh torii recreates for Pistols on **Sepolia** began returning missing-column failures. On **2025-10-10**, mataleone reported that `pistols-Config.realms_address`, added two weeks earlier, was absent from the SQL schema, and gRPC entity reads were failing with `no such column: pistols-Config.realms_address`. The same missing-column symptom was also seen on cold-indexed **mainnet** torii recreates. In **Dec 2025**, the last previously working mainnet torii was cold-reindexed. From the outside, the issue presented as torii recreates dropping columns during replay. This report explains the confirmed cause, the exact historical replay window, the local repro, and the torii patch that now gets the known Pistols path through cleanly.

As of **2026-05-01**, we did not have a working upstream fix for this blocking issue, so we conducted our own investigation. That investigation reproduced the stale-schema failure on unpatched **torii `1.8.7`**, captured the exact historical trigger, identified the root cause of both the replay failure and the poisoned-DB state, and confirmed a working local fix against the patched torii **`v1.8.15`** source tree by replaying the bad Sepolia window cleanly. We can make the local patch available on request.

## TL;DR

Two latent torii bugs combine on cold replay: a task/dependency merge bug that produces `InvalidEnumSelector { actual_selector: 18 }`, and a rollback/cache divergence bug that silently skips `ALTER TABLE` on retry. Both have existed in every torii release since `v1.5.0` (April 2025). A four-part patch against `v1.8.15` closes both and replays the Sepolia incident window cleanly.

## What the issue is

The failure is the interaction of **two latent torii bugs** that combine on cold replay.

**Bug 1 — historical-event task/dependency bug.** In torii's `TaskManager` and `TaskNetwork`, when earlier same-player events have already created a historical replay task before an `EventUpgraded` lands, later post-upgrade events for that same player are appended to the existing task without acquiring the selector-upgrade dependency. The task then deserialises later events against the old cached schema. This produces a `PrimitiveError(InvalidEnumSelector)` whenever a payload uses a discriminant that only exists in the post-upgrade schema.

**Bug 2 — rollback/cache divergence bug.** When a chunk fails after a `ModelUpgraded` has been processed, the queued SQL (`ALTER TABLE …`) is rolled back but the in-memory model cache is not. On retry, `UpgradeModelProcessor` reads the post-upgrade schema from the poisoned cache, sees no diff against the chain schema, and silently skips the `ALTER TABLE`. The result: torii's schema metadata reports the field exists while the SQLite table is missing the column.

The captured trigger payload is the `pistols-matchmaker` `PlayerActivityEvent` at **Sepolia block `2271871`**, with `activity = 18` (`EnlistedRankedDuelist`). The `EventUpgraded(PlayerActivityEvent)` (block `2270724`) and `ModelUpgraded(Config)` events both fall inside the same default-chunked replay window with `blocks_chunk_size = 10240`, so the rollback discards `Config`'s queued `ALTER TABLE` and the cache poison ensures the retry never re-issues it. That is exactly how `Config.realms_address` and the later Oct 2025 fields were lost.

The hazard has been latent in every torii release since **v1.5.0 (2025-04-29)** — it traces back to two `dojoengine/dojo` monorepo commits both in tree by **2024-11-14**. It only became user-visible on Pistols when cold replay under torii ≥ `v1.8.1` first hit a deserialize failure inside the same chunk as a model upgrade. Mainnet's continuous indexers under torii ≤ `v1.8.0` never tripped the trigger payload inside an upgrade chunk, which is why the bug stayed invisible there until cold-recreate time.

## How to fix it

The local torii patch — applied on top of torii `v1.8.15` and validated against the Sepolia trigger window — has four parts:

1. **`TaskManager::add_parallelized_event_with_dependencies`** merges newly discovered dependencies into an existing task instead of only appending the event.
2. **`TaskNetwork`** retains unresolved dependencies and activates them once the prerequisite task is inserted, instead of dropping them as "non-existent".
3. **Engine rollback handling** clears `models` and `balances_diff` cache state.
4. **Processors** read model definitions via `ctx.storage.model(...)` rather than `ctx.cache.model(...)`, so rollback-time cache clears can repopulate from committed sqlite instead of failing with `CacheError(ModelNotFound(...))`.

Parts (1) and (2) close the trigger bug. Parts (3) and (4) together close the rollback/cache divergence bug — bare cache-clearing on rollback is not enough on its own, because processors then fail to find model definitions in the empty cache.

The patch was validated by replaying the Sepolia incident window from a pre-critical head. The replay crosses the captured failing block (`2271871`) cleanly, lands `Config.realms_address` and `PlayerActivityEvent.EnlistedRankedDuelist` in the DB, and continues storing `PlayerActivityEvent` rows from `pistols-matchmaker` without `InvalidEnumSelector`.

## Key fixes

The substantive runtime changes, applied on top of torii `v1.8.15`:

**`crates/indexer/engine/src/engine.rs`** — clear commit-sensitive cache state on chunk rollback (lines 236-237 in the modified file):

```diff
                  self.storage.rollback().await?;
+                 self.cache.clear_balances_diff().await;
+                 self.cache.clear_models().await;
                  self.task_manager.clear_tasks();
```

**`crates/processors/src/task_manager.rs`** — `TaskManager::add_parallelized_event_with_dependencies` (around line 105): when the task already exists, merge newly-discovered dependencies into it after appending the event, instead of silently dropping them:

```diff
                     task_data.events.push(parallelized_event);
                 }
             }
+
+            if let Err(e) =
+                self.task_network.add_dependencies(task_identifier, dependencies.clone())
+            {
+                error!(
+                    target: LOG_TARGET,
+                    error = ?e,
+                    task_id = %task_identifier,
+                    dependencies = ?dependencies,
+                    "Failed to add dependencies to existing task."
+                );
+            }
         } else {
```

**`crates/task-network/src/lib.rs`** — adds a `pending_dependents: HashMap<K, HashSet<K>>` to `TaskNetwork`, plus `add_dependency_or_defer` and `resolve_pending_dependents` helpers. Dependencies whose prerequisite task does not yet exist are now deferred and resolved when the prerequisite is added, instead of being silently dropped. ~114 lines of additions. New tests: `test_late_dependency_becomes_active`, `test_add_dependencies_to_existing_task`.

**Processor model lookups** — replace `ctx.cache.model(...)` with `ctx.storage.model(...)` across `event_message.rs:84`, `store_set_record.rs:76`, `store_update_record.rs:82`, `store_update_member.rs:87`, `store_del_record.rs:74`, `upgrade_event.rs:64`, `upgrade_model.rs:62`. Storage is cache-first-then-DB, so when rollback empties the cache the next read repopulates from committed sqlite instead of throwing `CacheError(ModelNotFound(...))`. The pattern in each file is identical:

```diff
-        let model = match ctx.cache.model(ctx.contract_address, event.selector).await {
+        let model = match ctx.storage.model(ctx.contract_address, event.selector).await {
             Ok(m) => m,
-            Err(CacheError::ModelNotFound(_)) if !ctx.config.namespaces.is_empty() => {
+            Err(_) if !ctx.config.namespaces.is_empty() => {
```

The diagnostic instrumentation used during the investigation to capture the trigger payload is not part of the runtime fix — see [Patched replay → Diagnostic instrumentation](./torii-skipped-model-upgrades.md#diagnostic-instrumentation) in the research doc for the full diffs.

We can make the local patch available on request.

## Operational notes

- **Unpatched torii cold indexes**: pin `blocks_chunk_size ≤ 1024`. This separates the offending event from the model upgrade into different chunks and avoids the schema-poison path locally. It is a workaround, not a fix — the underlying hazard is still latent on any future error inside an upgrade chunk.
- **Already-poisoned DB**: the SQLite table can be repaired manually with one `ALTER TABLE … ADD COLUMN` per missing flattened column. The `models.schema` JSON is already in the desired end state and should not be edited. The repair only addresses additive `ModelUpgraded` diffs.
- **Indexer stays "alive" while poisoned**: row-level executor failures are logged asynchronously and do not stop the main loop, so a poisoned torii can continue advancing cursors while silently dropping writes and serving broken reads. Do not assume "still indexing" means "still healthy".

## Where the full investigation lives

For implementation detail, evidence, and procedures, see the companion research doc [`torii-skipped-model-upgrades.md`](./torii-skipped-model-upgrades.md):

- **[Research brief](./torii-skipped-model-upgrades.md#research-brief)** — what was known going into the investigation
- **[Root cause walk-through](./torii-skipped-model-upgrades.md#root-cause-walk-through)** — line-by-line code trace of the rollback/cache poison mechanism
- **[When the bug was introduced / made visible](./torii-skipped-model-upgrades.md#when-the-bug-was-introduced--made-visible)** — origin in the dojo monorepo, earliest tagged release, and what changed in v1.8.x
- **Trigger investigation** — task/dependency mechanism, supporting code paths, world-event chain reads (in `## Trigger investigation` of the research doc)
- **[Patched replay: trigger captured and fix confirmed](./torii-skipped-model-upgrades.md#patched-replay-trigger-captured-and-fix-confirmed)** — captured trigger log, chain follow-up, the four-part patch, and the validation replay
- **[Repairing a poisoned DB](./torii-skipped-model-upgrades.md#repairing-a-poisoned-db)** — manual SQL recovery procedure for an already-poisoned DB
- **[Pistols-side mitigations until upstream is fixed](./torii-skipped-model-upgrades.md#pistols-side-mitigations-until-upstream-is-fixed)** — operator workarounds and redeploy plan
- **[Reference timeline](./torii-skipped-model-upgrades.md#reference-timeline)** — chronological reconstruction across torii, Pistols code, deploys, and chain state
- **[Appendix A — Source material](./torii-skipped-model-upgrades.md#appendix-a--source-material)** — Discord pastes, log captures, and config files the investigation entered with (`S1`–`S10`)
- **[Appendix B — Investigation branches ruled out](./torii-skipped-model-upgrades.md#appendix-b--investigation-branches-ruled-out)** — eight theories considered during the investigation and the evidence that closed them off (`R1`–`R8`)
- **[Appendix C — Alternative and rejected fix approaches](./torii-skipped-model-upgrades.md#appendix-c--alternative-and-rejected-fix-approaches)** — eight fix directions considered but not chosen, including open hardening directions and explicit "do not do this" callouts (`F1`–`F8`)
