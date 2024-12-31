import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk'
import { parseCustomEnum, useEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { constants, models, PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { useEntityId, isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
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
  // console.log(`useDuelist() =>`, duelist_id, duelist)

  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(constants.CONST.MAX_DUELIST_ID)), [duelist_id])

  const duelistId = useMemo(() => BigInt(duelist_id), [duelist_id])
  const duelistIdDisplay = useMemo(() => (`Duelist #${isValidDuelistId ? duelist_id : '?'}`), [duelist_id, isValidDuelistId])
  const timestamp = useMemo(() => Number(duelist?.timestamp ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestamp), [timestamp])

  const {
    variant: profileType,
    value: profileTypeValue,
  }= useMemo(() => parseCustomEnum(duelist?.profile_type), [duelist])
  const name = useMemo(() => profileTypeValue > 0 ? Object.values(constants.DUELIST_NAMES)[profileTypeValue] : null, [profileTypeValue])
  const nameDisplay = useMemo(() => (`${name || 'Duelist'} #${isValidDuelistId ? duelist_id : '?'}`), [name, duelist_id, isValidDuelistId])
  // console.log(`PROFILE>`, duelist_id, profileType, profileTypeValue)

  //@ts-ignore
  const score = useScore(duelist?.score)

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
    profilePic: profileTypeValue,
    score,
  }
}
