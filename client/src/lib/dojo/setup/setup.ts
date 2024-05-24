import { type ISetupNetworkResult } from './setupNetwork'

// TODO: move out of lib
import { createSystemCalls } from '../../../dojo/createSystemCalls'
import { defineContractComponents } from '../../../dojo/contractComponents'

export type SetupNetworkResult = ISetupNetworkResult<typeof defineContractComponents>

export { createSystemCalls, defineContractComponents }
