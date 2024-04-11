import { useMemo } from 'react'
import { useAsyncMemo } from '@/lib/utils/hooks/useAsyncMemo'
import { Account } from 'starknet'
import { DojoProvider } from '@dojoengine/core'
import { getSyncEntities } from '@dojoengine/state'
import { BurnerManager, PredeployedManager } from '@dojoengine/create-burner'
import * as torii from '@dojoengine/torii-client'

import { DojoChainConfig, getMasterPredeployedAccount } from '@/lib/dojo/setup/chainConfig'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { feltToString } from '@/lib/utils/starknet'
import { createClientComponents } from './createClientComponents'
import { setupNetwork } from './setupNetwork'
import { CHAIN_ID } from './chains'

// TODO: move out of lib
import { createSystemCalls } from '../../../dojo/createSystemCalls'

export type SetupResult = ReturnType<typeof useSetup> | null

export function useSetup(selectedChainConfig: DojoChainConfig, manifest: any, account: Account) {

  const mounted = useMounted()

  const { value: toriiClient } = useAsyncMemo(async ()=> {
    if (!mounted) return null
    const client = await torii.createClient([], {
      rpcUrl: selectedChainConfig.rpcUrl,
      toriiUrl: selectedChainConfig.toriiUrl,
      relayUrl: selectedChainConfig.relayUrl ?? '',
      worldAddress: manifest.world.address ?? '',
    })
    // console.log(`TORII CLIENT OK!`)
    return client
  }, [mounted, selectedChainConfig, manifest], null)

  const { value: dojoProvider } = useAsyncMemo(async ()=> {
    if (!mounted) return null
    const dojoProvider = new DojoProvider(manifest, selectedChainConfig.rpcUrl)
    console.log(`DojoProvider:`, feltToString(await dojoProvider.provider.getChainId()), dojoProvider)
    return dojoProvider
  }, [mounted, selectedChainConfig, manifest], null)

  // Initialize the network configuration.
  const network = useMemo(() => {
    return dojoProvider ? setupNetwork(dojoProvider) : null
  }, [dojoProvider])

  // Create client components based on the network setup.
  const components = useMemo(() => {
    return network ? createClientComponents(network) : null
  }, [network])

  // fetch all existing entities from torii
  const { value: syncFinished } = useAsyncMemo(async () => {
    if (!toriiClient || !network) return false
    await getSyncEntities(
      toriiClient,
      network.contractComponents as any
    )
    return true
  }, [toriiClient, network], false)

  // Establish system calls using the network and components.
  const systemCalls = useMemo(() => {
    return (syncFinished && network && components) ? createSystemCalls(network, components, manifest) : null
  }, [syncFinished, network, components, manifest])

  //
  // TODO: Move this to DojoContext!
  // must solve the async init problem
  // (the provider cannot have a null burnerManager)
  //
  // create burner manager
  const { value: burnerManager } = useAsyncMemo(async () => {
    if (!dojoProvider) return null
    const burnerManager = new BurnerManager({
      // master account moved to predeployedManager
      masterAccount: account ?? new Account(dojoProvider.provider, '0x0', '0x0'),
      accountClassHash: selectedChainConfig.accountClassHash,
      rpcProvider: dojoProvider.provider,
      feeTokenAddress: selectedChainConfig.chain.nativeCurrency.address,
    });
    await burnerManager.init(true);
    return burnerManager
  }, [selectedChainConfig, dojoProvider, account], null)

  // Predeployed accounts
  // (includes master account)
  const { value: predeployedManager } = useAsyncMemo(async () => {
    if (!dojoProvider) return null
    const chainId = feltToString(selectedChainConfig.chain.id) as CHAIN_ID
    const masterPredeployedAccount = getMasterPredeployedAccount(chainId)
    const predeployedManager = new PredeployedManager({
      rpcProvider: dojoProvider.provider,
      predeployedAccounts: [...masterPredeployedAccount, ...selectedChainConfig.predeployedAccounts],
    })
    await predeployedManager.init()
    // console.log(`PREDEPLOYED......`, predeployedManager)
    return predeployedManager
  }, [selectedChainConfig, dojoProvider], null)

  const isFinished = (
    toriiClient != null &&
    dojoProvider != null &&
    network != null &&
    components != null &&
    syncFinished &&
    systemCalls != null &&
    burnerManager != null &&
    predeployedManager != null
  )

  return !isFinished ? null : {
    // resolved
    dojoProvider,
    toriiClient,
    network,
    components,
    systemCalls,
    burnerManager,
    predeployedManager,
    // pass thru
    manifest,
    selectedChainConfig,
  }
}
