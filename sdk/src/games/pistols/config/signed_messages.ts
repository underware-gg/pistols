import { BigNumberish, StarknetType, typedData } from 'starknet'
import { bigintToDecimal, bigintToHex, bigintToNumber } from 'src/utils/types'
import { generateTypedData } from 'src/dojo/setup/controller'
import { STARKNET_DOMAIN } from 'src/games/pistols/config/config'
import { PistolsSchemaType } from 'src/games/pistols/config/types'
import * as constants from 'src/games/pistols/generated/constants'
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
  progress: constants.TutorialProgress,
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
      TutorialProgress: makeEnumType(constants.TutorialProgressNameToValue)
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
function makeEnumType(enumValues: Record<string, number>): StarknetType[] {
  return Object.keys(enumValues).map(name => ({
    name,
    type: '()',
  }))
}
