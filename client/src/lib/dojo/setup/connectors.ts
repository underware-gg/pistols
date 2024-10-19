import { useMemo } from 'react'
import {
  Connector, injected,
  // argent, braavos,
} from '@starknet-react/core'
import { RpcProvider } from 'starknet'
import { StarknetWindowObject } from 'get-starknet-core'
import { useControllerConnector } from '@/lib/dojo/hooks/useController'
import { usePredeployedConnector, PREDEPLOYED_ID } from '@/lib/utils/hooks/usePredeployedConnector'
import { DojoChainConfig } from '@/lib/dojo/setup/chains'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { useAsyncMemo } from '@/lib/utils/hooks/useAsyncMemo'

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

  // Cartridge Controller
  const manifest = useMemo(() => (dojoAppConfig.manifests[chainConfig.chainId] ?? null), [chainConfig])
  const { controller } = useControllerConnector(
    manifest,
    chainConfig.rpcUrl,
    dojoAppConfig.nameSpace,
    dojoAppConfig.contractInterfaces,
  )

  // Predeployed Controller
  const { predeployed } = usePredeployedConnector(chainConfig)

  const connectorIds = useMemo<Connector[]>(() => {
    const result = chainConfig.connectorIds.reduce((acc, id) => {
      // if (id == supportedConnetorIds.ARGENT) acc.push(argent())
      // if (id == supportedConnetorIds.BRAAVOS) acc.push(braavos())
      if (id == supportedConnetorIds.CONTROLLER) acc.push(controller())
      if (id == supportedConnetorIds.PREDEPLOYED && typeof window !== 'undefined') acc.push(predeployed())
      return acc
    }, [])
    return result
  }, [chainConfig])

  return connectorIds
}