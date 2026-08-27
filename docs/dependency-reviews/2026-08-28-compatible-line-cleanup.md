# Dependency Review: Compatible-line cleanup

## Summary

- Date: 2026-08-28
- Scope: take the newest compatible Node 22 types, React 18 types, and mkcert 1
  releases after completing the registry's headline outdated list.
- Classification: low-risk type and development-tool updates.

## Candidate Review

All candidates passed the repository gate before manifest changes: release age,
deprecation, lifecycle scripts, peer requirements, and advisories were checked.
Every dependency is already present at a satisfying reviewed version.

| Package | From | To | Age at review |
| --- | --- | --- | ---: |
| `@types/node` | 22.18.8 | 22.20.1 | 50 days |
| `@types/react` | 18.3.25 | 18.3.31 | 82 days |
| `vite-plugin-mkcert` | 1.17.9 | 1.17.12 | 140 days |

The Node and React type packages intentionally remain on the repository's Node
22 and React 18 runtime contracts. Mkcert remains on major 1 because major 2
raises its Node floor beyond the repository's declared minimum.

## Commands Run Before Manifest Changes

```sh
pnpm view '@types/node@^22' version --json
pnpm view '@types/react@^18' version --json
pnpm view 'vite-plugin-mkcert@^1.17.9' version --json
pnpm candidate @types/node@22.20.1 @types/react@18.3.31 vite-plugin-mkcert@1.17.12 --depth 1
```

## Outcome

- Resolution movement: 0 packages entered, 2 left, and 6 package names moved;
  the graph shrank from 843 to 841 packages.
- Mkcert 1.17.12 removed its Axios 1/proxy-agent branch. `agent-base@6.0.2` and
  `https-proxy-agent@5.0.1` left; Axios, `proxy-from-env`, and `csstype` each
  consolidated onto an already-reviewed retained version.
- The only new exact versions are the three reviewed direct candidates.
- Full workspace verification passed: dependency policy, frozen install,
  advisories, builds, types, lint, and all 48 tests.
