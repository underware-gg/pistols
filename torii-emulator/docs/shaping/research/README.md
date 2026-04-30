# research

External and upstream investigations that inform our designs but don't themselves drive code. Bug post-mortems on dependencies we rely on, breakdowns of upstream protocols, benchmarking notes, comparative reads of competitor systems — anything we needed to understand at a point in time so a design could make a sound call.

## Conventions

- **Topic-named, no numeric prefix.** e.g. `torii-skipped-model-upgrades.md`, `katana-vrf-deployability.md`. Numbers would suggest ordering or rank; research has neither.
- **Frontmatter** is lighter than design/plans:
  ```yaml
  ---
  title: "..."
  kind: research
  date: 2026-04-30        # when the investigation was performed
  informs: [00, 04]       # optional — design IDs this informed (no reverse link required)
  ---
  ```
- **Snapshots, not living docs.** A research doc captures what was true / what we knew when it was written. If new findings supersede it, write a follow-up doc and link back, rather than rewriting history. Small fixes (typos, broken links) are fine in place.
- **Outside the design↔plan sync graph.** Designs may cite research; research need not be cited back. Adding or editing research does not require updating any design.
- **Cite primary sources.** Commit hashes, line numbers, version tags, GitHub PRs, Discord excerpts — whatever lets a future reader verify the claim. Where commit hashes appear, also note the version they shipped in.

Research is not a place for personal notes or speculation. If a finding isn't yet backed by primary-source evidence, leave it out (or mark it explicitly as a hypothesis under a `## Open questions` heading).

## Index

| Title | Date | Informs |
|-------|------|---------|
| [Torii skipped-model-upgrade bug](./torii-skipped-model-upgrades.md) | 2026-04-30 | 00, 04 |
