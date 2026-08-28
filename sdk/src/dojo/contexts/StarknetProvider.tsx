import React, { ReactNode, createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { Chain } from '@starknet-start/chains'
import { StarknetConfig, useAccount, useConnect } from '@starknet-start/react'
import { jsonRpcProvider } from '@starknet-start/providers'
import { NetworkId, DojoNetworkConfig, getNetworkConfig, DojoNetworkEnv } from 'src/games/pistols/config/networks'
import { useChainConnectors } from 'src/games/pistols/dojo/connectors'
import { DojoAppConfig } from 'src/dojo/contexts/Dojo'
import type { Connector } from 'src/starknet/wallet'
import { getConnectorId } from 'src/starknet/wallet'

const LAST_CONNECTED_WALLET_KEY = 'get-starknet.last-connected-wallet'


interface StarknetContextType {
  selectedNetworkId: NetworkId
  selectedNetworkConfig: DojoNetworkConfig
  chains: Chain[]
}

export const StarknetContext = createContext<StarknetContextType>(null)

export const StarknetProvider = ({
  dojoAppConfig,
  children,
  env,
}: {
  dojoAppConfig: DojoAppConfig
  children: ReactNode
  env?: DojoNetworkEnv
}) => {
  const currentValue = useContext(StarknetContext)
  if (currentValue) throw new Error('StarknetProvider can only be used once')

  // Current chain
  const selectedNetworkId = useMemo(() => (dojoAppConfig.selectedNetworkId), [dojoAppConfig])
  const selectedNetworkConfig = useMemo(() => getNetworkConfig(selectedNetworkId, env), [selectedNetworkId, env])
  useEffect(() => console.log(`Selected network:`, selectedNetworkId, selectedNetworkConfig), [selectedNetworkConfig, selectedNetworkId])

  // Build chains and connectors from selectedNetworkConfig
  const chains: Chain[] = useMemo(() => [selectedNetworkConfig.chain], [selectedNetworkConfig])
  const connectors: Connector[] = useChainConnectors(dojoAppConfig, selectedNetworkConfig);

  // RPC
  const provider = useMemo(() => jsonRpcProvider({
    rpc: (chain: Chain) => ({ nodeUrl: chain.rpcUrls.default.http[0] }),
  }), [])

  return (
    <StarknetContext.Provider
      value={{
        selectedNetworkId,
        selectedNetworkConfig,
        chains,
      }}
    >
      <StarknetConfig
        chains={chains}
        provider={provider}
        extraWallets={connectors}
      // explorer={explorer}
      >
        <AutoReconnect />
        {children}
      </StarknetConfig>
    </StarknetContext.Provider>
  )
}

function AutoReconnect(): React.JSX.Element | null {
  const attempted = useRef(false)
  const { isConnected, isConnecting } = useAccount()
  const { connectAsync, connectors } = useConnect()

  useEffect(() => {
    if (attempted.current || isConnected || isConnecting || typeof window === 'undefined') return

    const lastConnectedId = window.localStorage.getItem(LAST_CONNECTED_WALLET_KEY)
    if (!lastConnectedId) return

    const connector = connectors.find((candidate) => getConnectorId(candidate) === lastConnectedId)
    if (!connector) return

    attempted.current = true
    void connectAsync({ connector }).catch((error) => {
      console.warn(`Could not reconnect wallet [${lastConnectedId}]`, error)
    })
  }, [connectAsync, connectors, isConnected, isConnecting])

  return null
}


export const useStarknetContext = (): StarknetContextType => {
  const context = useContext(StarknetContext)
  if (!context) {
    throw new Error('The `useStarknetContext` hook must be used within a `StarknetProvider`')
  }
  return context
}
