import { defineContractComponents } from './contractComponents'
import { world } from './world'
import { DojoProvider, } from '@dojoengine/core'
import { Account, num } from 'starknet'
import manifest from '@/manifest.json'
import * as torii from '@dojoengine/torii-client'

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>

export async function setupNetwork() {
  
  if (!process.env.NEXT_PUBLIC_WORLD_ADDRESS) throw (`NEXT_PUBLIC_WORLD_ADDRESS is null`)
  if (!process.env.NEXT_PUBLIC_NODE_URL) throw (`NEXT_PUBLIC_NODE_URL is null`)
  if (!process.env.NEXT_PUBLIC_TORII) throw (`NEXT_PUBLIC_TORII is null`)

  // Create a new DojoProvider instance.
  const provider = new DojoProvider(process.env.NEXT_PUBLIC_WORLD_ADDRESS, manifest, process.env.NEXT_PUBLIC_NODE_URL)

  const toriiClient = await torii.createClient([], {
    rpcUrl: process.env.NEXT_PUBLIC_NODE_URL,
    toriiUrl: process.env.NEXT_PUBLIC_TORII,
    worldAddress: process.env.NEXT_PUBLIC_WORLD_ADDRESS,
  })

  // Return the setup object.
  return {
    provider,
    world,
    toriiClient,

    // Define contract components for the world.
    contractComponents: defineContractComponents(world),

    // Execute function.
    execute: async (signer: Account, contract: string, system: string, call_data: num.BigNumberish[]) => {
      //@ts-ignore
      return provider.execute(signer, contract, system, call_data)
    },

    // read-only function call
    call: async (contract: string, system: string, call_data: num.BigNumberish[]) => {
      return provider.call(contract, system, call_data)
    },
  }
}