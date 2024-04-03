
import { useCallback, useMemo } from 'react'
import { SwitchStarknetChainParameter, AddStarknetChainParameters } from 'get-starknet-core'
import { useAccount } from '@starknet-react/core'
import { useChainConfig } from '@/lib/dojo/hooks/useDojoChains'
import { useDojo } from '@/lib/dojo/DojoContext'

interface AddStarknetChainParametersImpl extends AddStarknetChainParameters {
  // accountImplementation: string, // ArgentX class hash (BUGGED)
  accountClassHash: string, // ???
  classHash: string, // ???
  rpcUrl: string,
}

export const useDojoWallet = () => {
  const { dojoChainConfig } = useDojo()
  const { isConnecting, isConnected, chainId, connector } = useAccount()

  const { chainId: selectedChainId, chainName: selectedChainName } = useChainConfig(dojoChainConfig.chainConfig.id)
  const { chainId: connectedChainId, chainName: connectedChainName } = useChainConfig(chainId)

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
    console.log(`wallet_switchStarknetChain...`, params)
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
      accountClassHash: dojoChainConfig.accountClassHash,
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
