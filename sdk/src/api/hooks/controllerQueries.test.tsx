// @vitest-environment happy-dom
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  accountState: {
    address: '0x1',
    account: {} as object,
    chainId: '0x534e5f4d41494e',
  },
  generateSalt: vi.fn(),
  verifySignature: vi.fn(),
}))

vi.mock('@starknet-react/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@starknet-react/core')>()),
  useAccount: () => mocks.accountState,
}))
vi.mock('src/api/salt', () => ({
  apiGenerateControllerSalt: (...args: unknown[]) => mocks.generateSalt(...args),
}))
vi.mock('src/api/verify', () => ({
  apiVerifyControllerSignature: (...args: unknown[]) => mocks.verifySignature(...args),
}))

import { useApiGenerateControllerSalt } from './useApiGenerateControllerSalt'
import { useApiVerifyControllerSignature } from './useApiVerifyControllerSignature'

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  mocks.generateSalt.mockReset()
  mocks.verifySignature.mockReset()
})

test('salt queries are isolated by effective account and domain', async () => {
  mocks.generateSalt.mockImplementation(async (_url, address, domain) => (
    address === '0x2' || domain.chainId === 'SN_SEPOLIA' ? 2n : 1n
  ))
  const { result, rerender } = renderHook(
    ({ fromAccount, chainId }) => useApiGenerateControllerSalt(
      'https://api.example',
      { chainId } as any,
      10n,
      [20n, 30n],
      fromAccount,
    ),
    {
      wrapper: makeWrapper(),
      initialProps: { fromAccount: '0x1', chainId: 'SN_MAIN' },
    },
  )
  await waitFor(() => expect(result.current.salt).toBe(1n))
  rerender({ fromAccount: '0x2', chainId: 'SN_MAIN' })
  await waitFor(() => expect(result.current.salt).toBe(2n))
  rerender({ fromAccount: '0x1', chainId: 'SN_SEPOLIA' })
  await waitFor(() => expect(result.current.salt).toBe(2n))
  expect(mocks.generateSalt).toHaveBeenCalledTimes(3)
})

test('signature verification queries are isolated by effective account and chain', async () => {
  mocks.verifySignature.mockImplementation(async (_url, address, chainId) => (
    address === '0x1' && chainId === 'SN_MAIN'
  ))
  const { result, rerender } = renderHook(
    ({ fromAccount }) => useApiVerifyControllerSignature(
      'https://api.example',
      10n,
      [20n, 30n],
      fromAccount,
    ),
    { wrapper: makeWrapper(), initialProps: { fromAccount: '0x1' } },
  )
  await waitFor(() => expect(result.current.isValid).toBe(true))
  rerender({ fromAccount: '0x2' })
  await waitFor(() => expect(result.current.isValid).toBe(false))
  expect(mocks.verifySignature).toHaveBeenCalledTimes(2)
})
