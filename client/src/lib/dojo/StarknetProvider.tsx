import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ChainId, DojoChainConfig, getDojoChainConfig, getStarknetProviderChains, isChainIdSupported } from '@/lib/dojo/setup/chainConfig'
import { StarknetConfig, argent, braavos, injected, jsonRpcProvider, useInjectedConnectors } from '@starknet-react/core'
import { DojoPredeployedStarknetWindowObject } from '@dojoengine/create-burner'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { useController } from '@/lib/dojo/hooks/useController'
import { Chain } from '@starknet-react/chains'


interface StarknetContextType {
  supportedChainIds: ChainId[],
  selectedChainId: ChainId
  selectedChainConfig: DojoChainConfig
  selectChainId: (chainId: ChainId) => void
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
    const lastSelectedChainId = (typeof window !== 'undefined' ? window?.localStorage?.getItem('lastSelectedChainId') : undefined) as ChainId
    if (isChainIdSupported(lastSelectedChainId)) {
      return lastSelectedChainId
    }
    return dojoAppConfig.initialChainId
  }, [dojoAppConfig])

  const chains: Chain[] = useMemo(() => getStarknetProviderChains(dojoAppConfig.supportedChainIds), [dojoAppConfig])

  //
  // Current chain
  //
  const [selectedChainId, setSelectedChainId] = useState<ChainId>(intialChainId)
  const [selectedChainConfig, setSelectedChain] = useState<DojoChainConfig>(getDojoChainConfig(intialChainId))
  const isKatana = useMemo(() => selectedChainConfig?.chain?.network === 'katana', [selectedChainConfig])
  useEffect(() => console.log(`Selected chain:`, selectedChainId, selectedChainConfig), [selectedChainConfig])

  const selectChainId = useCallback((chainId: ChainId) => {
    if (!isChainIdSupported(chainId)) {
      throw `selectChainId() Invalid chain [${chainId}]`
    }
    setSelectedChainId(chainId)
    setSelectedChain(getDojoChainConfig(chainId))
    window?.localStorage?.setItem('lastSelectedChainId', chainId)
  }, [])

  //
  // Cartridge Controller
  const manifest = useMemo(() => (dojoAppConfig.manifests[selectedChainId] ?? null), [selectedChainConfig])
  const { controller } = useController(manifest)

  //
  // Connectors
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [
      injected({ id: DojoPredeployedStarknetWindowObject.getId() }),
      argent(),
      braavos(),
      controller,
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
