import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk'
import { useSdkSubscribeEntities, PistolsSubQuery, PistolsSchemaType, useEntityModel, models } from '@/lib/dojo/hooks/useSdkSub'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useEntityId } from '@/lib/utils/hooks/useEntityId'
import { isPositiveBigint } from '@/lib/utils/types'
import { CONST } from '@/games/pistols/generated/constants'
import { feltToString } from '@/lib/utils/starknet'
import { useScore } from '../hooks/useScore'

//
// Stores all duelists
export const useDuelistEntityStore = createDojoStore<PistolsSchemaType>();

//
// Sync all duelists
// Add only once to a top level component
export function DuelistStoreSync() {
  const { tableId } = useSettings()
  const query = useMemo<PistolsSubQuery>(() => ({
    pistols: {
      Duelist: [],
    },
  }), [tableId])

  const state = useDuelistEntityStore((state) => state)
  
  useSdkSubscribeEntities({
    query,
    setEntities: state.setEntities,
    updateEntity: state.updateEntity,
  })

  // useEffect(() => console.log("DuelistStoreSync() =>", state.entities), [state.entities])

  return (<></>)
}

export const useAllDuelistsEntityIds = () => {
  const entities = useDuelistEntityStore((state) => state.entities)
  const entityIds = useMemo(() => Object.keys(entities), [entities])
  return {
    entityIds,
  }
}

export const useDuelist = (duelist_id: BigNumberish) => {
  const entityId = useEntityId([duelist_id])
  const entities = useDuelistEntityStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const duelist = useEntityModel<models.Duelist>(entity, 'Duelist')
  // console.log(`useDuelist() =>`, duelist_id, duelist)

  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(CONST.MAX_DUELIST_ID)), [duelist_id])

  const name = useMemo(() => duelist?.name ? feltToString(duelist.name) : null, [duelist])
  const nameDisplay = useMemo(() => (`${name || 'Duelist'} #${isValidDuelistId ? duelist_id : '?'}`), [name, duelist_id, isValidDuelistId])
  const duelistIdDisplay = useMemo(() => (`Duelist #${isValidDuelistId ? duelist_id : '?'}`), [duelist_id, isValidDuelistId])
  const profilePicType = useMemo(() => (duelist?.profile_pic_type ?? null), [duelist])
  const profilePic = useMemo(() => Number(duelist?.profile_pic_uri ?? 0), [duelist])
  const timestamp = useMemo(() => (duelist?.timestamp ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestamp), [timestamp])

  //@ts-ignore
  const score = useScore(duelist?.score)

  return {
    isValidDuelistId,
    duelistId: duelist_id,
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
