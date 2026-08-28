import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAccount, useConnect, useNetwork } from '@starknet-start/react'
import { SwitchStarknetChainParameters } from '@starknet-io/types-js'
import { useSwitchStarknetChain } from 'src/utils/hooks/useWalletRequest'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { feltToString } from 'src/starknet/starknet'
import { useLatestRef } from 'src/utils/hooks/useLatestRef'
import { getConnectorId, type Connector } from 'src/starknet/wallet'


export const useConnectToSelectedNetwork = (onConnect?: () => void) => {
  const { isConnected, isConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { selectedNetworkConfig } = useDojoSetup()
  const onConnectRef = useLatestRef(onConnect)

  const requestedConnectRef = useRef(false)
  useEffect(() => {
    if (requestedConnectRef.current && isConnected) {
      requestedConnectRef.current = false
      onConnectRef.current?.()
    }
  }, [isConnected, onConnectRef])

  let _connect = useCallback(() => {
    if (isConnected) {
      onConnectRef.current?.()
    } else if (!isConnecting) {
      // get 1st supported connector on this chain
      const connector = selectedNetworkConfig.connectorIds.reduce((acc, id) => {
        return acc ?? connectors.find((connector) => (getConnectorId(connector) == id))
      }, undefined as Connector)
      if (connector) {
        console.log(`>> Connecting with [${getConnectorId(connector)}]...`)
        requestedConnectRef.current = true
        connect({ connector })
      } else {
        requestedConnectRef.current = false
        console.warn(`NO CONNECTOR!`)
      }
    }
  }, [connect, connectors, isConnected, isConnecting, onConnectRef, selectedNetworkConfig.connectorIds])

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
      chainId: `0x${selectedNetworkConfig.chain.id.toString(16)}`,
    }
    return params
  }, [selectedNetworkConfig])
  const { switch_starknet_chain } = useSwitchStarknetChain(switch_params)

  return {
    switch_starknet_chain,
  }
}
