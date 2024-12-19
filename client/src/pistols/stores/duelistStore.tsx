import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@underware_gg/pistols-sdk/fix'
import { useEntityModel } from '@/lib/dojo/hooks/useSdkEntities'
import { PistolsSchemaType, models } from '@/lib/dojo/hooks/useSdkTypes'
import { useEntityId } from '@underware_gg/pistols-sdk/hooks'
import { isPositiveBigint, feltToString } from '@underware_gg/pistols-sdk/utils'
import { CONST } from '@/games/pistols/generated/constants'
import { useScore } from '../hooks/useScore'

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

  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(CONST.MAX_DUELIST_ID)), [duelist_id])

  const duelistId = useMemo(() => BigInt(duelist_id), [duelist_id])
  const name = useMemo(() => duelist?.name ? feltToString(duelist.name) : null, [duelist])
  const nameDisplay = useMemo(() => (`${name || 'Duelist'} #${isValidDuelistId ? duelist_id : '?'}`), [name, duelist_id, isValidDuelistId])
  const duelistIdDisplay = useMemo(() => (`Duelist #${isValidDuelistId ? duelist_id : '?'}`), [duelist_id, isValidDuelistId])
  const profilePicType = useMemo(() => (duelist?.profile_pic_type ?? null), [duelist])
  const profilePic = useMemo(() => Number(duelist?.profile_pic_uri ?? 0), [duelist])
  const timestamp = useMemo(() => Number(duelist?.timestamp ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestamp), [timestamp])

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
    profilePicType,
    profilePic,
    score,
  }
}
