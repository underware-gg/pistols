
import { useCallback, useMemo } from 'react'
import { SwitchStarknetChainParameter, AddStarknetChainParameters } from 'get-starknet-core'
import { useAccount } from '@starknet-react/core'
import { dojoContextConfig, isChainIdSupported } from '@/lib/dojo/setup/chainConfig'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { feltToString } from '@/lib/utils/starknet'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import { BigNumberish } from 'starknet'


interface AddStarknetChainParametersImpl extends AddStarknetChainParameters {
  // accountImplementation: string, // ArgentX class hash (BUGGED)
  accountClassHash: string, // ???
  classHash: string, // ???
  rpcUrl: string,
}

export const useDojoChain = () => {
  const { selectedChainConfig } = useStarknetContext()
  const { isConnecting, isConnected, chainId, account, connector } = useAccount()

  const { chainId: selectedChainId, chainName: selectedChainName } = useDojoChainConfig(selectedChainConfig.chain.id)
  const { chainId: connectedChainId, chainName: connectedChainName } = useDojoChainConfig(chainId)

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
      chainName: selectedChainConfig.name,
      baseUrl: selectedChainConfig.rpcUrl,
      rpcUrl: selectedChainConfig.rpcUrl,
      rpcUrls: [selectedChainConfig.rpcUrl],
      nativeCurrency: selectedChainConfig.chain.nativeCurrency,
      // accountImplementation: selectedChainConfig.accountClassHash,
      accountClassHash: selectedChainConfig.accountClassHash,
      classHash: selectedChainConfig.accountClassHash,
      // blockExplorerUrls?: string[],
      // iconUrls?: string[],
    }
    console.log(`wallet_addStarknetChain...`, params)
    return window?.starknet?.request({ type: 'wallet_addStarknetChain', params }) ?? Promise.resolve(false)
  }, [selectedChainId, selectedChainConfig])

  return {
    account,
    connector,
    isConnecting,
    isConnected,
    isCorrectChain,
    connectedChainId,
    connectedChainName,
    selectedChainId,
    selectedChainName,
    selectedChainConfig,
    switch_network,
    add_network,
  }
}

export const useDojoChainConfig = (chain_id: CHAIN_ID | BigNumberish) => {
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
