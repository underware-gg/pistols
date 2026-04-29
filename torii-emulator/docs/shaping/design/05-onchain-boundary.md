---
title: "Onchain boundary"
status: draft
plans: []
---

# 05 — Onchain boundary

> **Frozen when `status` is `implemented` or `deprecated`.** To change shipped behavior, supersede this with a new design and link the replacement here. Day-to-day truth about how the system works lives in [`../../system/`](../../system/).

## Context

"It wouldn't be onchain" is true from the user's perspective (no mainnet ops, no fees), but the architecture (see [`00-overview`](./00-overview.md)) keeps a private katana running. Some external services (Cartridge Controller, VRF) must remain real. This design lays out exactly what stays real, what gets stubbed, and what becomes mock.

Source-of-truth: 2026-04-30 inventory of every starknet/Cartridge touchpoint in the Pistols client.

## Goals

- Clear contract for every external touchpoint: KEEP (real), STUB (no-op or local), MOCK (server simulates), or RECONFIGURE (point at our infra).
- Zero changes to client code; configuration via existing env vars.

## Non-goals

- Replacing Cartridge Controller. We rely on it for session keys and message signing.
- Producing a deterministic-replay environment for QA. (Future concern.)

## Detail

### Stays real (KEEP)

- **Cartridge Controller iframe** at `controller.cartridge.gg`. Session-key management, message signing, transaction approval. We just point its RPC config at our katana instead of mainnet.
- **All Cairo contracts** for game systems (`game`, `game_loop`, `matchmaker`, `tutorial`, `duel_token`, `pack_token`, `bank`, `community`, `bot_player`, `admin`). Deployed to private katana, unchanged. Game logic remains in audited Cairo, not Rust.
- **ERC20 / ERC721 token reads** (balance checks, ownership). These run against katana via the existing client RPC path.
- **Message signing & verification** (CommitMove, GeneralPurpose, PlayerOnline). Controller signs; verification continues on-chain via Controller's `is_valid_signature`.
- **VRF** — *contingent*. See open decisions below.

### Reconfigured to point at our infra (RECONFIGURE)

- `VITE_RPC_URL` → our katana RPC.
- `VITE_TORII_URL`, `VITE_TORII_SQL_URL` → our emulator HTTP port.
- Add a new `ChainId` for the emulator network.
- Cartridge Controller's contract policies (`policies.ts`) regenerated with the new katana contract addresses; players will be re-prompted to authorize.

### Stubbed (STUB)

- Reveal Server (off-chain hint helper) — already optional.
- StarknetID lookups — return `null`.
- Cartridge achievements / inventory tabs — disable from UI or accept they show empty.
- Assets CDN — proxy locally or accept as-is.

### Mocked (MOCK)

- Controller `lookupAddresses()` (username display) — return `null` until we wire up a cache or stub. Display falls back to truncated address.
- Fee calculation reads (`calcMintFee`, `getEntryFee`) — could be hardcoded; lean toward keeping them on-chain since they're cheap.

## Decisions

### Open

- _2026-04-30_: VRF on private katana — does Cartridge's VRF deployment work against a private chain, or do we need a stub VRF contract that returns deterministic randomness? Spike required; this is the single biggest unknown for option 2's feasibility.
- _2026-04-30_: Controller paymaster behavior on private RPC — does it transparently work, or do we need to configure / disable paymaster?
- _2026-04-30_: Username service — implement a small caching service or accept blank usernames at launch.

### Closed

- _2026-04-30_: Cartridge Controller stays the source of identity and tx signing. Reason: re-implementing session keys is out of scope; Controller is happy talking to any starknet RPC.

## Plans

_None yet._
