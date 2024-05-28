import { Account, AllowArray, Call, num } from 'starknet'
import { createWorld, World } from '@dojoengine/recs'
import { DojoProvider } from '@dojoengine/core'

export type IDefineContractComponentsFunction = (world: World) => any

export type ISetupNetworkResult<CC extends IDefineContractComponentsFunction> = {
  world: World
  contractComponents: ReturnType<CC>
  execute: DojoProvider['execute']
  executeMulti: DojoProvider['executeMulti']
  call: DojoProvider['call']
}

export const world = createWorld()

export function setupNetwork<CC extends IDefineContractComponentsFunction>(provider: DojoProvider, defineContractComponents: CC): ISetupNetworkResult<CC> {
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