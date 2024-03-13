import { Account, AllowArray, Call, num } from 'starknet'
import { DojoProvider } from '@dojoengine/core'
import { defineContractComponents } from './contractComponents'
import { world } from './world'
import manifest from '../manifest.json'

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>

export async function setupNetwork(provider: DojoProvider) {
  return {
    world,
    contractComponents: defineContractComponents(world),
    execute: async (signer: Account, contract: string, system: string, call_data: num.BigNumberish[]) => {
      return provider.execute(signer, contract, system, call_data)
    },
    executeMulti: async (signer: Account, calls: AllowArray<Call>) => {
      return provider.executeMulti(signer, calls)
    },
    call: async (contract: string, system: string, call_data: num.BigNumberish[]) => {
      return provider.call(contract, system, call_data)
    },
  }
}