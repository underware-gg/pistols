import {
  StandardConnect,
  StandardDisconnect,
  StarknetWalletApi,
} from '@starknet-io/get-starknet-core'
import { describe, expect, test } from 'vitest'
import { getConnectorId } from 'src/starknet/wallet'
import { stringToFelt } from 'src/starknet/starknet'
import {
  PREDEPLOYED_ID,
  PredeployedConnector,
} from './predeployed'

const connector = () => new PredeployedConnector(
  'http://127.0.0.1:5050',
  'KATANA_LOCAL',
  [{
    active: true,
    address: '0x1',
    privateKey: '0x2',
  }],
)

describe('PredeployedConnector wallet-standard adapter', () => {
  test('exposes its stable ID and chain through wallet-standard features', async () => {
    const wallet = connector()
    const chainId = `0x${BigInt(stringToFelt('KATANA_LOCAL')).toString(16)}`

    expect(getConnectorId(wallet)).toBe(PREDEPLOYED_ID)
    expect(wallet.accounts).toHaveLength(0)

    const connected = await wallet.features[StandardConnect].connect()
    expect(connected.accounts[0].address).toBe('0x1')
    expect(wallet.accounts[0].chains).toEqual([`starknet:${chainId}`])
    expect(await wallet.features[StarknetWalletApi].request({
      type: 'wallet_requestChainId',
    })).toBe(chainId)

    await wallet.features[StandardDisconnect].disconnect()
    expect(wallet.accounts).toHaveLength(0)
  })
})
