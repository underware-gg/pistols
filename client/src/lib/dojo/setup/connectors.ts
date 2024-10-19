import { useMemo } from 'react'
import {
  Connector, injected,
  // argent, braavos,
} from '@starknet-react/core'
import { RpcProvider } from 'starknet'
import { StarknetWindowObject } from 'get-starknet-core'
import { DojoPredeployedStarknetWindowObject, PredeployedManager } from '@dojoengine/create-burner'
import { useControllerConnector } from '@/lib/dojo/hooks/useController'
import { DojoChainConfig } from '@/lib/dojo/setup/chains'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { useAsyncMemo } from '@/lib/utils/hooks/useAsyncMemo'

export const supportedConnetorIds = {
  CONTROLLER: 'controller', // same as ControllerConnector.id
  // ARGENT: argent().id,
  // BRAAVOS: braavos().id,
  DOJO_PREDEPLOYED: DojoPredeployedStarknetWindowObject.getId(),
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

  const _initPredeployed = async () => {
    const predeployedManager = new PredeployedManager({
      rpcProvider: new RpcProvider({ nodeUrl: chainConfig.rpcUrl }),
      predeployedAccounts: chainConfig.predeployedAccounts.length > 0 ? chainConfig.predeployedAccounts : [{
        name: 'Master Account',
        address: chainConfig.masterAddress,
        privateKey: chainConfig.masterPrivateKey,
        active: false,
      }],
    });
    await predeployedManager.init();
    // cloned from usePredeployedWindowObject()...
    const predeployedWindowObject = new DojoPredeployedStarknetWindowObject(predeployedManager);
    const key = `starknet_${predeployedWindowObject.id}`;
    (window as any)[key as string] = predeployedWindowObject as StarknetWindowObject;
  }

  const {
    value: connectorIds,
    isError,
  } = useAsyncMemo<Connector[]>(async () => {
    let promise: Promise<void> = null
    const result = chainConfig.connectorIds.reduce((acc, id) => {
      // if (id == supportedConnetorIds.ARGENT) acc.push(argent())
      // if (id == supportedConnetorIds.BRAAVOS) acc.push(braavos())
      if (id == supportedConnetorIds.CONTROLLER) acc.push(controller())
      if (id == supportedConnetorIds.DOJO_PREDEPLOYED && typeof window !== 'undefined') {
        acc.push(injected({ id }))
        promise = _initPredeployed()
      }
      return acc
    }, [])
    // wait for connectors to be initialized...
    if (promise) {
      console.warn(`KATANA: Waiting for connectors...`)
      await promise
    }
    return result
  }, [chainConfig], [], null)

  return connectorIds
}