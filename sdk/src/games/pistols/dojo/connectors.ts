import { useMemo } from 'react'
import {
  Connector,
  // injected,
  // argent, braavos,
} from '@starknet-react/core'
import { usePredeployedConnector } from 'src/utils/hooks/usePredeployedConnector'
import { DojoAppConfig } from 'src/dojo/contexts/Dojo'
import { DojoNetworkConfig, supportedConnetorIds } from 'src/games/pistols/config/networks'

export const getConnectorIcon = (connector: Connector): string  => {
  if (!connector) return null
  if (typeof connector.icon === 'string') return connector.icon
  return connector.icon.dark
}

export const useChainConnectors = (dojoAppConfig: DojoAppConfig, chainConfig: DojoNetworkConfig) => {

  // Predeployed connector
  const { predeployed } = usePredeployedConnector(chainConfig.rpcUrl, chainConfig.chainId, chainConfig.predeployedAccounts)

  const connectorIds = useMemo<Connector[]>(() => {
    const result = chainConfig.connectorIds.reduce((acc, id) => {
      // if (id == supportedConnetorIds.ARGENT) acc.push(argent())
      // if (id == supportedConnetorIds.BRAAVOS) acc.push(braavos())
      // if (id == supportedConnetorIds.CONTROLLER) acc.push(controller())
      if (id == supportedConnetorIds.CONTROLLER && dojoAppConfig.controllerConnector) acc.push(dojoAppConfig.controllerConnector)
      if (id == supportedConnetorIds.PREDEPLOYED && typeof window !== 'undefined') acc.push(predeployed())
      return acc
    }, [])
    return result
  }, [dojoAppConfig, chainConfig])

  return connectorIds
}