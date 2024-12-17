import { BigNumberish, typedData } from 'starknet'
import { generateTypedData } from "@/lib/dojo/setup/controller"
import { TutorialProgress, getTutorialProgressValue } from '@/games/pistols/generated/constants'
import { bigintToDecimal, bigintToHex, bigintToNumber } from "@/lib/utils/types"
import { STARKNET_DOMAIN } from './config'
import { SchemaType as PistolsSchemaType } from './generated/typescript/models.gen'
import * as models from './generated/typescript/models.gen'

//
// type examples:
// https://github.com/cartridge-gg/presets/blob/419dbda4283e4957db8a14ce202a04fabffea673/configs/eternum/config.json#L379
// https://github.com/starknet-io/starknet.js/blob/6e353d3d50226907ce6b5ad53309d55ed51c6874/__mocks__/typedData/example_baseTypes.json
//
// encode examples:
// https://starknetjs.com/docs/API/namespaces/typedData/#encodevalue
// const encoded = typedData.encodeValue({}, 'u128', bigintToHex(target_id))
//

export type OmitFieldOrder<T> = Omit<T, 'fieldOrder'>;

export function make_typed_data_PPlayerOnline({
  identity,
  timestamp,
}: {
  identity: BigNumberish,
  timestamp: number,
}) {
  return generateTypedData<PistolsSchemaType, OmitFieldOrder<models.PPlayerOnline>>(
    STARKNET_DOMAIN,
    'pistols-PPlayerOnline',
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

export function make_typed_data_PPlayerTutorialProgress({
  identity,
  progress,
}: {
  identity: BigNumberish,
  progress: TutorialProgress,
}) {
  return generateTypedData<PistolsSchemaType, OmitFieldOrder<models.PPlayerTutorialProgress>>(
    STARKNET_DOMAIN,
    'pistols-PPlayerTutorialProgress',
    {
      identity: bigintToHex(identity),
      progress: getTutorialProgressValue(progress),
    },
    {
      identity: 'ContractAddress',
      progress: 'felt',
    },
  )
}

export function make_typed_data_PPlayerBookmark({
  identity,
  target_address,
  target_id,
  enabled,
}: {
  identity: BigNumberish,
  target_address: BigNumberish,
  target_id: BigNumberish,
  enabled: boolean,
}) {
  return generateTypedData<PistolsSchemaType, OmitFieldOrder<models.PPlayerBookmark>>(
    STARKNET_DOMAIN,
    'pistols-PPlayerBookmark',
    {
      identity: bigintToHex(identity),
      target_address: bigintToHex(target_address),
      target_id: bigintToDecimal(target_id),
      enabled,
    },
    {
      identity: 'ContractAddress',
      target_address: 'ContractAddress',
      target_id: 'u128', // torii required data as bigintToDecimal()
      enabled: 'bool',
    },
  )
}
