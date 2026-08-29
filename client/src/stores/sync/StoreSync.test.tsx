// @vitest-environment happy-dom
import React from 'react'
import { render } from '@testing-library/react'
import { sepolia } from '@starknet-start/chains'
import { jsonRpcProvider } from '@starknet-start/providers'
import { StarknetConfig } from '@starknet-start/react'
import { DojoProvider } from '@underware/pistols-sdk/dojo'
import { expect, test, vi } from 'vitest'

vi.mock('/src/hooks/PistolsContext', () => ({
  usePistolsContext: () => ({ currentDuel: undefined }),
  usePistolsScene: () => ({ atDuel: false }),
}));

vi.mock('/src/queries/useTokenBalancesQuery', () => ({
  useFetchInitialTokenBalancesQuery: () => ({
    initialTokenBalances: [],
    isLoading: false,
    address: undefined,
  }),
}));

// A few synchronizers use the classic JSX transform in the application build.
(globalThis as any).React = React
const { default: StoreSync } = await import('./StoreSync')

const rejected = () => Promise.reject(new Error('test network boundary'))
const setup = {
  sdk: {
    getEntities: rejected,
    getEventMessages: rejected,
    subscribeEntityQuery: rejected,
    subscribeEventQuery: rejected,
    onTokenBalanceUpdated: rejected,
  },
  selectedNetworkId: 'SEPOLIA',
  selectedNetworkConfig: {
    chainId: 'SN_SEPOLIA',
    rpcUrl: 'http://127.0.0.1:5050',
  },
  status: {},
}

test('store synchronizers mount without a React external-store update loop', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const provider = jsonRpcProvider({
    rpc: () => ({ nodeUrl: 'http://127.0.0.1:5050' }),
  })

  render(
    <StarknetConfig chains={[sepolia]} provider={provider} extraWallets={[]}>
      <DojoProvider value={setup as any}>
        <StoreSync />
      </DojoProvider>
    </StarknetConfig>,
  )

  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(consoleError.mock.calls.flat().join(' ')).not.toContain('Maximum update depth exceeded')
})
