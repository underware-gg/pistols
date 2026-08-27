// @vitest-environment happy-dom
// Only the hook tests need a DOM; the rest of the SDK suite stays on node.
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { CairoCustomEnum } from 'starknet'
import { useSdkCallPromise } from './useSdkCallPromise'

// This hook was a useEffect + useState + mounted-flag fetch and is now backed by
// react-query. Sixteen call sites in the client destructure { value, isLoading }
// from it, so the conversion is only correct if the guard conditions and the
// defaultValue fallback behave exactly as before.

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

const namedCall = async (...args: any[]) => ['result', ...args] as any

test('useSdkCallPromise() does not call, and returns defaultValue, when disabled', () => {
  const call = vi.fn(namedCall)
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [1], enabled: false, defaultValue: 'fallback' as any }),
    { wrapper: makeWrapper() },
  )
  expect(call).not.toHaveBeenCalled()
  expect(result.current.value).toBe('fallback')
})

test('useSdkCallPromise() does not call when any argument is null', () => {
  const call = vi.fn(namedCall)
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [1, null], enabled: true, defaultValue: 'fallback' as any }),
    { wrapper: makeWrapper() },
  )
  expect(call).not.toHaveBeenCalled()
  expect(result.current.value).toBe('fallback')
})

test('useSdkCallPromise() resolves the call and passes its arguments through', async () => {
  const call = vi.fn(namedCall)
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [7n, 'x'], enabled: true }),
    { wrapper: makeWrapper() },
  )
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(call).toHaveBeenCalledWith(7n, 'x')
  expect(result.current.value).toEqual(['result', 7n, 'x'])
})

test('useSdkCallPromise() accepts bigint arguments', async () => {
  const call = vi.fn(namedCall)
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [2n ** 200n], enabled: true }),
    { wrapper: makeWrapper() },
  )
  await waitFor(() => expect(result.current.value).toBeDefined())
  expect(result.current.value).toEqual(['result', 2n ** 200n])
})

test('useSdkCallPromise() distinguishes Cairo enum variants in its cache key', async () => {
  const call = vi.fn(async (value: CairoCustomEnum) => value.activeVariant() as any)
  const { result, rerender } = renderHook(
    ({ variant }) => useSdkCallPromise<any>({
      call,
      args: [new CairoCustomEnum({ [variant]: {} })],
      enabled: true,
    }),
    { wrapper: makeWrapper(), initialProps: { variant: 'FreeDuelist' } },
  )
  await waitFor(() => expect(result.current.value).toBe('FreeDuelist'))
  rerender({ variant: 'Duelist' })
  await waitFor(() => expect(result.current.value).toBe('Duelist'))
  expect(call).toHaveBeenCalledTimes(2)
})

test('useSdkCallPromise() resets to defaultValue when disabled after success', async () => {
  const call = vi.fn(namedCall)
  const { result, rerender } = renderHook(
    ({ enabled }) => useSdkCallPromise<any>({ call, args: [1], enabled, defaultValue: 'fallback' as any }),
    { wrapper: makeWrapper(), initialProps: { enabled: true } },
  )
  await waitFor(() => expect(result.current.value).toEqual(['result', 1]))
  rerender({ enabled: false })
  expect(result.current.value).toBe('fallback')
  rerender({ enabled: true })
  await waitFor(() => expect(call).toHaveBeenCalledTimes(2))
})

test('useSdkCallPromise() exposes failures instead of returning a valid-looking default', async () => {
  const failure = new Error('rpc unavailable')
  const call = vi.fn(async () => { throw failure })
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [], enabled: true, defaultValue: false as any }),
    { wrapper: makeWrapper() },
  )
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBe(failure)
})
