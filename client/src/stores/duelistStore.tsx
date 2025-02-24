import { useMemo } from 'react'
import { BigNumberish, CairoCustomEnum } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { useEntityId } from '@underware_gg/pistols-sdk/utils/hooks'
import { isPositiveBigint, parseCustomEnum, bigintToDecimal } from '@underware_gg/pistols-sdk/utils'
import { PistolsSchemaType, getProfileDescription } from '@underware_gg/pistols-sdk/pistols'
import { constants, models } from '@underware_gg/pistols-sdk/pistols/gen'
import { useScore } from '/src/hooks/useScore'
import { CharacterType } from '/src/data/assets'

export const useDuelistStore = createDojoStore<PistolsSchemaType>();

// export const useAllDuelistsEntityIds = () => {
//   const entities = useStore((state) => state.entities)
//   const entityIds = useMemo(() => Object.keys(entities), [entities])
//   return {
//     entityIds,
//   }
// }

export const useAllDuelistsIds = () => {
  const entities = useDuelistStore((state) => state.entities)
  const duelistIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models.pistols.Duelist.duelist_id)), [entities])
  return {
    duelistIds,
  }
}

export const useDuelist = (duelist_id: BigNumberish) => {
  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(constants.CONST.MAX_DUELIST_ID)), [duelist_id])
  const duelistId = useMemo(() => BigInt(duelist_id), [duelist_id])

  const entityId = useEntityId([duelist_id])
  const entities = useDuelistStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const duelist = useEntityModel<models.Duelist>(entity, 'Duelist')
  const duelistChallenge = useEntityModel<models.DuelistChallenge>(entity, 'DuelistChallenge')
  const scoreboard = useEntityModel<models.Scoreboard>(entity, 'Scoreboard')
  // console.log(`useDuelist() =>`, duelist_id, duelist)

  const timestamp_registered = useMemo(() => Number(duelist?.timestamp_registered ?? 0), [duelist])
  const timestamp_active = useMemo(() => Number(duelist?.timestamp_active ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestamp_registered), [timestamp_registered])
  const currentDuelId = useMemo(() => BigInt(duelistChallenge?.duel_id ?? 0), [duelistChallenge])
  const isInAction = useMemo(() => (currentDuelId > 0n), [currentDuelId])
  const score = useScore(scoreboard?.score)

  // profile
  const {
    variant: profileType,
    value: profileValue,
  } = useMemo(() => parseCustomEnum<constants.DuelistProfile>(duelist?.profile_type), [duelist])
  const profileDescription = useMemo(() => getProfileDescription(profileType as constants.ProfileType, profileValue), [profileType, profileValue])
  const profilePic = useMemo(() => (profileDescription.profile_id), [profileDescription])
  const name = useMemo(() => (profileDescription.name), [profileDescription])
  const gender = useMemo(() => (profileDescription.gender), [profileDescription])
  const isNpc = useMemo(() => (profileType != constants.ProfileType.Duelist), [profileType])
  const characterType = useMemo(() => (profileDescription.gender == constants.Gender.Female ? CharacterType.FEMALE : CharacterType.MALE), [profileDescription])

  const nameAndId = useMemo(() => (
    isNpc ? (name || 'NPC') : `${name || 'Duelist'} #${isValidDuelistId ? bigintToDecimal(duelistId) : '?'}`
  ), [name, duelistId, isValidDuelistId, isNpc])
  const duelistIdDisplay = useMemo(() => (
    isNpc ? 'NPC' : `Duelist #${isValidDuelistId ? bigintToDecimal(duelistId) : '?'}`
  ), [duelistId, isValidDuelistId, isNpc])


  return {
    isValidDuelistId,
    duelistId,
    name,
    nameAndId,
    duelistIdDisplay,
    exists,
    timestamp_registered,
    timestamp_active,
    profileType: profileType as constants.ProfileType,
    profileValue,
    profilePic,
    characterType,
    gender,
    isNpc,
    currentDuelId,
    isInAction,
    score,
  }
}
