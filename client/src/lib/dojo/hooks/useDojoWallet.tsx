
import { useCallback, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { SwitchStarknetChainParameter, AddStarknetChainParameters } from 'get-starknet-core'
import { useDojo } from '@/dojo/DojoContext'
import { dojoContextConfig } from '@/lib/dojo/setup/config'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import { feltToString } from '@/lib/utils/starknet'

interface AddStarknetChainParametersImpl extends AddStarknetChainParameters {
  // accountImplementation: string, // ArgentX class hash
  // accountClassHash: string, // ArgentX class hash
  classHash: string, // ArgentX class hash
  rpcUrl: string,
}

export const useDojoWallet = () => {
  const { dojoChainConfig } = useDojo()
  const { isConnecting, isConnected, chainId, } = useAccount()

  const selectedChainId = useMemo<CHAIN_ID>(() => (feltToString(dojoChainConfig.chainConfig.id) as CHAIN_ID), [dojoChainConfig])
  const selectedChainName = useMemo(() => (dojoChainConfig.chainConfig.name), [dojoChainConfig])

  const connectedChainId = useMemo<CHAIN_ID>(() => (feltToString(chainId ?? 0n) as CHAIN_ID), [chainId])
  const connectedChainName = useMemo<string>(() => (dojoContextConfig[connectedChainId]?.name ?? connectedChainId), [connectedChainId])

  const isCorrectChain = useMemo(() => {
    const result = (isConnected && connectedChainId == selectedChainId)
    if (isConnected && !result) {
      console.warn(`Connected to [${connectedChainId}], want [${selectedChainId}]`)
    }
    return result
  }, [isConnected, connectedChainId, selectedChainId])

  //
  // Call to switch network to current connected wallet
  // https://github.com/starknet-io/starknet.js/blob/develop/src/wallet/connect.ts
  const switch_network = useCallback(() => {
    const params: SwitchStarknetChainParameter = {
      chainId: selectedChainId,
    }
    return window?.starknet?.request({ type: 'wallet_switchStarknetChain', params }) ?? Promise.resolve(false)
  }, [selectedChainId])

  //
  // Call to add network to current connected wallet
  // https://github.com/starknet-io/starknet.js/blob/develop/src/wallet/connect.ts
  const add_network = useCallback(() => {
    const params: AddStarknetChainParametersImpl = {
      id: selectedChainId,
      chainId: selectedChainId,
      chainName: dojoChainConfig.name,
      baseUrl: dojoChainConfig.rpcUrl,
      rpcUrl: dojoChainConfig.rpcUrl,
      rpcUrls: [dojoChainConfig.rpcUrl],
      nativeCurrency: dojoChainConfig.chainConfig.nativeCurrency,
      // accountImplementation: dojoChainConfig.accountClassHash,
      // accountClassHash: dojoChainConfig.accountClassHash,
      classHash: dojoChainConfig.accountClassHash,
      // blockExplorerUrls?: string[],
      // iconUrls?: string[],
    }
    console.log(`wallet_addStarknetChain...`, params)
    return window?.starknet?.request({ type: 'wallet_addStarknetChain', params }) ?? Promise.resolve(false)
  }, [selectedChainId, dojoChainConfig])

  return {
    isConnecting,
    isConnected,
    isCorrectChain,
    connectedChainId,
    connectedChainName,
    selectedChainId,
    selectedChainName,
    dojoChainConfig,
    switch_network,
    add_network,
  }
}
