import { Connector } from '@starknet-react/core'
import type { Tokens } from '@cartridge/controller'
import { NetworkId, NETWORKS } from 'src/games/pistols/config/networks'
import { makeControllerConnector } from 'src/dojo/setup/controller'
import {
  getLordsAddress,
  getFameAddress,
  getFoolsAddress,
  getDuelistTokenAddress,
  getDuelTokenAddress,
  getPackTokenAddress,
  makePistolsPolicies,
  NAMESPACE,
} from './config'

export const makePistolsControllerConnector = (networkId: NetworkId): Connector => {
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
  const policies = (
    networkId === NetworkId.MAINNET ? undefined
      : makePistolsPolicies(networkId, !Boolean(NETWORKS[networkId].lordsAddress), false)
  )

  //
  // export controller connector
  return makeControllerConnector(
    'pistols', // preset name
    NAMESPACE,
    NETWORKS[networkId].chainId,
    NETWORKS[networkId].rpcUrl,
    NETWORKS[networkId].slot,
    policies,
    tokens,
  );
}
