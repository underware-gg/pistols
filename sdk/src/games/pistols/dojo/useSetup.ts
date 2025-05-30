import { useEffect, useMemo } from 'react'
import { init, SDK, SDKConfig } from '@dojoengine/sdk'
import { DojoProvider } from '@dojoengine/core'
import { useMemoAsync } from 'src/utils/hooks/useMemoAsync'
import { useMounted } from 'src/utils/hooks/useMounted'
import { DojoAppConfig } from 'src/dojo/contexts/Dojo'
import { DojoNetworkConfig } from 'src/games/pistols/config/networks'
import { useDeployedSystem } from 'src/dojo/hooks/useDojoSystem'
import { createSystemCalls } from 'src/games/pistols/dojo/createSystemCalls'
import { setupWorld } from 'src/games/pistols/generated/contracts.gen'
import { PistolsSchemaType } from 'src/games/pistols/sdk/types_web'

export type SetupResult = ReturnType<typeof useSetup> | null

export function useSetup(dojoAppConfig: DojoAppConfig, selectedNetworkConfig: DojoNetworkConfig, env?: any) {

  const rpcUrl = (env?.RPC_URL || selectedNetworkConfig.rpcUrl);
  const toriiUrl = (env?.TORII_URL || selectedNetworkConfig.toriiUrl);
  const relayUrl = (env?.TORII_RELAY_URL || selectedNetworkConfig.relayUrl);

  // avoid double effects
  const mounted = useMounted()

  //
  // All hooks must return:
  // - undefined: while processing
  // - null: when error
  // - object or true: when success
  //

  const chainId = useMemo(() => (selectedNetworkConfig.chainId), [selectedNetworkConfig])

  const manifest = useMemo(() => {
    return dojoAppConfig.manifest ?? null
  }, [dojoAppConfig])

  const starknetDomain = useMemo(() => {
    return dojoAppConfig.starknetDomain ?? null
  }, [dojoAppConfig])

  const sdkConfig = useMemo(() => {
    if (!starknetDomain) return undefined
    if (!manifest) return null
    let config: SDKConfig = {
      client: {
        // rpcUrl,
        toriiUrl,
        relayUrl,
        worldAddress: manifest.world.address ?? '',
      },
      domain: starknetDomain,
    }
    return config
  }, [manifest, starknetDomain, toriiUrl, relayUrl])

  //
  // Provider setup
  const {
    value: dojoProvider,
    isError: dojoProviderIsError,
  } = useMemoAsync<DojoProvider>(async () => {
    if (!mounted) return undefined
    if (!manifest) return null
    const dojoProvider = new DojoProvider(manifest, rpcUrl)
    console.log(`DojoProvider:`, dojoProvider)
    return dojoProvider
  }, [mounted, selectedNetworkConfig, manifest], undefined, null)

  //
  // Torii setup
  const {
    value: sdk,
    isError: sdkIsError,
  } = useMemoAsync(async () => {
    if (!mounted) return undefined
    if (!dojoProvider) return undefined
    if (!sdkConfig) return null
    console.log(`TORII CLIENT...`, sdkConfig)
    const sdk: SDK<PistolsSchemaType> = await init<PistolsSchemaType>(sdkConfig);
    console.log(`TORII CLIENT OK!`)
    return sdk
  }, [mounted, selectedNetworkConfig, sdkConfig, dojoProvider], undefined, null)

  //
  // Check world deployment
  const { isDeployed } = useDeployedSystem(dojoAppConfig.namespace, dojoAppConfig.mainContractName, manifest)

  //
  // Contract calls
  const {
    value: contractCalls,
    isError: contractCallsIsError,
  } = useMemoAsync<ReturnType<typeof setupWorld>>(async () => {
    if (!mounted) return undefined
    if (!dojoProvider) return (dojoProvider as any) // undefined or null
    return await setupWorld(dojoProvider)
  }, [mounted, dojoProvider], undefined, null)

  //
  // Establish system calls using the network and components.
  const systemCalls = useMemo<ReturnType<typeof createSystemCalls>>(() => {
    if (!manifest) return null
    if (!dojoProvider) return (dojoProvider as any) // undefined or null
    if (!contractCalls) return (contractCalls as any) // undefined or null
    return createSystemCalls(dojoProvider, manifest, contractCalls, selectedNetworkConfig) ?? null
  }, [manifest, dojoProvider, contractCalls, selectedNetworkConfig, chainId])

  //
  // Status

  const isLoading = (
    (sdk === undefined) ||
    (dojoProvider === undefined) ||
    (contractCalls === undefined) ||
    (systemCalls === undefined)
  )
  const loadingMessage = (isLoading ? 'Loading Pistols...' : null)

  const errorMessage =
    !manifest ? 'Game not Deployed'
      : dojoProviderIsError ? 'Chain Provider is Unavailable'
        : sdkIsError ? 'Game Indexer is Unavailable'
          : isDeployed === null ? 'World not Found'
            : null
  const isError = (errorMessage != null)

  useEffect(() => {
    if (errorMessage) {
      console.warn(`useSetup() error:`, errorMessage)
    }
  }, [errorMessage])

  return isLoading ? null : {
    // resolved
    dojoProvider,
    sdk,
    sdkConfig,
    contractCalls,
    systemCalls,
    // pass thru
    dojoAppConfig,
    selectedNetworkConfig,
    namespace: dojoAppConfig.namespace,
    manifest,
    starknetDomain,
    // status
    status: {
      isReady: (!isLoading && !isError),
      isLoading: (isLoading && !isError),
      loadingMessage,
      isError,
      errorMessage,
    }
  }
}
