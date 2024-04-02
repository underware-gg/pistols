
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Chain } from '@starknet-react/chains'
import { DojoChainConfig, dojoContextConfig, getStarknetProviderChains } from '@/lib/dojo/setup/config'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'

export type DojoChainsResult = ReturnType<typeof useDojoChains>

export const useDojoChains = (intialChainId: CHAIN_ID, supportedChainIds: CHAIN_ID[]) => {

  const chains: Chain[] = useMemo(() => getStarknetProviderChains(supportedChainIds), [supportedChainIds])

  const [selectedChainId, setSelectedChainId] = useState<CHAIN_ID>(intialChainId)
  const [selectedChainConfig, setSelectedChain] = useState<DojoChainConfig>(dojoContextConfig[intialChainId])

  const selectChainId = useCallback((chainId: CHAIN_ID) => {
    setSelectedChainId(chainId)
    setSelectedChain(dojoContextConfig[chainId])
    window?.localStorage?.setItem('lastSelectedChainId', chainId)
  }, [])

  useEffect(() => console.log(`Selected chain:`, selectedChainId, selectedChainConfig), [selectedChainId, selectedChainConfig])

  const isKatana = useMemo(() => selectedChainConfig?.chainConfig?.network === 'katana', [selectedChainConfig])

  return {
    supportedChainIds,
    selectedChainId,
    selectedChainConfig,
    selectChainId,
    isKatana,
    chains,
  }
}

