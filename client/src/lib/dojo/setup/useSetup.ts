import { useEffect, useMemo } from 'react'
import { init } from '@dojoengine/sdk'
import { DojoProvider } from '@dojoengine/core'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { useDeployedSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useAsyncMemo, useMounted } from '@underware_gg/pistols-sdk/hooks'
import { feltToString } from '@underware_gg/pistols-sdk/utils'
import { DojoChainConfig } from './chainConfig'

// TODO: move out of lib??
import { createSystemCalls } from '../../../games/pistols/createSystemCalls'
import { schema } from '../../../games/pistols/generated/typescript/models.gen'

export type SetupResult = ReturnType<typeof useSetup> | null
export type Schema = typeof schema

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
      schema
    );
    // console.log(`TORII CLIENT OK!`)
    return sdk
  }, [mounted, selectedChainConfig, manifest, starknetDomain], undefined, null)

  //
  // Check world deployment
  const { isDeployed } = useDeployedSystem(dojoAppConfig.namespace, Object.keys(dojoAppConfig.contractPolicyDescriptions)[0], manifest)

  //
  // Establish system calls using the network and components.
  const systemCalls = useMemo<ReturnType<typeof createSystemCalls>>(() => {
    if (!manifest) return null
    if (!dojoProvider) return (dojoProvider as any) // undefined or null
    return createSystemCalls(manifest, dojoProvider) ?? null
  }, [manifest, dojoProvider])

  //
  // Status

  const isLoading = !(
    (sdk !== undefined) &&
    (dojoProvider !== undefined) &&
    (systemCalls !== undefined)
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
