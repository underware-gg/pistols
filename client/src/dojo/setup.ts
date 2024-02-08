import { Account } from 'starknet'
import { DojoConfig, DojoProvider } from '@dojoengine/core'
import { getSyncEntities } from '@dojoengine/state'
import { BurnerManager } from '@dojoengine/create-burner'
import { setupNetwork } from './setupNetwork'
import { createClientComponents } from './createClientComponents'
import { createSystemCalls } from './createSystemCalls'
import * as torii from '@dojoengine/torii-client'

export type SetupResult = Awaited<ReturnType<typeof setup>>

/**
 * Sets up the necessary components and network utilities.
 *
 * @returns An object containing network configurations, client components, and system calls.
 */
export async function setup({ ...config }: DojoConfig) {

  const toriiClient = await torii.createClient([], {
    rpcUrl: config.rpcUrl,
    toriiUrl: config.toriiUrl,
    worldAddress: config.manifest.world.address || '',
  })

  const dojoProvider = new DojoProvider(config.manifest, config.rpcUrl)

  // Initialize the network configuration.
  const network = await setupNetwork(dojoProvider)

  // Create client components based on the network setup.
  const components = createClientComponents(network)

  // fetch all existing entities from torii
  await getSyncEntities(
    toriiClient,
    network.contractComponents as any
  )

  // Establish system calls using the network and components.
  //@ts-ignore
  const systemCalls = createSystemCalls(network)

  // create burner manager
  const burnerManager = new BurnerManager({
    masterAccount: new Account(
      dojoProvider.provider,
      config.masterAddress,
      config.masterPrivateKey
    ),
    accountClassHash: config.accountClassHash,
    rpcProvider: dojoProvider.provider,
  });

  // if (burnerManager.list().length === 0) {
  //   try {
  //     await burnerManager.create();
  //   } catch (e) {
  //     console.error(`setup() error:`, e);
  //   }
  // }

  burnerManager.init();

  return {
    config,
    dojoProvider,
    toriiClient,
    network,
    components,
    systemCalls,
    burnerManager,
  }
}