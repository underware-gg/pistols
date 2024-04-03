
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Chain } from '@starknet-react/chains'
import { DojoChainConfig, dojoContextConfig, getStarknetProviderChains, isChainIdSupported } from '@/lib/dojo/setup/chainConfig'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import { BigNumberish } from 'starknet'
import { feltToString } from '@/lib/utils/starknet'

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


export const useChainConfig = (chain_id: CHAIN_ID | BigNumberish) => {
  const chainId = useMemo<CHAIN_ID>(() => (
    ((typeof chain_id === 'string' && !chain_id.startsWith('0x')) ? chain_id : feltToString(chain_id ?? 0n)) as CHAIN_ID
  ), [chain_id])  
  const isSupported = useMemo(() => (isChainIdSupported(chainId)), [chainId])
  const chainConfig = useMemo(() => (dojoContextConfig[chainId] ?? null), [chainId])
  const chainName = useMemo(() => (chainConfig?.name ?? null), [chainConfig])
  return {
    chainId,
    isSupported,
    chainName,
    chainConfig,
  }
}

