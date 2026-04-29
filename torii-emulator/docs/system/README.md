# system

The as-built artifact. What the system *is* — kept in sync with code.

System docs are mutable and reference each other freely. They use lighter frontmatter than shaping docs (no `status`):

```yaml
---
title: "..."
last-verified: YYYY-MM-DD   # date confirmed against current code
version: 0.X.Y              # SEMVER it describes
---
```

If `last-verified` is stale, treat the doc with suspicion.

Use [`template.md`](./template.md) as the starting point for a new system doc.

## Subfolders

- **[`architecture/`](./architecture/)** — explanation: component boundaries, data flow, sequence diagrams, deployment topology. The "how it fits together" view.
- **[`reference/`](./reference/)** — lookup: wire format implemented, sqlite schema, config keys, CLI commands. The "what it is" view.
- `ops/` *(future)* — runbooks, deployment, debugging. Added when there's something to operate.

No number prefixes inside `architecture/` or `reference/`; navigate via each folder's `README.md`.

## Lifecycle

System docs land or update as part of plan completion. See the lifecycle section in [`../../AGENTS.md`](../../AGENTS.md) and the `## Implementation docs` checklist in each plan.
