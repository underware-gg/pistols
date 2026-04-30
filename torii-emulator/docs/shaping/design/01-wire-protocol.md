---
title: "Wire protocol"
status: draft
plans: []
---

# 01 — Wire protocol

> **Frozen when `status` is `implemented` or `deprecated`.** To change shipped behavior, supersede this with a new design and link the replacement here. Day-to-day truth about how the system works lives in [`../../system/`](../../system/).

## Context

The Pistols client uses a small, well-defined subset of the [torii](https://github.com/dojoengine/torii) interface. Our server must speak exactly this subset at the wire level — no client code changes — but everything else can be omitted.

We pin against torii **v1.8.0** (the version the Pistols SDK pins via `@dojoengine/{core,sdk,torii-client,utils}@1.8.0`; see `../../../../sdk/package.json` and `../../../../pnpm-workspace.yaml`). Wire-format internals (proto definitions, gRPC server impl, sqlite migrations, CORS handling) should be verified against the upstream torii repo at [https://github.com/dojoengine/torii](https://github.com/dojoengine/torii) — read code there, or via a local clone if you have one (see `AGENTS.local.md`).

Source-of-truth research is the v1.8.0 torii crate inventory and the Pistols client/SDK call-site inventory done 2026-04-30.

## Goals

- Cover every torii surface the Pistols client actually uses.
- Match wire formats exactly: gRPC-Web with proper trailers, `/sql` contract (raw body, JSON array response), CORS that browsers will accept.
- Behave identically enough that the SDK does not need patching.

## Non-goals

- Implementing the full torii RPC surface. Out-of-scope methods return `unimplemented` and we trust the client doesn't call them.
- Supporting multiple worlds. Pistols-only world filter.
- GraphQL parity. The client only uses GraphQL for token data; that path is replaced by `/sql` or stubbed.

## Detail

### gRPC service (priority P0–P1)

The client calls a small subset of the `world.World` service. Required methods:

| RPC | Used for | Priority |
|---|---|---|
| `Worlds` | Schema bootstrap on connect — returns registered models | P0 |
| `RetrieveEntities` | Bulk entity fetch (Challenge, Pact, Player, Duelist, …) | P0 |
| `SubscribeEntities` + `UpdateEntitiesSubscription` | Live entity updates | P0 |
| `RetrieveEventMessages` | Historical events (e.g. `LordsReleaseEvent`) | P1 |
| `SubscribeEventMessages` + `UpdateEventMessagesSubscription` | Live event stream | P1 |
| `RetrieveTokenBalances` | Token balances at startup | P0 |
| `SubscribeTokenBalances` + `UpdateTokenBalancesSubscription` | Live balance updates | P0 |

All other RPCs (`RetrieveTransactions`, `SubscribeTransactions`, `RetrieveControllers`, `RetrieveAggregations`, `RetrieveActivities`, `PublishMessage`, `ExecuteSql`, …) return `unimplemented` and are not exercised by the Pistols client.

### HTTP endpoints (priority P0)

- `POST /sql` — body is raw SQL (Content-Type ignored), response is `application/json` array of objects, one per row. Pistols has six-plus direct call sites: status checks, season totals, duelist stats, ring eligibility, token balances, lords release events.
- `GET /` — text health check polled by SWR.

### HTTP endpoints (skip)

- `/graphql` — only used for token data; route via `/sql` or return 404.
- `/mcp`, `/metadata/reindex/*`, static asset proxy: not needed.

### Wire-format invariants

These will bite if missed. Verify against the upstream torii source when implementing.

- **gRPC-Web with proper trailers** (`grpc-status`, `grpc-message`). Must use `tonic` + `tonic-web`; vanilla `tonic` won't work for browsers. (See torii's `crates/server/src/proxy.rs`.)
- **CORS** must echo `application/grpc-web+proto`, `x-grpc-web`, `x-grpc-timeout`, `x-user-agent`, etc. and expose `grpc-status`, `grpc-message`, `grpc-status-details-bin`, `grpc-encoding`. (See torii's `proxy.rs:51-71`.)
- **Felt encoding**: 32-byte big-endian on the wire; `0x`-prefixed lowercase 64-nybble hex in SQL columns.
- **Tag format**: `namespace-Model` (single hyphen, e.g. `pistols-Challenge`), used both as `Query.models[]` entries and as quoted SQLite table names.
- **`Query.no_hashed_keys`, `Query.historical`, cursor-based pagination**: empty cursor = start; empty `next_cursor` = done.
- **`Model.schema` BLOB** must round-trip through `dojo-types`'s `Ty` deserializer — produce it from the Cairo manifest at startup using `dojo-types`, not hand-rolled JSON.

## Decisions

### Open

- _2026-04-30_: GraphQL — return 404 on `/graphql` and rely on `/sql` for everything, vs. ship a minimal GraphQL stub for token queries. Lean: 404 first; add stub only if the client breaks.
- _2026-04-30_: Use stock `tonic-web`, vs. fork it to handle Pistols' exact CORS/trailer expectations. Lean: stock `tonic-web`.

### Closed

_None yet._

## Plans

_None yet — see [`02-data-model`](./02-data-model.md) and [`03-indexer`](./03-indexer.md) for related designs that will share initial plans._
