// @vitest-environment happy-dom
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(async (..._args: unknown[]) => [{ count: '2' }]),
}))

vi.mock('src/dojo/contexts/DojoContext', () => ({
  useDojoSetup: () => ({ selectedNetworkConfig: { toriiUrl: 'https://torii.example' } }),
}))
vi.mock('src/utils/misc/sql', () => ({
  queryToriiSqlRaw: (...args: unknown[]) => mocks.queryRaw(...args),
}))

import { useSqlQuery } from './useToriiSqlQuery'

test('useSqlQuery caches raw rows and formats them independently per observer', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => {
    const numberResult = useSqlQuery<{ count: string }[], number>({
      query: 'select count from entities',
      formatFn: (rows) => Number(rows[0].count),
    })
    const labelResult = useSqlQuery<{ count: string }[], string>({
      query: 'select count from entities',
      formatFn: (rows) => `count:${rows[0].count}`,
    })
    return { numberResult, labelResult }
  }, { wrapper })

  await waitFor(() => expect(result.current.numberResult.data).toBe(2))
  expect(result.current.labelResult.data).toBe('count:2')
  expect(mocks.queryRaw).toHaveBeenCalledTimes(1)
})
