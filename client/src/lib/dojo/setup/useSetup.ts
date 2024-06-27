import { useEffect, useMemo } from 'react'
import { BurnerManager, PredeployedManager } from '@dojoengine/create-burner'
import { getSyncEntities } from '@dojoengine/state'
import { DojoProvider } from '@dojoengine/core'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { useSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useAsyncMemo } from '@/lib/utils/hooks/useAsyncMemo'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { dummyAccount, feltToString } from '@/lib/utils/starknet'
import { Account } from 'starknet'

import { DojoChainConfig, getChainMasterAccount } from './chainConfig'
import { createClientComponents } from './createClientComponents'
import { setupNetwork } from './setupNetwork'
import * as torii from '@dojoengine/torii-client'

// TODO: move out of lib??
import { createSystemCalls, defineContractComponents, type SetupNetworkResult } from './setup'

export type SetupResult = ReturnType<typeof useSetup> | null

export function useSetup(dojoAppConfig: DojoAppConfig, selectedChainConfig: DojoChainConfig, account: Account) {

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
  }, [selectedChainConfig])

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
    value: toriiClient,
    isError: toriiIsError,
  } = useAsyncMemo<torii.Client>(async () => {
    if (!mounted) return undefined
    if (!manifest) return null
    const client = await torii.createClient([], {
      rpcUrl: selectedChainConfig.rpcUrl,
      toriiUrl: selectedChainConfig.toriiUrl,
      relayUrl: selectedChainConfig.relayUrl ?? '',
      worldAddress: manifest?.world?.address ?? '',
    })
    // console.log(`TORII CLIENT OK!`)
    return client
  }, [mounted, selectedChainConfig, manifest], undefined, null)

  //
  // Check world deployment
  const { isDeployed } = useSystem(dojoAppConfig.mainSystemName, manifest)

  //
  // Initialize the network configuration.
  const network = useMemo<SetupNetworkResult>(() => {
    if (!dojoProvider) return (dojoProvider as any) // undefined or null
    return setupNetwork(dojoProvider, defineContractComponents)
  }, [dojoProvider])

  //
  // Create client components based on the network setup.
  const components = useMemo<ReturnType<typeof createClientComponents>>(() => {
    if (!network) return (network as any) // undefined or null
    return createClientComponents(network)
  }, [network])

  //
  // fetch all existing entities from torii
  const { value: subscription } = useAsyncMemo<torii.Subscription>(async () => {
    if (!toriiClient) return (toriiClient as any) // undefined or null
    if (!network) return (network as any) // undefined or null
    const subscription = await getSyncEntities(
      toriiClient,
      network.contractComponents as any,
      [],
    )
    console.log(`SYNC FINISHED!!!`)
    return subscription
  }, [toriiClient, network], undefined, null)

  //
  // Establish system calls using the network and components.
  const systemCalls = useMemo<ReturnType<typeof createSystemCalls>>(() => {
    if (!manifest) return null
    if (!subscription) return (subscription as any) // undefined or null
    if (!network) return (network as any) // undefined or null
    if (!components) return (components as any) // undefined or null
    return createSystemCalls(network, components, manifest) ?? null
  }, [manifest, subscription, network, components])

  //
  // TODO: Move this to DojoContext!
  // must solve the async init problem
  // (the provider cannot have a null burnerManager)
  //
  // create burner manager
  // cannot be null!
  const {
    value: burnerManager,
    isError: burnerManagerIsError,
  } = useAsyncMemo<BurnerManager>(async () => {
    if (!dojoProvider) return (dojoProvider as any) // undefined or null
    const burnerManager = new BurnerManager({
      // master account moved to predeployedManager
      masterAccount: account ?? dummyAccount(dojoProvider.provider),
      accountClassHash: selectedChainConfig.accountClassHash,
      feeTokenAddress: selectedChainConfig.chain.nativeCurrency.address,
      rpcProvider: dojoProvider.provider,
    });
    await burnerManager.init(true);
    return burnerManager
  }, [selectedChainConfig, dojoProvider, account], undefined, null)

  //
  // Predeployed accounts
  // (includes master account)
  // can be null
  const {
    value: predeployedManager,
    isError: predeployedManagerIsError,
  } = useAsyncMemo<PredeployedManager>(async () => {
    if (!dojoProvider) return (dojoProvider as any) // undefined or null
    let predeployedAccounts = [...selectedChainConfig.predeployedAccounts]
    const masterAccount = getChainMasterAccount(chainId)
    if (masterAccount) {
      predeployedAccounts.push(masterAccount)
    }
    const predeployedManager = new PredeployedManager({
      rpcProvider: dojoProvider.provider,
      predeployedAccounts,
    })
    await predeployedManager.init()
    return predeployedManager
  }, [selectedChainConfig, dojoProvider], undefined, null)

  //
  // Status

  const isLoading = !(
    (toriiClient !== undefined) &&
    (dojoProvider !== undefined) &&
    (network !== undefined) &&
    (components !== undefined) &&
    (subscription !== undefined) &&
    (systemCalls !== undefined) &&
    (burnerManager !== undefined) &&
    (predeployedManager !== undefined)
  )
  const loadingMessage = (isLoading ? 'Loading Pistols...' : null)

  const errorMessage =
    !manifest ? 'Game not Deployed'
      : dojoProviderIsError ? 'Chain Provider is Unavailable'
        : toriiIsError ? 'Game Indexer is Unavailable'
          : subscription === null ? 'Sync Error'
            : isDeployed === null ? 'World not Found'
              : burnerManagerIsError ? 'Burner Manager error'
                : predeployedManagerIsError ? 'Predeployed Manager error'
                  : null
  const isError = (errorMessage != null)

  useEffect(() => {
    if (errorMessage) {
      console.warn(`useSetup() error:`, errorMessage)
    }
  }, [errorMessage])

  // console.log(`setting up...`, isLoading, loadingMessage, isError, errorMessage, burnerManager)

  return isLoading ? null : {
    // resolved
    dojoProvider,
    toriiClient,
    network,
    components,
    systemCalls,
    burnerManager,
    predeployedManager,
    // pass thru
    dojoAppConfig,
    selectedChainConfig,
    manifest,
    // status
    status: {
      isLoading: (isLoading && !isError),
      loadingMessage,
      isError,
      errorMessage,
    }
  }
}
