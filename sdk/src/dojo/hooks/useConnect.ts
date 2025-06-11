import { useCallback, useEffect, useMemo, useState } from 'react'
import { Connector, useAccount, useConnect, useNetwork } from '@starknet-react/core'
import { SwitchStarknetChainParameters, AddStarknetChainParameters } from 'get-starknet-core'
import { useAddStarknetChain, useSwitchStarknetChain } from 'src/utils/hooks/useWalletRequest'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { feltToString } from 'src/starknet/starknet'


export const useConnectToSelectedNetwork = (onConnect?: () => void) => {
  const { isConnected, isConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { selectedNetworkConfig } = useDojoSetup()

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
      // get 1st supported connector on this chain
      const connector = selectedNetworkConfig.connectorIds.reduce((acc, id) => {
        return acc ?? connectors.find((connector) => (connector.id == id))
      }, undefined as Connector)
      if (connector) {
        console.log(`>> Connecting with [${connector.id}]...`)
        setRequestedConnect(true)
        connect({ connector })
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

export const useIsConnectedToSelectedNetwork = () => {
  const { isConnected, isConnecting } = useAccount()
  const { chain } = useNetwork()
  const { selectedNetworkConfig } = useDojoSetup()

  const isCorrectNetwork = useMemo(() => {
    if (!isConnected || !chain) return undefined
    const selectedChainId = selectedNetworkConfig.chainId
    const connectedChainId = feltToString(chain.id)
    const result = (connectedChainId == selectedChainId)
    if (isConnected && !result) {
      console.warn(`Connected to [${connectedChainId}], want [${selectedChainId}]`)
    }
    return result
  }, [isConnected, selectedNetworkConfig, chain])

  return {
    isConnected,
    isConnecting,
    isCorrectNetwork,
  }
}

//-----------------------------
// Chain switch callbacks
//
export const useChainSwitchCallbacks = () => {
  const { selectedNetworkConfig } = useDojoSetup()

  const switch_params = useMemo(() => {
    const params: SwitchStarknetChainParameters = {
      chainId: selectedNetworkConfig.chainId,
    }
    return params
  }, [selectedNetworkConfig])
  const { switch_starknet_chain } = useSwitchStarknetChain(switch_params)

  return {
    switch_starknet_chain,
  }
}


