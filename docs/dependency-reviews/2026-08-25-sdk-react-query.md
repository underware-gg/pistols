# Dependency Review: SDK async fetching onto react-query

## Summary

- Date: 2026-08-25
- Scope: convert the SDK's async fetch hooks from `useEffect` + `useState` to
  react-query, and enable `react-hooks/set-state-in-effect` for the SDK.

Twenty violations to zero: **fifteen converted, five kept with reasons.**

## Classification

- Elevated-risk. Rewrites the internals of twelve exported SDK hooks, one of
  which has sixteen call sites in the client.

## No new dependencies

`@tanstack/react-query` was already a peer and devDependency at 5.90.2, and
`QueryClientProvider` already wraps the app in `src/dojo/contexts/Dojo.tsx`, so
every converted hook has a client available on the normal consumption path.
Hooks used outside `DojoProvider` would not — none are.

`happy-dom`, `@testing-library/react` and `@testing-library/dom` were added to
the SDK at the versions the client already resolves, so **nothing entered the
tree**: `lockfile-diff --strict` reports 0 entered, 0 left, 0 moved.

## Published data fields are preserved

Existing data and loading fields remain, with explicit `isError`/`error` fields
added where RPC failures were previously indistinguishable from domain fallback
values. That constraint drove several decisions:

- `useSqlQuery` publishes `latency`, which react-query does not expose, so the
  `queryFn` returns `{ result, latency }` and the hook unwraps it.
- `useERC20TotalSupply`/`useERC20TokenName` returned `null` when invalid, so the
  results are `?? null` rather than left undefined.
- `useControllerUsernames` always returned a `Map`, so `data ?? new Map()`.
- `useApiGenerateControllerSalt` treated a non-positive result as an error rather
  than a value; `queryFn` throws so react-query records it the same way.

## Behaviour preservation over react-query's defaults

A plain `QueryClient` refetches on window focus and reconnect and retries three
times. An effect did none of that: once per dependency change, give up on error.
Adopting the defaults would have been a behaviour change smuggled in under a lint
fix — and for `useApiAutoReveal`, which **sends a reveal**, it would re-send the
request every time the tab regained focus.

So `src/utils/hooks/queryOnce.ts` disables retries and focus/reconnect refetching
without making ordinary reads permanently fresh. Inactive entries retain
TanStack's finite default lifetime and later mounts can observe the boundary
again. `ACTION_QUERY_ONCE` separately prevents remount refetches for auto-reveal.

## Query keys

react-query hashes keys with `JSON.stringify`. Two consequences:

- **Bigints.** `hashKey(['a', 1n])` throws *"Do not know how to serialize a
  BigInt"*, nested or not — verified directly. Every key carrying a
  `BigNumberish` stringifies it.
- **Non-serialisable values.** A provider, a contract instance and a connector
  cannot be hashed, so keys use what identifies them instead: `rpcUrl` for the
  starknetid provider, `provider.channel.nodeUrl` for `useContractClassHash`,
  `contractAddress` for the ERC20 contract, `connector.id` for the Controller.
- `useSdkCallPromise` assigns each function object a weak identity and preserves
  structured arguments in the key. `CairoCustomEnum` values include their active
  variant and payload; bigint values are normalized without collapsing objects
  to `"[object Object]"`.
- Account-bound API keys contain the effective account and chain/domain identity,
  so concurrent callers cannot share another wallet's salt or verification.
- SQL caches raw rows and applies `formatFn` per observer, allowing two consumers
  to request different output shapes for the same URL/query safely.

## The five that were not converted

These are effect-shaped by nature, and each carries an inline disable with the
reason:

| Hook | Why an effect is correct |
|---|---|
| `useMounted` | Setting state in an effect *is* the hook — a deliberate frame-skip so callers can dodge `reactStrictMode`'s double-invoked effects |
| `useTimestamp` | A clock. Wall-time is not derivable from props or state |
| `useUserHasInteracted` | Polls `navigator.userActivation`, unreadable during render and changing outside React's knowledge |
| `usePlayerId` | Reads and seeds `localStorage`, which must not be written during render |
| `useMemoAsync` | Generic "run an async thing when these deps change" with an opaque `DependencyList`. No stable serialisable key exists, and deriving one from `String(dep)` would collide across distinct objects |

`useMemoAsync` is the one worth restating: it is `useEffect`-shaped by design, and
forcing it into a query would have meant inventing a key. Option 2 fits concrete
fetches; it does not fit a generic async runner.

## Testing, and a gap I had to close first

Refactoring twelve hooks with no way to test them would have repeated the mistake
this ordering was meant to avoid, so the SDK got a DOM. Two faults surfaced:

- The SDK's vitest had **no `src` path alias**, so any test importing a module
  that uses the SDK's own `src/...` imports failed to resolve. Every existing SDK
  test used relative imports, which is why it had never shown up.
- Hook tests need a DOM; the rest of the suite should not pay for it. Environment
  stays `node`, and hook tests opt in per file with
  `// @vitest-environment happy-dom`.

Seven tests now cover `useSdkCallPromise`, including enabled/disabled transitions,
Cairo enum key isolation, bigint arguments and explicit RPC failure state. Two
API-hook tests cover account/domain cache isolation, and the SQL hook test proves
that different formatters share only raw rows rather than formatted output.

Controller API boundary tests also pin HTTP and error-payload failures as rejected
requests rather than valid-looking boolean or zero sentinels.

## Release Age / Advisory Review / Lifecycle Scripts

No package versions changed, so the age gate is not engaged and no install
script entered. `pnpm audit` unchanged: one accepted low (`elliptic`).

## Commands Run

```sh
npx eslint src --rule '{"react-hooks/set-state-in-effect":"error"}'   # 20 -> 0
npx tsc --noEmit -p tsconfig.json
pnpm install && node scripts/lockfile-diff.mjs --strict
npx vitest run                                                        # incl. mutation checks
pnpm exec turbo build && pnpm exec turbo lint && sh scripts/verify.sh
```

## Outcome

- `react-hooks/set-state-in-effect` is **enabled and passing for the SDK**.
- Twelve hooks now share one request lifecycle instead of hand-rolling mounted
  flags, loading booleans and reset effects.
- Two `useERC20` reset effects disappeared entirely: they existed only because
  the value lived in `useState`.
- SDK tests 27 → 31; the suite can now render hooks.

## Follow-ups

- **The client's 74 remain**, and they are a different problem: a long tail
  across 49 files of UI components, not a shared fetch layer. Option 3 —
  targeted disables plus fixing genuine derived-state mistakes — is the fit
  there, and it wants the component-level tests this change has now made
  possible.
- Focus/reconnect refetching remains disabled by default. Revisit it per read hook
  where freshness requirements justify the additional boundary calls.
- `useMemoAsync` remains the SDK's generic async escape hatch. Its callers in
  `useSetup.ts` and the token-image components could move to react-query
  individually, at which point the hook itself may become removable.
