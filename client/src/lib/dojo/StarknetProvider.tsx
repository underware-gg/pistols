import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DojoChainConfig, dojoContextConfig, getStarknetProviderChains, isChainIdSupported } from '@/lib/dojo/setup/chainConfig'
import { StarknetConfig, argent, braavos, injected, jsonRpcProvider, useInjectedConnectors } from '@starknet-react/core'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
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
  supportedChainIds,
  children,
}: {
  supportedChainIds: CHAIN_ID[]
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
    // select default from env
    const defaultChainId = (process.env.NEXT_PUBLIC_CHAIN_ID ?? (
      process.env.NODE_ENV === 'development' ? CHAIN_ID.KATANA
        : supportedChainIds[0]
    )) as CHAIN_ID
    return defaultChainId
  }, [supportedChainIds])

  const chains: Chain[] = useMemo(() => getStarknetProviderChains(supportedChainIds), [supportedChainIds])


  //
  // Current chain
  //
  const [selectedChainId, setSelectedChainId] = useState<CHAIN_ID>(intialChainId)
  const [selectedChainConfig, setSelectedChain] = useState<DojoChainConfig>(dojoContextConfig[intialChainId])
  const isKatana = useMemo(() => selectedChainConfig?.chain?.network === 'katana', [selectedChainConfig])

  const selectChainId = useCallback((chainId: CHAIN_ID) => {
    if (!isChainIdSupported(chainId)) {
      throw `selectChainId() Invalid chain [${chainId}]`
    }
    setSelectedChainId(chainId)
    setSelectedChain(dojoContextConfig[chainId])
    window?.localStorage?.setItem('lastSelectedChainId', chainId)
  }, [])

  useEffect(() => console.log(`Selected chain:`, selectedChainId, selectedChainConfig), [selectedChainId, selectedChainConfig])


  //
  // Connectors
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [
      // injected({ id: 'dojoburner' }),
      injected({ id: 'dojopredeployed' }),
      argent(),
      // braavos(),
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
        supportedChainIds,
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
