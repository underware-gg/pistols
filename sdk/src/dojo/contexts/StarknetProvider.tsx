import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { StarknetConfig, jsonRpcProvider, useInjectedConnectors } from '@starknet-react/core'
import { Chain } from '@starknet-react/chains'
import { useChainConnectors } from 'src/dojo/setup/connectors'
import { getDojoChainConfig, getStarknetProviderChains, isChainIdSupported } from 'src/dojo/setup/chainConfig'
import { ChainId, DojoChainConfig } from 'src/dojo/setup/chains'
import { DojoAppConfig } from 'src/dojo/contexts/Dojo'


interface StarknetContextType {
  supportedChainIds: ChainId[],
  selectedChainId: ChainId
  selectedChainConfig: DojoChainConfig
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
  const chains: Chain[] = useMemo(() => getStarknetProviderChains(dojoAppConfig.supportedChainIds), [dojoAppConfig])

  // Current chain
  const selectedChainId = useMemo(() => (dojoAppConfig.selectedChainId), [dojoAppConfig])
  const selectedChainConfig = useMemo(() => getDojoChainConfig(selectedChainId), [selectedChainId])
  useEffect(() => console.log(`Selected chain:`, selectedChainId, selectedChainConfig), [selectedChainId])

  // Build chain connectors from selectedChainConfig
  const chainConnectors = useChainConnectors(dojoAppConfig, selectedChainConfig);

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
        supportedChainIds: dojoAppConfig.supportedChainIds,
        selectedChainId,
        selectedChainConfig,
        chains,
      }}
    >
      <StarknetConfig
        chains={chains}
        provider={() => provider(selectedChainConfig.chain)}
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
