import { BigNumberish, StarknetDomain, StarknetType } from 'starknet'
import { bigintToDecimal, bigintToHex } from 'src/utils/misc/types'
import { PistolsSchemaType } from 'src/games/pistols/sdk/types_web'
import { generateTypedData } from 'src/dojo/setup/controller'
import { makeStarknetDomain } from 'src/games/pistols/config/config'
import { NetworkId } from 'src/games/pistols/config/networks'
import { createTypedMessage } from 'src/starknet/starknet_sign'
import { CommitMoveMessage } from 'src/games/pistols/misc/salt'
import * as models from 'src/games/pistols/generated/models.gen'

//
// type examples:
// https://github.com/cartridge-gg/presets/blob/419dbda4283e4957db8a14ce202a04fabffea673/configs/eternum/config.json#L379
// https://github.com/starknet-io/starknet.js/blob/6e353d3d50226907ce6b5ad53309d55ed51c6874/__mocks__/typedData/example_baseTypes.json
//
// encode examples:
// https://starknetjs.com/docs/API/namespaces/typedData/#encodevalue
// const encoded = typedData.encodeValue({}, 'u128', bigintToHex(target_id))
//


//----------------------------------------
// typed data messages messages
//

export function make_typed_data_CommitMoveMessage(starknetDomain: StarknetDomain, messages: CommitMoveMessage) {
  return createTypedMessage({
    starknetDomain,
    messages,
  })
}


//----------------------------------------
// off-chain torii messages
//
export type OmitFieldOrder<T> = Omit<T, 'fieldOrder'>;
export function make_typed_data_PlayerOnline({
  networkId,
  identity,
  timestamp,
}: {
  networkId: NetworkId,
  identity: BigNumberish,
  timestamp: number,
}) {
  return generateTypedData<PistolsSchemaType, OmitFieldOrder<models.PlayerOnline>>(
    makeStarknetDomain(networkId),
    'pistols-PlayerOnline',
    {
      identity: bigintToHex(identity),
      timestamp,
    },
    {
      identity: 'ContractAddress',
      timestamp: 'felt',
    },
  )
}

export function make_typed_data_PlayerBookmark({
  networkId,
  identity,
  target_address,
  target_id,
  enabled,
}: {
  networkId: NetworkId,
  identity: BigNumberish,
  target_address: BigNumberish,
  target_id: BigNumberish,
  enabled: boolean,
}) {
  return generateTypedData<PistolsSchemaType, OmitFieldOrder<models.PlayerBookmark>>(
    makeStarknetDomain(networkId),
    'pistols-PlayerBookmark',
    {
      identity: bigintToHex(identity),
      target_address: bigintToHex(target_address),
      target_id: bigintToDecimal(target_id),
      enabled,
    },
    {
      identity: 'ContractAddress',
      target_address: 'ContractAddress',
      target_id: 'u128', // torii required data as decimal string
      enabled: 'bool',
    },
  )
}

