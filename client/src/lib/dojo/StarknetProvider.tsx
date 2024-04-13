import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CHAIN_ID, DojoChainConfig, getDojoChainConfig, getStarknetProviderChains, isChainIdSupported } from '@/lib/dojo/setup/chainConfig'
import { StarknetConfig, argent, braavos, injected, jsonRpcProvider, useInjectedConnectors } from '@starknet-react/core'
import { DojoPredeployedStarknetWindowObject, DojoBurnerStarknetWindowObject } from '@dojoengine/create-burner'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { Chain } from '@starknet-react/chains'


interface StarknetContextType {
  supportedChainIds: CHAIN_ID[],
  selectedChainId: CHAIN_ID
  selectedChainConfig: DojoChainConfig
  selectChainId: (chainId: CHAIN_ID) => void
  isKatana: boolean
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

  //
  // Initial state
  //
  const intialChainId = useMemo(() => {
    // connect to last
    const lastSelectedChainId = (typeof window !== 'undefined' ? window?.localStorage?.getItem('lastSelectedChainId') : undefined) as CHAIN_ID
    if (isChainIdSupported(lastSelectedChainId)) {
      return lastSelectedChainId
    }
    return dojoAppConfig.initialChainId
  }, [dojoAppConfig])

  const chains: Chain[] = useMemo(() => getStarknetProviderChains(dojoAppConfig.supportedChainIds), [dojoAppConfig])

  //
  // Current chain
  //
  const [selectedChainId, setSelectedChainId] = useState<CHAIN_ID>(intialChainId)
  const [selectedChainConfig, setSelectedChain] = useState<DojoChainConfig>(getDojoChainConfig(intialChainId))
  const isKatana = useMemo(() => selectedChainConfig?.chain?.network === 'katana', [selectedChainConfig])
  useEffect(() => console.log(`Selected chain:`, selectedChainId, selectedChainConfig), [selectedChainConfig])

  const selectChainId = useCallback((chainId: CHAIN_ID) => {
    if (!isChainIdSupported(chainId)) {
      throw `selectChainId() Invalid chain [${chainId}]`
    }
    setSelectedChainId(chainId)
    setSelectedChain(getDojoChainConfig(chainId))
    window?.localStorage?.setItem('lastSelectedChainId', chainId)
  }, [])


  //
  // Connectors
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [
      injected({ id: DojoBurnerStarknetWindowObject.getId() }),
      injected({ id: DojoPredeployedStarknetWindowObject.getId() }),
      argent(),
      braavos(),
    ],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: 'always',
    // Randomize the order of the connectors.
    // order: 'random',
  });

  //
  // RPC
  //
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
        selectChainId,
        isKatana,
        chains,
      }}
    >
      <StarknetConfig
        chains={chains}
        provider={() => provider(selectedChainConfig.chain)}
        connectors={connectors}
        autoConnect={false}
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
