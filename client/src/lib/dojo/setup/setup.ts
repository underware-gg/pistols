import { type ISetupNetworkResult } from './setupNetwork'

// TODO: move out of lib
import { createSystemCalls } from '../../../games/pistols/createSystemCalls'
import { defineContractComponents } from '../../../games/pistols/generated/dev/contractComponents'
import { defineContractConstants } from '../../../games/pistols/generated/dev/contractConstants'

export type SetupNetworkResult = ISetupNetworkResult<
  typeof defineContractComponents,
  typeof defineContractConstants
>;

export { createSystemCalls, defineContractComponents, defineContractConstants };
