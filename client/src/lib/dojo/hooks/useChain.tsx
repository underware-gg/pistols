
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Connector, useAccount, useConnect } from '@starknet-react/core'
import { SwitchStarknetChainParameter, AddStarknetChainParameters } from 'get-starknet-core'
import { useAddStarknetChain, useSwitchStarknetChain } from '@/lib/dojo/hooks/useWalletRequest'
import { ChainId, getDojoChainConfig, isChainIdSupported } from '@/lib/dojo/setup/chainConfig'
import { supportedConnetorIds } from '@/lib/dojo/setup/connectors'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { feltToString } from '@/lib/utils/starknet'
import { BigNumberish, Provider } from 'starknet'


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

export const useChainConfigProvider = (chain_id: ChainId | BigNumberish): Provider => {
  const { chainConfig } = useChainConfig(chain_id)
  const provider = useMemo(() => (chainConfig?.rpcUrl ? new Provider({ nodeUrl: chainConfig.rpcUrl }) : null), [chainConfig])
  return provider
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

export const useConnectToSelectedChain = (onConnect?: () => void) => {
  const { connect, connectors } = useConnect()
  const { isConnected, isConnecting } = useAccount()

  const [requestedConnect, setRequestedConnect] = useState(false)
  useEffect(() => {
    if (requestedConnect && isConnected) {
      onConnect?.()
    }
  }, [requestedConnect, isConnected])

  let _connect = useCallback(() => {
    if (isConnected) {
      onConnect?.()
    } else if (!isConnecting) {
      const controller = connectors.find((connector) => (connector.id == supportedConnetorIds.CONTROLLER));
      const predeployed = connectors.find((connector) => (connector.id == supportedConnetorIds.DOJO_PREDEPLOYED));
      if (controller) {
        console.log(`Connecting to controller...`)
        setRequestedConnect(true)
        connect({ connector: controller })
      } else if (predeployed) {
        console.log(`Connecting to predeployed...`)
        setRequestedConnect(true)
        connect({ connector: predeployed })
      } else {
        setRequestedConnect(false)
        console.warn(`NO CONNECTOR!`)
      }
    }
  }, [connectors, isConnected, isConnecting])


  return {
    connect: _connect,
    isConnected,
    isConnecting,
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


