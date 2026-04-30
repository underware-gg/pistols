# shaping

The process of building. Mutable but historicized — once a doc reaches a terminal status (`implemented` or `deprecated`) it is frozen.

## Subfolders

- **[`design/`](./design/)** — what we're building and why. Topic-numbered (mutable). Index lives in `design/README.md`.
- **[`plans/`](./plans/)** — how we're going to build it. Chronologically numbered (append-only). Index lives in `plans/README.md`.
- **[`research/`](./research/)** — external/upstream investigations that inform designs but don't drive code directly. Topic-named, point-in-time. Index lives in `research/README.md`.
- **[`wip/`](./wip/)** — current working state: status, changelog, transient tasks.

## How shaping relates to the system

When a plan reaches `status: implemented`, durable knowledge migrates from the design doc into [`../system/`](../system/). The design and plan stay where they are as historical context; `system/` becomes the canonical "what the system is" reference.

See [`../../AGENTS.md`](../../AGENTS.md) for the full lifecycle, sync rules, and immutability constraints.
