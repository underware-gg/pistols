import { World } from '@dojoengine/recs'
import { world } from './world';

export type IDefineContractComponentsFunction = (world: World) => any;

export type ISetupNetworkResult<
  CC extends IDefineContractComponentsFunction,
> = {
  world: World
  contractComponents: ReturnType<CC>
};

export function setupNetwork<
  CC extends IDefineContractComponentsFunction,
>(defineContractComponents: CC): ISetupNetworkResult<CC> {
  return {
    world,
    contractComponents: defineContractComponents(world),
  }
}