import { Account, num } from 'starknet'
import { DojoProvider } from '@dojoengine/core'
import { defineContractComponents } from './contractComponents'
import { world } from './world'

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>

export async function setupNetwork(provider: DojoProvider) {
  return {
    world,
    contractComponents: defineContractComponents(world),
    execute: async (signer: Account, contract: string, system: string, call_data: num.BigNumberish[]) => {
      //@ts-ignore
      return provider.execute(signer, contract, system, call_data)
    },
    call: async (contract: string, system: string, call_data: num.BigNumberish[]) => {
      return provider.call(contract, system, call_data)
    },
  }
}