import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { getEntityModel, useEntityModel } from '@underware/pistols-sdk/dojo'
import { useClientTimestamp, useEntityId, useEntityIds } from '@underware/pistols-sdk/utils/hooks'
import { isPositiveBigint, bigintToDecimal, bigintToHex } from '@underware/pistols-sdk/utils'
import { parseCustomEnum, parseEnumVariant } from '@underware/pistols-sdk/utils/starknet'
import { PistolsSchemaType, getProfileDescription } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
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
  const duelistMemorial = useEntityModel<models.DuelistMemorial>(entity, 'DuelistMemorial')
  // console.log(`useDuelist() =>`, duelist_id, duelist)
  // console.log(`DuelistMemorial =>`, duelist_id, duelistMemorial)

  const timestampRegistered = useMemo(() => Number(duelist?.timestamps.registered ?? 0), [duelist])
  const timestampActive = useMemo(() => Number(duelist?.timestamps.active ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestampRegistered), [timestampRegistered])

  // inactivity
  const { clientTimestamp } = useClientTimestamp()
  // sync with duelist_token.inactive_timestamp()
  const inactiveTimestamp = useMemo(() => (clientTimestamp - timestampActive), [timestampActive, clientTimestamp])
  // sync with duelist_token.is_inactive()
  const isInactive = useMemo(() => (timestampActive > 0 && (inactiveTimestamp > constants.FAME.MAX_INACTIVE_TIMESTAMP)), [timestampActive, inactiveTimestamp])
  // sync with duelist_token.inactive_fame_dripped()
  const inactiveFameDripped = useMemo(() => (
    !isInactive ? 0 : ((BigInt(inactiveTimestamp) - constants.FAME.MAX_INACTIVE_TIMESTAMP) / constants.FAME.TIMESTAMP_TO_DRIP_ONE_FAME) * constants.CONST.ETH_TO_WEI
  ), [isInactive, inactiveTimestamp])

  // current duel a duelist is in
  const currentDuelId = useMemo(() => BigInt(duelistChallenge?.duel_id ?? 0), [duelistChallenge])
  const isInAction = useMemo(() => (currentDuelId > 0n), [currentDuelId])

  // memorial (dead duelists)
  const isDead = useMemo(() => Boolean(duelistMemorial), [duelistMemorial])
  const causeOfDeath = useMemo(() => parseEnumVariant<constants.CauseOfDeath>(duelistMemorial?.cause_of_death), [duelistMemorial])

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
    timestampRegistered,
    timestampActive,
    profileType: profileType as constants.ProfileType,
    profileValue,
    profilePic,
    characterType,
    gender,
    isNpc,
    currentDuelId,
    isInAction,
    isInactive,
    inactiveFameDripped,
    // dead duelists
    isDead,
    isAlive: !isDead,
    causeOfDeath,
  }
}

export const useDuellingDuelists = (duelistIds: BigNumberish[]) => {
  const entities = useDuelistStore((state) => state.entities)

  const entityIds = useEntityIds(duelistIds.map(id => [id]))

  // filter alive duelists from duelistIds
  const alive_entities = useMemo(() => (
    Object.keys(entities).filter(e => (
      entityIds.includes(e) && !Boolean(getEntityModel(entities[e], 'DuelistMemorial'))
    ))
  ), [entities, entityIds])

  const { notDuelingIds, duellingIds, duelPerDuelists } = useMemo(() => {
    const notDuelingIds: BigNumberish[] = []
    const duellingIds: BigNumberish[] = []
    const duelPerDuelists: Record<string, BigNumberish> = {}
    alive_entities.forEach(entityId => {
      const challenge = getEntityModel(entities[entityId], 'DuelistChallenge')
      const duelist_id = bigintToHex(challenge?.duelist_id ?? getEntityModel(entities[entityId], 'Duelist').duelist_id)
      if (isPositiveBigint(challenge?.duel_id)) {
        duellingIds.push(duelist_id)
        duelPerDuelists[duelist_id] = bigintToHex(challenge.duel_id)
      } else {
        notDuelingIds.push(duelist_id)
      }
    })
    return {
      notDuelingIds,
      duellingIds,
      duelPerDuelists,
    }
  }, [alive_entities])

  return {
    notDuelingIds,    // duelist_ids who are not duelling
    duellingIds,      // duelist_ids who are duelling
    duelPerDuelists,  // duel_ids per (duelling) duelist_id
  }
}

