import { useEffect, useMemo } from 'react'
import { RpcProvider } from 'starknet'
import { argent, braavos, Connector, injected } from '@starknet-react/core'
import { StarknetWindowObject } from 'get-starknet-core'
import { DojoPredeployedStarknetWindowObject, PredeployedManager } from '@dojoengine/create-burner'
import { useControllerConnector } from '@/lib/dojo/hooks/useController'
import { DojoChainConfig } from '@/lib/dojo/setup/chains'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { assert } from '@/lib/utils/math'
import { useAsyncMemo } from '@/lib/utils/hooks/useAsyncMemo'

export const supportedConnetorIds = {
  CONTROLLER: 'controller',
  // ARGENT: argent().id,
  // BRAAVOS: braavos().id,
  DOJO_PREDEPLOYED: DojoPredeployedStarknetWindowObject.getId(),
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

  useEffect(() => {
    if (controller) {
      assert(controller.id == supportedConnetorIds.CONTROLLER, `CartridgeConnector id does not match [${controller.id}]`)
    }
  }, [controller])

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
      if (id == argent().id) acc.push(argent())
      if (id == braavos().id) acc.push(braavos())
      if (id == controller.id) acc.push(controller)
      if (id == DojoPredeployedStarknetWindowObject.getId() && typeof window !== 'undefined') {
        acc.push(injected({ id }))
        promise = _initPredeployed()
      }
      return acc
    }, [])
    // wait for connectors to be initialized...
    if (promise) {
      await promise
    }
    return result
  }, [chainConfig], [], null)

  return connectorIds
}