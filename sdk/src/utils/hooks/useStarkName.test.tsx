// @vitest-environment happy-dom
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAddressFromStarkName: vi.fn(),
  getStarkName: vi.fn(),
  getStarkProfile: vi.fn(),
}))

vi.mock('starknet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('starknet')>()),
  StarknetIdImpl: {
    getAddressFromStarkName: mocks.getAddressFromStarkName,
    getStarkName: mocks.getStarkName,
    getStarkProfile: mocks.getStarkProfile,
  },
}))

import {
  useAddressFromStarkName,
  useStarkName,
  useStarkProfile,
} from './useStarkName'

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('resolves a Starknet name to an address through Starknet.js 10', async () => {
  mocks.getAddressFromStarkName.mockResolvedValue('0x123')
  const { result } = renderHook(
    () => useAddressFromStarkName('duelist.stark', 'https://rpc.example'),
    { wrapper: makeWrapper() },
  )

  await waitFor(() => expect(result.current.address).toBe('0x123'))
  expect(mocks.getAddressFromStarkName).toHaveBeenCalledWith(expect.anything(), 'duelist.stark')
})

test('resolves an address to a Starknet name through Starknet.js 10', async () => {
  mocks.getStarkName.mockResolvedValue('duelist.stark')
  const { result } = renderHook(
    () => useStarkName(0x123n, 'https://rpc.example'),
    { wrapper: makeWrapper() },
  )

  await waitFor(() => expect(result.current.starkName).toBe('duelist.stark'))
  expect(mocks.getStarkName).toHaveBeenCalledWith(expect.anything(), '0x123')
})

test('preserves the Stark profile hook fields', async () => {
  mocks.getStarkProfile.mockResolvedValue({
    name: 'duelist.stark',
    profilePicture: 'https://images.example/duelist.png',
    discord: 'duelist',
    twitter: 'duelist',
    github: 'duelist',
    proofOfPersonhood: true,
  })
  const { result } = renderHook(
    () => useStarkProfile(0x123n, 'https://rpc.example'),
    { wrapper: makeWrapper() },
  )

  await waitFor(() => expect(result.current.name).toBe('duelist.stark'))
  expect(result.current).toMatchObject({
    profilePicture: 'https://images.example/duelist.png',
    discord: 'duelist',
    twitter: 'duelist',
    github: 'duelist',
    proofOfPersonhood: true,
    isError: false,
  })
})
