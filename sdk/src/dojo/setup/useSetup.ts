import { useEffect, useMemo } from 'react'
import { init } from '@dojoengine/sdk'
import { DojoProvider } from '@dojoengine/core'
import { useAsyncMemo } from 'src/utils/hooks/useAsyncMemo'
import { useMounted } from 'src/utils/hooks/useMounted'
import { feltToString } from 'src/utils/misc/starknet'
import { DojoAppConfig } from 'src/dojo/contexts/Dojo'
import { DojoChainConfig } from 'src/dojo/setup/chains'
import { useDeployedSystem } from 'src/dojo/hooks/useDojoSystem'
import { createSystemCalls } from 'src/games/pistols/config/createSystemCalls'
import { setupWorld } from 'src/games/pistols/generated/contracts.gen'
import * as models from 'src/games/pistols/generated/models.gen'

export type SetupResult = ReturnType<typeof useSetup> | null
export type Schema = typeof models.schema

export function useSetup(dojoAppConfig: DojoAppConfig, selectedChainConfig: DojoChainConfig) {

  // avoid double effects
  const mounted = useMounted()

  //
  // All hooks must return:
  // - undefined: while processing
  // - null: when error
  // - object or true: when success
  //

  const chainId = useMemo(() => (selectedChainConfig.chainId), [selectedChainConfig])

  const manifest = useMemo(() => {
    return dojoAppConfig.manifests[chainId] ?? null
  }, [dojoAppConfig, chainId])

  const starknetDomain = useMemo(() => {
    return dojoAppConfig.starknetDomain ?? null
  }, [dojoAppConfig])

  //
  // Provider setup
  const {
    value: dojoProvider,
    isError: dojoProviderIsError,
  } = useAsyncMemo<DojoProvider>(async () => {
    if (!mounted) return undefined
    if (!manifest) return null
    const dojoProvider = new DojoProvider(manifest, selectedChainConfig.rpcUrl)
    console.log(`DojoProvider:`, feltToString(await dojoProvider.provider.getChainId()), dojoProvider)
    return dojoProvider
  }, [mounted, selectedChainConfig, manifest], undefined, null)

  //
  // Torii setup
  const {
    value: sdk,
    isError: sdkIsError,
  } = useAsyncMemo(async () => {
    if (!mounted) return undefined
    if (!starknetDomain) return undefined
    if (!manifest) return null
    const sdk = await init<Schema>(
      {
        client: {
          rpcUrl: selectedChainConfig.rpcUrl,
          toriiUrl: selectedChainConfig.toriiUrl,
          relayUrl: selectedChainConfig.relayUrl ?? '',
          worldAddress: manifest.world.address ?? '',
        },
        domain: starknetDomain,
      },
      models.schema
    );
    // console.log(`TORII CLIENT OK!`)
    return sdk
  }, [mounted, selectedChainConfig, manifest, starknetDomain], undefined, null)

  //
  // Check world deployment
  const { isDeployed } = useDeployedSystem(dojoAppConfig.namespace, Object.keys(dojoAppConfig.contractPolicyDescriptions)[0], manifest)

  //
  // Contract calls
  const {
    value: contractCalls,
    isError: contractCallsIsError,
  } = useAsyncMemo<ReturnType<typeof setupWorld>>(async () => {
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
    return createSystemCalls(dojoProvider, manifest, contractCalls, selectedChainConfig) ?? null
  }, [manifest, dojoProvider, contractCalls, selectedChainConfig])

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
    contractCalls,
    systemCalls,
    // pass thru
    dojoAppConfig,
    selectedChainConfig,
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
