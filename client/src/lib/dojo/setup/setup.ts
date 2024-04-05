import { Account, AccountInterface } from 'starknet'
import { DojoChainConfig, getMasterPredeployedAccount } from '@/lib/dojo/setup/chainConfig'
import { DojoProvider } from '@dojoengine/core'
import { getSyncEntities } from '@dojoengine/state'
import { BurnerManager, PredeployedManager } from '@dojoengine/create-burner'
import { createClientComponents } from './createClientComponents'
import { setupNetwork } from './setupNetwork'
import { feltToString } from '@/lib/utils/starknet'
import { CHAIN_ID } from './chains'
import * as torii from '@dojoengine/torii-client'

// TODO: move out of lib
import { createSystemCalls } from '../../../dojo/createSystemCalls'

export type SetupResult = Awaited<ReturnType<typeof setup>>

/**
 * Sets up the necessary components and network utilities.
 *
 * @returns An object containing network configurations, client components, and system calls.
 */
export async function setup(selectedChainConfig: DojoChainConfig, manifest: any, account: AccountInterface) {

  const toriiClient = await torii.createClient([], {
    rpcUrl: selectedChainConfig.rpcUrl,
    toriiUrl: selectedChainConfig.toriiUrl,
    worldAddress: manifest.world.address || '',
  })

  const dojoProvider = new DojoProvider(manifest, selectedChainConfig.rpcUrl)

  // Initialize the network configuration.
  const network = setupNetwork(dojoProvider)

  // Create client components based on the network setup.
  const components = createClientComponents(network)

  // fetch all existing entities from torii
  await getSyncEntities(
    toriiClient,
    network.contractComponents as any
  )

  // Establish system calls using the network and components.
  //@ts-ignore
  const systemCalls = createSystemCalls(network, components, manifest)

  // create burner manager
  const burnerManager = new BurnerManager({
    // masterAccount: new Account(
    //   dojoProvider.provider,
    //   selectedChainConfig.masterAddress,
    //   selectedChainConfig.masterPrivateKey
    // ),
    masterAccount: account ?? new Account(dojoProvider.provider, '0x0', '0x0'),
    accountClassHash: selectedChainConfig.accountClassHash,
    rpcProvider: dojoProvider.provider,
  });

  await burnerManager.init(true);

  const chainId = feltToString(selectedChainConfig.chain.id) as CHAIN_ID
  const masterPredeployedAccount = getMasterPredeployedAccount(chainId)
  const predeployedManager = new PredeployedManager({
    rpcProvider: dojoProvider.provider,
    predeployedAccounts: [...masterPredeployedAccount, ...selectedChainConfig.predeployedAccounts],
  })

  return {
    manifest,
    dojoProvider,
    toriiClient,
    network,
    components,
    systemCalls,
    burnerManager,
    selectedChainConfig,
    predeployedManager,
  }
}