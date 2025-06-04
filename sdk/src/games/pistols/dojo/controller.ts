import { Connector } from '@starknet-react/core'
import type { Tokens } from '@cartridge/controller'
import { getNetworkConfig, NetworkId } from 'src/games/pistols/config/networks'
import { makeControllerConnector } from 'src/games/pistols/dojo/controller_connector'
import { makePistolsPolicies } from 'src/games/pistols/dojo/policies'
import {
  getLordsAddress,
  getFameAddress,
  getFoolsAddress,
  getDuelistTokenAddress,
  getDuelTokenAddress,
  getPackTokenAddress,
  NAMESPACE,
} from 'src/games/pistols/config/config'

export const makePistolsControllerConnector = (networkId: NetworkId, env?: any): Connector => {
  const tokens: Tokens = {
    erc20: [
      getLordsAddress(networkId),
      // getFameAddress(networkId),
      getFoolsAddress(networkId),
    ],
    //@ts-ignore
    erc721: [
      getDuelistTokenAddress(networkId),
      getDuelTokenAddress(networkId),
      getPackTokenAddress(networkId),
    ],
  }

  // do not generate policies for Mainnet, as it uses the preset
  const networkConfig = getNetworkConfig(networkId, env)
  const policies = (
    networkId === NetworkId.MAINNET ? undefined
      : makePistolsPolicies(networkId, !Boolean(networkConfig.lordsAddress), false)
  )

  //
  // export controller connector
  return makeControllerConnector(
    'pistols', // preset name
    NAMESPACE,
    networkConfig.chainId,
    networkConfig.rpcUrl,
    networkConfig.slotName,
    policies,
    tokens,
  );
}
