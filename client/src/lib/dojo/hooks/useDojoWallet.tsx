
import { useMemo } from 'react'
import { useAccount, useNetwork } from '@starknet-react/core'
import { useDojo } from '@/dojo/DojoContext'
import { feltToString } from '@/lib/utils/starknet'
import { CHAIN_ID } from '../setup/chains'
import { dojoContextConfig } from '@/lib/dojo/setup/config'

export const useDojoWallet = () => {
  const { dojoChainConfig } = useDojo()
  const { isConnecting, isConnected, chainId,  } = useAccount()
  const { chain, chains } = useNetwork() // from <StarknetProvider>

  const selectedChainId = useMemo<CHAIN_ID>(() => (feltToString(dojoChainConfig.chainConfig.id) as CHAIN_ID), [dojoChainConfig])
  const selectedChainName = useMemo(() => (dojoChainConfig.chainConfig.name), [dojoChainConfig])
  const connectedChainId = useMemo<CHAIN_ID>(() => (feltToString(chainId ?? 0n) as CHAIN_ID), [chainId])
  const connectedChainName = useMemo<string>(() => (dojoContextConfig[connectedChainId]?.name ?? connectedChainId), [connectedChainId])
  // console.log(`CONN to [${connectedChainId}], want [${selectedChainId}]`)

  const isCorrectChain = useMemo(() => {
    const result = (isConnected && connectedChainId == selectedChainId)
    if (isConnected && !result) {
      console.warn(`Connected to [${connectedChainId}], want [${selectedChainId}]`)
    }
    return result
  }, [isConnected, connectedChainId, selectedChainId])

  const supportsChain = useMemo(() => {
    for (const chain of chains) {
      // console.log(`>>>CJ:`, chain)
    }
    return false
  }, [dojoChainConfig, isConnected, chainId])


  return {
    isConnecting,
    isConnected,
    isCorrectChain,
    supportsChain,
    connectedChainId,
    connectedChainName,
    selectedChainId,
    selectedChainName,
    dojoChainConfig,
  }
}
