import { type ISetupNetworkResult } from './setupNetwork'

// TODO: move out of lib
import { createSystemCalls } from '../../../games/pistols/createSystemCalls'
import { defineContractComponents } from '../../../games/pistols/generated/contractComponents'

export type SetupNetworkResult = ISetupNetworkResult<typeof defineContractComponents>;

export { createSystemCalls, defineContractComponents };
