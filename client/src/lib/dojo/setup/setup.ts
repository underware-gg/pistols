import { Account } from 'starknet'
import { DojoChainConfig } from '@/lib/dojo/setup/chainConfig'
import { DojoProvider } from '@dojoengine/core'
import { getSyncEntities } from '@dojoengine/state'
import { BurnerManager } from '@dojoengine/create-burner'
import { setupNetwork } from './setupNetwork'
import { createClientComponents } from './createClientComponents'
import * as torii from '@dojoengine/torii-client'

// TODO: move out of lib
import { createSystemCalls } from '../../../dojo/createSystemCalls'

export type SetupResult = Awaited<ReturnType<typeof setup>>

/**
 * Sets up the necessary components and network utilities.
 *
 * @returns An object containing network configurations, client components, and system calls.
 */
export async function setup(dojoChainConfig: DojoChainConfig, manifest: any) {

  const toriiClient = await torii.createClient([], {
    rpcUrl: dojoChainConfig.rpcUrl,
    toriiUrl: dojoChainConfig.toriiUrl,
    worldAddress: manifest.world.address || '',
  })

  const dojoProvider = new DojoProvider(manifest, dojoChainConfig.rpcUrl)

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
    masterAccount: new Account(
      dojoProvider.provider,
      dojoChainConfig.masterAddress,
      dojoChainConfig.masterPrivateKey
    ),
    accountClassHash: dojoChainConfig.accountClassHash,
    rpcProvider: dojoProvider.provider,
  });

  await burnerManager.init(true);

  return {
    manifest,
    dojoChainConfig,
    dojoProvider,
    toriiClient,
    network,
    components,
    systemCalls,
    burnerManager,
  }
}