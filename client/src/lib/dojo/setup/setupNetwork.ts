import { World } from '@dojoengine/recs'
import { world } from './world';

export type IDefineContractComponentsFunction = (world: World) => any;
export type IDefineContractConstantsFunction = () => any;

export type ISetupNetworkResult<
  CCOMP extends IDefineContractComponentsFunction,
  CCONST extends IDefineContractConstantsFunction,
> = {
  world: World
  contractComponents: ReturnType<CCOMP>
  contractConstants: ReturnType<CCONST>
};

export function setupNetwork<
  CCOMP extends IDefineContractComponentsFunction,
  CCONST extends IDefineContractConstantsFunction
>(defineContractComponents: CCOMP, defineContractConstants: CCONST): ISetupNetworkResult<CCOMP, CCONST> {
  return {
    world,
    contractComponents: defineContractComponents(world),
    contractConstants: defineContractConstants(),
  }
}