import { Connector } from '@starknet-react/core'
import type { Tokens } from '@cartridge/controller'
import { NetworkId, pistolsNetworkConfigs, DEFAULT_NETWORK_ID } from 'src/games/pistols/config/networks'
import { makeControllerConnector } from 'src/dojo/setup/controller'
import {
  getLordsAddress,
  getFameAddress,
  // getFoolsAddress,
  getDuelistTokenAddress,
  getDuelTokenAddress,
  getPackTokenAddress,
  makePistolsPolicies,
  NAMESPACE,
} from './config'

//------------------------------------------
// config Controller for default network only!
//

if (!pistolsNetworkConfigs[DEFAULT_NETWORK_ID]) {
  throw new Error(`Network config not found for DEFAULT_NETWORK_ID: [${DEFAULT_NETWORK_ID}]`)
}

const tokens: Tokens = {
  erc20: [
    getLordsAddress(DEFAULT_NETWORK_ID),
    getFameAddress(DEFAULT_NETWORK_ID),
    // getFoolsAddress(DEFAULT_NETWORK_ID),
  ],
  //@ts-ignore
  erc721: [
    getDuelistTokenAddress(DEFAULT_NETWORK_ID),
    getDuelTokenAddress(DEFAULT_NETWORK_ID),
    getPackTokenAddress(DEFAULT_NETWORK_ID),
  ],
}

// do not generate policies for Mainnet, as it uses the preset
const policies = (
  DEFAULT_NETWORK_ID === NetworkId.MAINNET ? undefined
    : makePistolsPolicies(DEFAULT_NETWORK_ID, !Boolean(pistolsNetworkConfigs[DEFAULT_NETWORK_ID].lordsAddress), false)
)

//
// export controller connector
export const controllerConnector: Connector = makeControllerConnector(
  'pistols', // theme
  NAMESPACE,
  pistolsNetworkConfigs[DEFAULT_NETWORK_ID].chainId,
  pistolsNetworkConfigs[DEFAULT_NETWORK_ID].rpcUrl,
  pistolsNetworkConfigs[DEFAULT_NETWORK_ID].toriiUrl,
  policies,
  tokens,
);
