import { BigNumberish, StarknetType, typedData } from 'starknet'
import { generateTypedData } from "@/lib/dojo/setup/controller"
import { TutorialProgress, TutorialProgressNameToValue, getTutorialProgressValue } from '@/games/pistols/generated/constants'
import { bigintToDecimal, bigintToHex, bigintToNumber } from '@underware_gg/pistols-sdk/utils'
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
      target_id: 'u128', // torii required data as decimal string
      enabled: 'bool',
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
      //@ts-ignore
      progress: { [progress]: [] }, // enum!
    },
    {
      identity: 'ContractAddress',
      progress: 'TutorialProgress',
    },
    {
      TutorialProgress: makeEnumType(TutorialProgressNameToValue)
    }
  )
}


//
// example: from...
// export const TutorialProgressNameToValue: Record<TutorialProgress, number> = {
//   [TutorialProgress.None]: 0,
//   [TutorialProgress.FinishedFirst]: 1,
//   [TutorialProgress.FinishedSecond]: 2,
//   [TutorialProgress.FinishedFirstDuel]: 3,
// };
//
// to...
// TutorialProgress: [
//   { name: 'None', type: '()' },
//   { name: 'FinishedFirst', type: '()' },
//   { name: 'FinishedSecond', type: '()' },
//   { name: 'FinishedFirstDuel', type: '()' },
// ]
const makeEnumType = (enumValues: Record<string, number>): StarknetType[] => (
  Object.keys(enumValues).map(name => ({
    name,
    type: '()',
  }))
)
