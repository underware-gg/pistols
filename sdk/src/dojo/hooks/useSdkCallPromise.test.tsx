// @vitest-environment happy-dom
// Only the hook tests need a DOM; the rest of the SDK suite stays on node.
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useSdkCallPromise } from './useSdkCallPromise'

// This hook was a useEffect + useState + mounted-flag fetch and is now backed by
// react-query. Sixteen call sites in the client destructure { value, isLoading }
// from it, so the conversion is only correct if the guard conditions and the
// defaultValue fallback behave exactly as before.

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

// Named, because the query key is derived from call.name.
const namedCall = async (...args: any[]) => ['result', ...args] as any

test('useSdkCallPromise() does not call, and returns defaultValue, when disabled', () => {
  const call = vi.fn(namedCall)
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [1], enabled: false, defaultValue: 'fallback' as any }),
    { wrapper },
  )
  expect(call).not.toHaveBeenCalled()
  expect(result.current.value).toBe('fallback')
})

test('useSdkCallPromise() does not call when any argument is null', () => {
  const call = vi.fn(namedCall)
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [1, null], enabled: true, defaultValue: 'fallback' as any }),
    { wrapper },
  )
  expect(call).not.toHaveBeenCalled()
  expect(result.current.value).toBe('fallback')
})

test('useSdkCallPromise() resolves the call and passes its arguments through', async () => {
  const call = vi.fn(namedCall)
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [7n, 'x'], enabled: true }),
    { wrapper },
  )
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(call).toHaveBeenCalledWith(7n, 'x')
  expect(result.current.value).toEqual(['result', 7n, 'x'])
})

test('useSdkCallPromise() accepts bigint arguments', async () => {
  // Documents intent rather than pinning it. react-query's hashKey throws
  // "Do not know how to serialize a BigInt" when called directly on a key
  // containing one, nested or not, which is why the args are stringified. But
  // removing that stringification does NOT fail this test - the hook keeps
  // working with raw bigints in the key, and I could not account for the
  // difference. So treat the stringification as justified by hashKey's behaviour,
  // not as covered by this assertion.
  const call = vi.fn(namedCall)
  const { result } = renderHook(
    () => useSdkCallPromise<any>({ call, args: [2n ** 200n], enabled: true }),
    { wrapper },
  )
  await waitFor(() => expect(result.current.value).toBeDefined())
  expect(result.current.value).toEqual(['result', 2n ** 200n])
})
