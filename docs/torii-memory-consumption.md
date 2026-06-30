# Torii Server Memory Consumption

How RAM behaves on a running Torii server, what makes it grow, and how to provision for it.

> Defaults below are verified against `crates/cli/src/options.rs` and `crates/sqlite/sqlite/src/constants.rs`.

## The mental model

Torii's resident memory (RSS) is the sum of four pools, and only some of them grow over time:

```
RSS ≈  SQLite engine  +  indexer in-flight buffers  +  subscription state  +  unbounded caches
       (bounded, ~1GB)   (bounded by chunk sizes)      (scales w/ clients)    (slow creep)
```

The headline: **the database file is *not* loaded into RAM.** A 50 GB Torii DB does not need 50 GB of RAM. SQLite reads pages on demand and keeps only a working set cached. Memory does **not** track DB size — it tracks your *access pattern* and *concurrency*. Provision **disk** for DB size, not RAM.

## 1. SQLite engine — dominant, mostly-bounded cost

Verified defaults (`crates/cli/src/options.rs`):

| Setting | Default | What it means for RAM |
|---|---|---|
| `--sql.cache_size` | `-500000` | **~500 MB page cache, *per connection*** (negative = KiB) |
| `--sql.mmap_size` | `256 MB` | memory-mapped DB window (file-backed, reclaimable by OS) |
| `--sql.soft_memory_limit` | `1 GB` | **process-wide soft ceiling** — SQLite reclaims page cache when crossed |
| `--sql.hard_memory_limit` | `0` | disabled by default |
| `--sql.wal_autocheckpoint` | `10000` pages (~40 MB) | WAL flushed back to main DB |
| `--sql.page_size` | `4096` | DB page size |
| `--db.readonly.max_connections` | `100` | upper bound on concurrent read connections |

The critical interaction: **`cache_size` is per-connection**, and the readonly pool can open up to `max(max_connections, query_threads*2)` connections. Naively that's 100 × 500 MB. What saves you is **`soft_memory_limit` (1 GB)** — a process-wide `sqlite3_soft_heap_limit` that forces cache eviction when crossed, so total page-cache RAM is effectively capped near 1 GB regardless of connection count. The write pool is a single connection.

**SQLite baseline ≈ soft_memory_limit (1 GB cap on page caches) + mmap window (≤256 MB, file-backed) ≈ up to ~1.2 GB steady-state under load.**

**Does DB size count?** Only indirectly. A bigger DB means a bigger *potential* working set, but you're still capped by the soft limit. The DB *file* lives on disk.

## 2. Indexer ingestion — bounded by chunk sizes

During sync the fetcher holds in-flight blocks/events in memory (`crates/indexer/fetcher`):

- `blocks_chunk_size` (10240), `events_chunk_size` (1024), `batch_chunk_size` (1024)
- A `BTreeMap` of the current fetch range plus per-tx `Vec<Event>` is held until the processor drains it.

Transient and bounded by chunk sizes — typically tens of MB per batch. Spikes during initial catch-up / historical sync, settles once at chain tip. Ragged edge: a single transaction emitting a huge number of events grows its event Vec unbounded (pathological).

**Implication:** initial indexing from genesis uses more memory than steady-state tip-following. Provision for the catch-up peak.

## 3. Subscriptions — scales with *clients*, not data

Each gRPC/GraphQL subscription is a row in a `DashMap` with:
- a channel buffered to `--grpc.subscription_buffer_size` = **16384 messages**, and
- per-subscriber filter sets (`contract_addresses`, `account_addresses`, `token_ids` as HashSets).

The broker **clones each update to every subscriber** (`crates/broker/src/memory.rs`):

```
subscription RAM ≈ N_subscribers × (buffered_messages × msg_size + filter_set_size)
```

- A few hundred subscriptions: negligible.
- Thousands of concurrent subscriptions: linear and visible — especially with **slow consumers**, because the 16K-message buffer fills before being drained. A stalled client can pin ~16K cloned messages.
- High-cardinality filters (tens of thousands of token IDs) inflate per-subscriber state.

**This is the main "grows with usage" axis if you expose public subscriptions.** Mitigate by lowering `subscription_buffer_size` and bounding subs per client at your proxy.

## 4. Simple queries — per-request, then freed

GraphQL/SQL queries are **not streamed** — `fetch_all()` loads the whole result set into a Vec (`crates/sqlite/.../query.rs`), capped by `SQL_DEFAULT_LIMIT = 10000` rows. One query = up to ~10k rows × row size, transiently, then dropped. High query *volume* drives concurrency (more active connections → more page cache touched → pushes toward the soft limit), but each query's own allocation is short-lived. Queries cause no permanent growth.

## 5. Slow-creep risks (genuine unbounded growth)

Watch these on a long-lived server:

- **`ContractClassCache`** (`crates/cache`) — contract ABIs fetched on demand, `HashMap` with **no eviction**. Grows with distinct contracts ever touched. Usually bounded in practice, unbounded in principle.
- **`token_id_registry`** (ERC cache) — one entry per ERC token ever indexed, persists across cycles. Grows with token universe — relevant for NFT collections with huge ID spaces.
- ERC *diff* maps (`balances_diff`, `total_supply_diff`) are cleared after each commit — cyclical, not leaks.

On a typical Dojo-game world these stay small. On a server indexing large ERC721/1155 contracts they can creep over weeks.

## Provisioning recommendation

**Baseline: ~2 GB RAM** for a normal Torii instance.
- ~1–1.2 GB SQLite engine (page cache soft cap + mmap)
- a few hundred MB indexer/runtime
- headroom for query/subscription concurrency

Scale up based on your real driver:

| If you... | Add for | Tune |
|---|---|---|
| Index from genesis / large history | catch-up spike | lower `--indexing.blocks_chunk_size` |
| Serve many concurrent subscriptions | N × buffer | lower `--grpc.subscription_buffer_size`, cap subs at proxy |
| Run on a small box | hard ceiling | lower `--sql.soft_memory_limit`, enable `--sql.hard_memory_limit` |
| Have a huge DB | **disk, not RAM** | mmap/cache already bounded |

Knobs to right-size a small server:

```
--sql.cache_size -200000             # ~200MB per-conn cap instead of 500MB
--sql.soft_memory_limit 536870912    # 512MB process soft cap
--sql.mmap_size 134217728            # 128MB mmap window
--grpc.subscription_buffer_size 4096
--db.readonly.max_connections 20     # if you don't need 100
```

Watch RSS over a week. Healthy pattern: a high plateau during initial sync, settling to a stable steady-state at chain tip. A slow continuous climb at tip points at subscription leakage (slow clients) or the ABI/token caches — confirm against the `process_resident_memory_bytes` metric Torii exposes.
