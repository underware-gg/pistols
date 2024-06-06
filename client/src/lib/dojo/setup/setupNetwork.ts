import { Account, AccountInterface, AllowArray, Call, UniversalDetails } from 'starknet'
import { createWorld, World } from '@dojoengine/recs'
import { DojoCall, DojoProvider } from '@dojoengine/core'

export type IDefineContractComponentsFunction = (world: World) => any

export type ISetupNetworkResult<CC extends IDefineContractComponentsFunction> = {
  world: World
  contractComponents: ReturnType<CC>
  execute: DojoProvider['execute']
  call: DojoProvider['call'] // call(call: DojoCall | Call): Promise<Result>;
}

export const world = createWorld()

export function setupNetwork<CC extends IDefineContractComponentsFunction>(provider: DojoProvider, defineContractComponents: CC): ISetupNetworkResult<CC> {
  return {
    world,
    contractComponents: defineContractComponents(world),
    // execute: async (signer: Account, contract: string, system: string, call_data: num.BigNumberish[]) => {
    execute: async (account: Account | AccountInterface, call: AllowArray<DojoCall | Call>, details?: UniversalDetails) => {
      return provider.execute(account, call, details)
    },
    // call: async (contract: string, system: string, call_data: num.BigNumberish[]) => {
    call: async (call: DojoCall | Call) => {
      return provider.call(call)
    },
  }
}