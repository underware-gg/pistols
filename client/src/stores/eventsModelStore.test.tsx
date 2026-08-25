import { renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

// These hooks reach useAccount(), which needs a StarknetConfig provider. The
// subject here is the nullish-argument guard, not starknet-react, so the wallet
// hook is stubbed rather than a provider tree stood up.
// importOriginal matters: the SDK imports other things from this module, so
// replacing it wholesale breaks the import graph rather than the wallet hook.
vi.mock('@starknet-react/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@starknet-react/core')>()),
  useAccount: () => ({ address: undefined }),
}))

const { useDuelCallToAction, useDuelCallToActionWithState } = await import('./eventsModelStore')

// The nine conditional hook calls removed in 7d52e0e8 were replaced by
// unconditional ones, which is only correct if each hook tolerates a nullish
// argument and returns what the call site used to substitute. That equivalence
// was verified by reading; these pin the two hooks that needed a guard.

test('useDuelCallToAction() returns false for a nullish duel id instead of throwing', () => {
  // BigInt(undefined) throws. That crash is why the call site was written as
  // `props.duelId ? useDuelCallToAction(props.duelId) : false`.
  expect(renderHook(() => useDuelCallToAction(undefined as any)).result.current).toBe(false)
  expect(renderHook(() => useDuelCallToAction(0)).result.current).toBe(false)
})

test('useDuelCallToActionWithState() returns undefined for a nullish duel id', () => {
  expect(renderHook(() => useDuelCallToActionWithState(undefined as any)).result.current).toBeUndefined()
})
