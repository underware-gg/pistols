import { useMemo } from 'react'
import { BigNumberish, CairoCustomEnum } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/state'
import { useEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { constants, models, PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { useEntityId, isPositiveBigint, parseCustomEnum } from '@underware_gg/pistols-sdk/utils'
import { useScore } from '/src/hooks/useScore'

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
  const entityId = useEntityId([duelist_id])
  const entities = useDuelistStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const duelist = useEntityModel<models.Duelist>(entity, 'Duelist')
  const duelistChallenge = useEntityModel<models.DuelistChallenge>(entity, 'DuelistChallenge')
  const scoreboard = useEntityModel<models.Scoreboard>(entity, 'Scoreboard')
  // console.log(`useDuelist() =>`, duelist_id, duelist)

  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(constants.CONST.MAX_DUELIST_ID)), [duelist_id])
  const duelistId = useMemo(() => BigInt(duelist_id), [duelist_id])

  const {
    variant: profileType,
    value: profileValue,
  } = useMemo(() => parseCustomEnum<constants.DuelistProfile>(duelist?.profile_type), [duelist])
  // console.log(`!!!!!!!!!!! duelist profileType >>>>>`, duelist_id, profileType, profileValue, constants.DUELIST_PROFILES[profileValue])
  const profileDescription = useMemo(() => (
    profileType == constants.ProfileType.Duelist ? constants.DUELIST_PROFILES[profileValue]
      : profileType == constants.ProfileType.Character ? constants.CHARACTER_PROFILES[profileValue]
        : profileType == constants.ProfileType.Bot ? constants.BOT_PROFILES[profileValue]
          : constants.DUELIST_PROFILES[constants.DuelistProfile.Unknown]
  ), [profileType, profileValue])
  const isNpc = useMemo(() => (profileType != constants.ProfileType.Duelist), [profileType])

  const duelistIdDisplay = useMemo(() => (
    isNpc ? 'NPC' : `Duelist #${isValidDuelistId ? duelist_id : '?'}`
  ), [duelist_id, isValidDuelistId, isNpc])
  const timestamp = useMemo(() => Number(duelist?.timestamp ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestamp), [timestamp])

  const name = useMemo(() => (profileDescription.name), [profileDescription])
  const nameAndId = useMemo(() => (
    isNpc ? (name || 'NPC') : `${name || 'Duelist'} #${isValidDuelistId ? duelist_id : '?'}`
  ), [name, duelist_id, isValidDuelistId, isNpc])
  const profilePic = useMemo(() => (profileDescription.profile_id), [profileDescription])

  const score = useScore(scoreboard?.score)

  const currentDuelId = useMemo(() => BigInt(duelistChallenge?.duel_id ?? 0), [duelistChallenge])
  const isInAction = useMemo(() => (currentDuelId > 0n), [currentDuelId])

  return {
    isValidDuelistId,
    duelistId,
    name,
    nameAndId,
    duelistIdDisplay,
    exists,
    timestamp,
    profileType,
    profileValue,
    profilePic,
    isNpc,
    currentDuelId,
    isInAction,
    score,
  }
}
