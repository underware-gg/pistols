# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Pistols at Dawn** — a fully on-chain duelling game built with [Dojo](https://www.dojoengine.org/) on Starknet. This is a pnpm + turbo monorepo combining Cairo smart contracts with TypeScript packages.

## Repository layout

| Path        | Language   | Purpose |
|-------------|------------|---------|
| `/dojo`     | Cairo      | Game contracts (Dojo world: models, systems, ERC20/ERC721 tokens). The source of truth for game logic. |
| `/sdk`      | TypeScript | `@underware/pistols-sdk` — shared library (Dojo bindings, hooks, stores, token logic) consumed by clients and bots. Published to npm. |
| `/client`   | TypeScript | `@underware/pistols-at-dawn` — the game web client (Vite + React + Three.js). |
| `/dreams`   | TypeScript | Daydreams AI agents (currently disabled in `pnpm-workspace.yaml`). |
| `/verifier` | scripts    | Starkscan/Voyager contract verification scripts. |
| `/gamejam`  | —          | Original Game Jam #3 contents (archival). |

The TS workspace is `sdk`, `client`, `verifier` (see `pnpm-workspace.yaml`). The Cairo workspace has one member, `dojo` (see root `Scarb.toml`). Shared TS dependency versions are pinned in the `catalog:` section of `pnpm-workspace.yaml` — reference `catalog:` in package.json rather than hardcoding versions.

## Toolchain

Versions are pinned in `.tool-versions` (managed via `asdf`): `scarb 2.13.1`, `sozo 1.8.7`, `katana 1.7.1`, `torii 1.8.16`, `starkli 0.4.2`. Node `>=22`, `pnpm@10.20.0`, and `turbo` (global). See README.md for full environment setup.

## Common commands

### TypeScript (run from repo root)
```sh
pnpm install              # install all workspace deps
turbo devs                # run client dev server over HTTPS (https://localhost:5173) — preferred, required for Cartridge Controller
turbo dev                 # run client dev server over HTTP (no Controller support)
turbo build               # build all packages (sdk builds first via ^build)
turbo check-types         # typecheck all packages
turbo lint                # lint all packages
pnpm test                 # runs sdk vitest (alias for `cd sdk && pnpm test`)
```

Per-package (run inside `client/` or `sdk/`): `pnpm build`, `pnpm sync` (tsc/tsup watch), `pnpm test`, `pnpm test:watch`, `pnpm check-types`, `pnpm lint`. The `sync`/`devs` turbo tasks run persistent watchers across packages.

### Cairo / Dojo (run from `dojo/`)
```sh
sozo build                # compile the world
sozo test                 # run all Cairo tests
./test <filter>           # run a subset of tests: sozo test -f <filter>  (e.g. ./test test_duel)
./run_katana              # start local Katana node (chain KATANA_LOCAL, dev accounts, no fee)
./run_torii dev           # start Torii indexer for a profile
./migrate dev             # clean + build + migrate to a profile, then regenerate client artifacts
./migrate <profile>       # profiles: dev, sepolia, mainnet
```

To run a single Cairo test, use `./test <substring>` or `sozo test -f <substring>`.

## Architecture

### Dojo world (`/dojo/src`)

Everything is declared and wired through `dojo/src/lib.cairo` — when adding a module, register it there. Structure:

- **`models/`** — Dojo models (on-chain ECS state): `challenge` (duels/rounds/moves), `duelist`, `player`, `season`, `leaderboard`, `pack`, `pact`, `pool`, `ring`, `match_queue`, `config`. These define stored game state.
- **`systems/`** — `#[dojo::contract]` entrypoints. Key ones: `game` (commit/reveal duel moves — the core loop), `game_loop` (duel resolution logic), `matchmaker`, `bot_player`, `tutorial`, `admin`, `bank`, `community`, plus RNG/VRF providers (`rng`, `rng_mock`, `vrf_mock`).
- **`systems/tokens/`** — game assets as standard tokens: ERC721 (`duel_token`, `duelist_token`, `pack_token`, `ring_token`) and ERC20 (`fame_coin`, `fools_coin`, `lords_mock`). Built on reusable `systems/components/` (`coin_component`, `token_component`, `token_bound`).
- **`libs/`** — non-contract logic: `store` (typed read/write wrappers over `WorldStorage` — the standard way models are accessed), `game_loop`, `moves_hash`, `seeder`, `bot`, `tut`.
- **`types/`** — game value types incl. `types/cards/` (paces, tactics, blades, env, deck, hand) encoding the duel card mechanics; `duel_progress`, `challenge_state`, `rules`, `constants`.
- **`interfaces/`** — `dns` (cross-contract dispatch / contract discovery within the world), `ierc20`, `ierc721`, `vrf`.

Core game flow: players **commit** hashed moves then **reveal** them (`game::commit_moves` / `reveal_moves`); the duel is resolved deterministically in `game_loop` using seeded RNG. The `dns` interface is how systems locate and call each other inside the world.

Contracts to verify are enumerated under `[tool.voyager]` in `dojo/Scarb.toml`.

### Dojo → TS pipeline

`./migrate dev` is the bridge between Cairo and TypeScript. After building/migrating it:
1. copies the manifest into the SDK (stripping `models`/`events` nodes),
2. generates the Torii config from `torii_TEMPLATE.toml` (substituting deployed token addresses),
3. on `dev`: regenerates TS constants from Cairo source via `generate-constants` (`dojo/src` → `sdk/.../generated/constants.ts`), and optionally copies typescript bindings when `--bindings` is passed,
4. on Starknet profiles: regenerates the Cartridge controller preset.

So **Cairo is the source of truth**: game constants and bindings flow into the SDK by codegen, not by hand. Don't hand-edit generated files under `sdk/src/games/pistols/generated/`.

### SDK (`/sdk/src`)

`@underware/pistols-sdk` exposes many granular entrypoints (see `exports` in `sdk/package.json`): `./pistols`, `./pistols/gen` (generated bindings), `./pistols/constants`, `./dojo`, `./dojo/graphql`, `./dojo/sql`, `./starknet`, `./hooks`, `./utils`, `./abis`. Game-specific code lives under `sdk/src/games/pistols/`. Built with `tsup`. The client imports from these subpaths rather than reaching into `sdk/src`.

## Profiles & networks

Dojo profiles `dev` / `sepolia` / `mainnet` are declared in root `Scarb.toml` and configured in `dojo_<profile>.toml` (world address, RPC, account). Starknet deployments read account/key from `dojo/.env.sepolia` / `.env.mainnet` (`source` before migrating; `source .env.clear` to reset). The client selects a network via `VITE_NETWORK_ID` (`KATANA_LOCAL` / `SEPOLIA` / `MAINNET`) in `client/.env` — see README.md for the full env var list. Network definitions: `sdk/src/dojo/setup/networks.ts`.

## Documentation (`/docs`)

Operational/infrastructure notes (not API docs):
- `docs/torii-memory-consumption.md` — how RAM behaves on a running Torii server, what makes it grow, and how to provision (disk for DB size, ~1.2 GB RAM steady-state). Consult before tuning Torii deployment resources.

## Agent skills (`.agents/skills`)

The canonical skills live in **`.agents/skills/`** (the cross-tool location). Claude Code discovers skills under `.claude/skills/`, so `.claude/skills` is a symlink → `../.agents/skills`. Both the symlink and the skills are committed; edit skills in `.agents/skills/` (the symlink target), never duplicate them. To add a skill, create `.agents/skills/<name>/SKILL.md` — it appears under `.claude/skills/<name>/` automatically.

Each `SKILL.md` has `name` / `description` / `allowed-tools` frontmatter. Available skills (all Dojo workflow helpers — invoke when the task matches the description):

| Skill | Use when |
|-------|----------|
| `dojo-init`    | Starting a new Dojo project / initial structure |
| `dojo-config`  | Editing `Scarb.toml`, profiles, world settings, dependencies |
| `dojo-model`   | Defining models (game state, keys, trait derivations, ECS) |
| `dojo-system`  | Implementing systems (game logic, player actions, state changes) |
| `dojo-token`   | Implementing/deploying/indexing ERC20 & ERC721 tokens |
| `dojo-world`   | World permissions, namespaces, resource registration, access control |
| `dojo-test`    | Writing tests (`spawn_test_world`, cheat codes, assertions) |
| `dojo-deploy`  | Deploying to Katana/testnet/mainnet; starting local env |
| `dojo-migrate` | World migrations, breaking changes, version upgrades |
| `dojo-indexer` | Configuring Torii (GraphQL, gRPC subscriptions, SQL) |
| `dojo-client`  | Wiring frontends/game engines to the world; typed bindings |
| `dojo-review`  | Auditing models/systems/tests for best practices & security |

## Conventions (from .cursor/rules)

- **TS/React**: function components with `const` arrow functions and typed props; early returns; event handlers prefixed `handle`; keep code readable over clever.
- **Cairo/Dojo**: reference the [Dojo Book](https://book.dojoengine.org/) and [Cairo Book](https://book.cairo-lang.org/) for current APIs.
