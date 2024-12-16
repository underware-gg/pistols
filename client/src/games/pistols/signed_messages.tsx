import { BigNumberish } from 'starknet'
import { generateTypedData } from "@/lib/dojo/setup/controller"
import { TutorialProgress, getTutorialProgressValue } from '@/games/pistols/generated/constants'
import { bigintToHex } from "@/lib/utils/types"
import { STARKNET_DOMAIN } from './config'
import { SchemaType as PistolsSchemaType } from './generated/typescript/models.gen'
import * as models from './generated/typescript/models.gen'

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
      target_address: BigInt(target_address),
      target_id: BigInt(target_id),
      enabled: enabled,
    },
    {
      identity: 'ContractAddress',
    },
  )
}
