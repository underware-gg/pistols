import { BigNumberish, StarknetDomain, StarknetType, TypedData } from 'starknet'
import { makeStarknetDomain, CommitMoveMessage, GeneralPurposeMessage } from 'src/games/pistols/config/typed_data'
// import { UnionOfModelData } from '@dojoengine/sdk'
import { bigintToHex } from 'src/utils/misc/types'
import { PistolsSchemaType, UnionOfModelData } from 'src/games/pistols/sdk/types_web'
import { NetworkId } from 'src/games/pistols/config/networks'
import { createTypedMessage } from 'src/starknet/starknet_sign'
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

export function make_typed_data_GeneralPurposeMessage(starknetDomain: StarknetDomain, messages: GeneralPurposeMessage) {
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
  available,
}: {
  networkId: NetworkId,
  identity: BigNumberish,
  timestamp: number,
  available: boolean,
}) {
  return generateTypedData<PistolsSchemaType, OmitFieldOrder<models.PlayerOnline>>(
    makeStarknetDomain({ networkId }),
    'pistols-PlayerOnline',
    {
      identity: bigintToHex(identity),
      timestamp,
      available,
    },
    {
      identity: 'ContractAddress',
      timestamp: 'felt',
      available: 'bool',
    },
  )
}

// same as sdk.generateTypedData()
const generateTypedData = <T extends models.SchemaType, M extends UnionOfModelData<T>>(
  domain: StarknetDomain,
  primaryType: string,
  message: M,
  messageFieldTypes: { [name: string]: string },
  enumTypes?: Record<string, StarknetType[]>,
): TypedData => ({
  types: {
    StarknetDomain: [
      { name: "name", type: "shortstring" },
      { name: "version", type: "shortstring" },
      { name: "chainId", type: "shortstring" },
      { name: "revision", type: "shortstring" },
    ],
    [primaryType]: Object.keys(message).map((key) => {
      let result: any = {
        name: key,
        type: messageFieldTypes[key],
      }
      if (enumTypes?.[result.type]) {
        result.contains = result.type
        result.type = "enum"
      }
      return result
    }),
    ...enumTypes,
  },
  primaryType,
  domain,
  // transform message types
  message,
})

