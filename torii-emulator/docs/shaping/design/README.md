# design

What we're building and why. Mutable but historicized.

## Conventions

- One file per concern. Numbered by topic group (e.g. `01-wire-protocol.md`), **not** chronology — numbers may be reorganized as the architecture evolves.
- Frontmatter: `status` (draft | shaping | implemented | deprecated), `plans:` (numbers).
- Decisions tracked inline (`Open` / `Closed`); no separate ADRs.
- Once `status` is `implemented` or `deprecated`, the doc is frozen. To change shipped behavior, supersede with a new design and link it here.
- Each design lists the plans that implement it. Plans link back. Both ends must agree.

Use [`00-template.md`](./00-template.md) as the starting point for a new design.

## Index

| ID | Title | Status | Plans |
|----|-------|--------|-------|
| 00 | [Overview](./00-overview.md) | draft | _none_ |
| 01 | [Wire protocol](./01-wire-protocol.md) | draft | _none_ |
| 02 | [Data model](./02-data-model.md) | draft | _none_ |
| 03 | [Indexer](./03-indexer.md) | draft | _none_ |
| 04 | [State seeding](./04-state-seeding.md) | draft | _none_ |
| 05 | [Onchain boundary](./05-onchain-boundary.md) | draft | _none_ |
| 06 | [Deployment](./06-deployment.md) | draft | _none_ |
