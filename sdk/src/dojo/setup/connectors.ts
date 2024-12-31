import { useMemo } from 'react'
import {
  Connector,
  // injected,
  // argent, braavos,
} from '@starknet-react/core'
import { usePredeployedConnector } from 'src/utils/hooks/usePredeployedConnector'
import { DojoAppConfig } from 'src/dojo/contexts/Dojo'
import { DojoChainConfig } from 'src/dojo/setup/chains'
import { PREDEPLOYED_ID } from 'src/utils/misc/predeployed'

export const supportedConnetorIds = {
  CONTROLLER: 'controller', // same as ControllerConnector.id
  // ARGENT: argent().id,
  // BRAAVOS: braavos().id,
  PREDEPLOYED: PREDEPLOYED_ID,
}

export const getConnectorIcon = (connector: Connector): string  => {
  if (!connector) return null
  if (typeof connector.icon === 'string') return connector.icon
  return connector.icon.dark
}

export const useChainConnectors = (dojoAppConfig: DojoAppConfig, chainConfig: DojoChainConfig) => {

  // Predeployed connector
  const { predeployed } = usePredeployedConnector(chainConfig.rpcUrl, chainConfig.chainId, chainConfig.predeployedAccounts)

  const connectorIds = useMemo<Connector[]>(() => {
    const result = chainConfig.connectorIds.reduce((acc, id) => {
      // if (id == supportedConnetorIds.ARGENT) acc.push(argent())
      // if (id == supportedConnetorIds.BRAAVOS) acc.push(braavos())
      // if (id == supportedConnetorIds.CONTROLLER) acc.push(controller())
      if (id == supportedConnetorIds.CONTROLLER) acc.push(dojoAppConfig.controllerConnector)
      if (id == supportedConnetorIds.PREDEPLOYED && typeof window !== 'undefined') acc.push(predeployed())
      return acc
    }, [])
    return result
  }, [chainConfig])

  return connectorIds
}