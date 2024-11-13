import { useEffect, useMemo } from 'react'
import { init } from '@dojoengine/sdk'
import { overridableComponent } from "@dojoengine/recs";
import { getSyncEntities } from '@dojoengine/state'
import { DojoProvider } from '@dojoengine/core'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { useDeployedSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useAsyncMemo } from '@/lib/utils/hooks/useAsyncMemo'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { feltToString } from '@/lib/utils/starknet'
import { DojoChainConfig } from './chainConfig'
import { world } from "./world";
import { Subscription } from '@dojoengine/torii-client'

// TODO: move out of lib??
import {
  createSystemCalls,
  defineContractComponents,
  schema,
} from './setup'

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
  const { isDeployed } = useDeployedSystem(dojoAppConfig.nameSpace, Object.keys(dojoAppConfig.contractInterfaces)[0], manifest)

  //
  // Initialize components
  const contractComponents = useMemo(() => defineContractComponents(world), [world])

  const components = useMemo(() => {
    const overridableComponents = Object.keys(contractComponents).reduce((result: any, key: string) => {
      result[key] = overridableComponent(contractComponents[key]);
      return result;
    }, {}) as typeof contractComponents;
    return {
      ...contractComponents,
      ...overridableComponents,
    };

  }, [contractComponents])

  //
  // fetch all existing entities from torii
  const { value: sync } = useAsyncMemo<Subscription>(async () => {
    if (!sdk) return (sdk as any) // undefined or null
    const sync = await getSyncEntities(
      sdk.client,
      contractComponents as any,
      undefined,  // clause
      [],         // entityKeyClause
      1000,       // limit
      true,       // logging
    )
    console.log(`SYNC FINISHED!!!`, sync, components)
    return sync
  }, [sdk?.client, contractComponents], undefined, null)

  //
  // Establish system calls using the network and components.
  const systemCalls = useMemo<ReturnType<typeof createSystemCalls>>(() => {
    if (!manifest) return null
    if (!sync) return (sync as any) // undefined or null
    if (!components) return (components as any) // undefined or null
    if (!dojoProvider) return (dojoProvider as any) // undefined or null
    return createSystemCalls(components, manifest, dojoProvider) ?? null
  }, [manifest, sync, components, dojoProvider])

  //
  // Status

  const isLoading = !(
    (sdk !== undefined) &&
    (dojoProvider !== undefined) &&
    (components !== undefined) &&
    (sync !== undefined) &&
    (systemCalls !== undefined)
  )
  const loadingMessage = (isLoading ? 'Loading Pistols...' : null)

  const errorMessage =
    !manifest ? 'Game not Deployed'
      : dojoProviderIsError ? 'Chain Provider is Unavailable'
        : sdkIsError ? 'Game Indexer is Unavailable'
          : sync === null ? 'Sync Error'
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
    contractComponents,
    components,
    sync,
    systemCalls,
    // pass thru
    dojoAppConfig,
    selectedChainConfig,
    nameSpace: dojoAppConfig.nameSpace,
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
