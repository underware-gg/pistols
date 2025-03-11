import { useMemo } from 'react'
import { BigNumberish, CairoCustomEnum } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityModel } from '@underware/pistols-sdk/dojo'
import { useClientTimestamp, useEntityId } from '@underware/pistols-sdk/utils/hooks'
import { isPositiveBigint, bigintToDecimal } from '@underware/pistols-sdk/utils'
import { parseCustomEnum } from '@underware/pistols-sdk/utils/starknet'
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
  // console.log(`useDuelist() =>`, duelist_id, duelist)

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
  }
}
