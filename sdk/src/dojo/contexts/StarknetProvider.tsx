import React, { ReactNode, createContext, useContext, useEffect, useMemo } from 'react'
import { Chain } from '@starknet-react/chains'
import { Connector, StarknetConfig, jsonRpcProvider } from '@starknet-react/core'
import { NetworkId, DojoNetworkConfig, getNetworkConfig, DojoNetworkEnv } from 'src/games/pistols/config/networks'
import { useChainConnectors } from 'src/games/pistols/dojo/connectors'
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
  useEffect(() => console.log(`Selected network:`, selectedNetworkId, selectedNetworkConfig), [selectedNetworkId])

  // Build chains and connectors from selectedNetworkConfig
  const chains: Chain[] = useMemo(() => [selectedNetworkConfig.chain], [selectedNetworkConfig])
  const connectors: Connector[] = useChainConnectors(dojoAppConfig, selectedNetworkConfig);

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
        connectors={connectors}
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
