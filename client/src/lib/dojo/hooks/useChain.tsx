
import { useCallback, useMemo } from 'react'
import { SwitchStarknetChainParameter, AddStarknetChainParameters } from 'get-starknet-core'
import { useAccount } from '@starknet-react/core'
import { ChainId, getDojoChainConfig, isChainIdSupported } from '@/lib/dojo/setup/chainConfig'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { feltToString } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'
import { useAddStarknetChain, useSwitchStarknetChain } from './useWalletRequest'


export const useChainConfig = (chain_id: ChainId | BigNumberish) => {
  const chainId = useMemo<ChainId>(() => (
    ((typeof chain_id === 'string' && !chain_id.startsWith('0x')) ? chain_id : feltToString(chain_id ?? 0n)) as ChainId
  ), [chain_id])
  const isSupported = useMemo(() => (isChainIdSupported(chainId)), [chainId])
  const chainConfig = useMemo(() => (getDojoChainConfig(chainId) ?? null), [chainId])
  const chainName = useMemo(() => (chainConfig?.name ?? null), [chainConfig])
  return {
    chainId,
    isSupported,
    chainName,
    chainConfig,
  }
}

export const useSelectedChain = () => {
  const { selectedChainConfig } = useStarknetContext()
  const { isConnecting, isConnected, chainId, account, connector } = useAccount()

  const { chainId: selectedChainId, chainName: selectedChainName } = useChainConfig(selectedChainConfig.chain.id)
  const { chainId: connectedChainId, chainName: connectedChainName } = useChainConfig(chainId)

  const isCorrectChain = useMemo(() => {
    const result = (isConnected && connectedChainId == selectedChainId)
    if (isConnected && !result) {
      console.warn(`Connected to [${connectedChainId}], want [${selectedChainId}]`)
    }
    return result
  }, [isConnected, connectedChainId, selectedChainId])

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
  }
}


//-----------------------------
// Chain switch callbacks
//
interface AddStarknetChainParametersImpl extends AddStarknetChainParameters {
  // accountImplementation: string, // ArgentX class hash (BUGGED)
  accountClassHash: string, // ???
  classHash: string, // ???
  rpcUrl: string,
}
export const useChainSwitchCallbacks = () => {
  const { selectedChainId, selectedChainConfig } = useSelectedChain()

  const switch_params = useMemo(() => {
    const params: SwitchStarknetChainParameter = {
      chainId: selectedChainId,
    }
    return params
  }, [selectedChainId])
  const { switch_starknet_chain } = useSwitchStarknetChain(switch_params)

  const add_params = useMemo(() => {
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
    return params
  }, [selectedChainId, selectedChainConfig])
  const { add_starknet_chain } = useAddStarknetChain(add_params)

  return {
    switch_starknet_chain,
    add_starknet_chain,
  }
}


