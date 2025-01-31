import React, { ReactNode, createContext, useContext, useEffect, useMemo } from 'react'
import { Chain } from '@starknet-react/chains'
import { StarknetConfig, jsonRpcProvider } from '@starknet-react/core'
import { useChainConnectors } from 'src/dojo/setup/connectors'
import { NetworkId, DojoNetworkConfig, pistolsNetworkConfigs } from 'src/games/pistols/config/networks'
import { DojoAppConfig } from 'src/dojo/contexts/Dojo'


interface StarknetContextType {
  selectedNetworkId: NetworkId
  selectedNetworkConfig: DojoNetworkConfig
  chains: Chain[]
}

export const StarknetContext = createContext<StarknetContextType>(null)

export const StarknetProvider = ({
  dojoAppConfig,
  children,
}: {
  dojoAppConfig: DojoAppConfig
  children: ReactNode
}) => {
  const currentValue = useContext(StarknetContext)
  if (currentValue) throw new Error('StarknetProvider can only be used once')

  // Initial state
  const chains: Chain[] = useMemo(() => (
    Object.values(pistolsNetworkConfigs).map(networkConfig => networkConfig.chain)
  ), [])

  // Current chain
  const selectedNetworkId = useMemo(() => (dojoAppConfig.selectedNetworkId), [dojoAppConfig])
  const selectedNetworkConfig = useMemo(() => pistolsNetworkConfigs[selectedNetworkId], [selectedNetworkId])
  useEffect(() => console.log(`Selected network:`, selectedNetworkId, selectedNetworkConfig), [selectedNetworkId])

  // Build chain connectors from selectedNetworkConfig
  const chainConnectors = useChainConnectors(dojoAppConfig, selectedNetworkConfig);

  // RPC
  function rpc(chain: Chain) {
    const nodeUrl = chain.rpcUrls.default.http[0]
    return {
      nodeUrl,
    }
  }
  const provider = jsonRpcProvider({ rpc })

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
        provider={() => provider(selectedNetworkConfig.chain)}
        connectors={chainConnectors}
        autoConnect={true}
      // explorer={explorer}
      >
        {children}
      </StarknetConfig>
    </StarknetContext.Provider>
  )
}


export const useStarknetContext = (): StarknetContextType => {
  const context = useContext(StarknetContext)
  if (!context) {
    throw new Error('The `useStarknetContext` hook must be used within a `StarknetProvider`')
  }
  return context
}
