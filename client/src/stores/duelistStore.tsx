import { useMemo } from 'react'
import { BigNumberish, CairoCustomEnum } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk'
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
  // console.log(`useDuelist() =>`, duelist_id, duelist)

  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(constants.CONST.MAX_DUELIST_ID)), [duelist_id])

  const duelistId = useMemo(() => BigInt(duelist_id), [duelist_id])
  const duelistIdDisplay = useMemo(() => (`Duelist #${isValidDuelistId ? duelist_id : '?'}`), [duelist_id, isValidDuelistId])
  const timestamp = useMemo(() => Number(duelist?.timestamp ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestamp), [timestamp])

  const [profileType, profileTypeValue] = useMemo(() => parseCustomEnum<constants.DuelistProfile>(duelist?.profile_type as unknown as CairoCustomEnum), [duelist])
  // console.log(`!!!!!!!!!!! duelist profileType >>>>>`, duelist_id, profileType, profileTypeValue, constants.DUELIST_PROFILES[profileTypeValue])
  const profileDescription = useMemo(() => (
    profileType == constants.ProfileType.Duelist ? constants.DUELIST_PROFILES[profileTypeValue]
      : profileType == constants.ProfileType.Bot ? constants.BOT_PROFILES[profileTypeValue]
        : constants.DUELIST_PROFILES[constants.DuelistProfile.Unknown]
  ), [profileType, profileTypeValue])

  const name = useMemo(() => (profileDescription.name), [profileDescription])
  const nameDisplay = useMemo(() => (`${name || 'Duelist'} #${isValidDuelistId ? duelist_id : '?'}`), [name, duelist_id, isValidDuelistId])
  const profilePic = useMemo(() => (profileDescription.profile_id), [profileDescription])

  const score = useScore(duelist?.score)

  const currentDuelId = useMemo(() => BigInt(duelistChallenge?.duel_id ?? 0), [duelistChallenge])
  const isInAction = useMemo(() => (currentDuelId > 0n), [currentDuelId])

  return {
    isValidDuelistId,
    duelistId,
    name,
    nameDisplay,
    duelistIdDisplay,
    exists,
    timestamp,
    profileType,
    profileTypeValue,
    profilePic,
    currentDuelId,
    isInAction,
    score,
  }
}
