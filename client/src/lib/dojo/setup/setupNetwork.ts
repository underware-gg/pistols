import { Account, AccountInterface, AllowArray, Call, UniversalDetails } from 'starknet'
import { createWorld, World } from '@dojoengine/recs'
import { DojoCall, DojoProvider } from '@dojoengine/core'

export type IDefineContractComponentsFunction = (world: World) => any;
export type IDefineContractConstantsFunction = () => any;

export type ISetupNetworkResult<
  CCOMP extends IDefineContractComponentsFunction,
  CCONST extends IDefineContractConstantsFunction,
> = {
  world: World
  contractComponents: ReturnType<CCOMP>
  contractConstants: ReturnType<CCONST>
  execute: DojoProvider['execute']
  call: DojoProvider['call'] // call(call: DojoCall | Call): Promise<Result>;
};

export const world = createWorld();

export function setupNetwork<
  CCOMP extends IDefineContractComponentsFunction,
  CCONST extends IDefineContractConstantsFunction
>(provider: DojoProvider, defineContractComponents: CCOMP, defineContractConstants: CCONST): ISetupNetworkResult<CCOMP, CCONST> {
  return {
    world,
    contractComponents: defineContractComponents(world),
    contractConstants: defineContractConstants(),
    // execute: async (signer: Account, contract: string, system: string, call_data: num.BigNumberish[]) => {
    execute: async (account: Account | AccountInterface, call: AllowArray<DojoCall | Call>, nameSpace: string, details?: UniversalDetails) => {
      return provider.execute(account, call, nameSpace, details)
    },
    // call: async (contract: string, system: string, call_data: num.BigNumberish[]) => {
    call: async (nameSpace: string, call: DojoCall | Call) => {
      return provider.call(nameSpace, call)
    },
  }
}