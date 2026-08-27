import { beforeEach, expect, test, vi } from 'vitest'
import { useDuelistFetchStore } from './fetchStore'

beforeEach(() => {
  useDuelistFetchStore.getState().resetStore()
})

test('empty and duplicate fetch receipts do not publish no-op store updates', () => {
  const listener = vi.fn()
  const unsubscribe = useDuelistFetchStore.subscribe(listener)

  useDuelistFetchStore.getState().setFetchedAddresses([1n])
  const stored = useDuelistFetchStore.getState().addresses
  expect(listener).toHaveBeenCalledTimes(1)

  useDuelistFetchStore.getState().setFetchedAddresses([])
  useDuelistFetchStore.getState().setFetchedAddresses([1n])

  expect(useDuelistFetchStore.getState().addresses).toBe(stored)
  expect(listener).toHaveBeenCalledTimes(1)
  unsubscribe()
})
