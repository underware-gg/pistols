import { createDojoStore } from '@dojoengine/sdk/react'
import { useMemo } from 'react'
import {
  useSdkEntitiesGet,
  UseSdkGetProps,
  useSdkEntitiesSub,
  UseSdkSubProps,
  useSdkEventsGet,
} from 'src/dojo/hooks/useSdkEntities'
import { bigintToDecimal } from 'src/exports/utils'
import {
  PistolsEntity,
  PistolsSchemaType,
} from 'src/games/pistols/config/types'
import { useStore } from 'zustand'

export type useSdkStateResult = {
  entities: PistolsEntity[] | null
  isLoading: boolean | undefined
}


//---------------------------------------
// Get entities from torii
// (ephemeral)
//
// stores results at the hook local state
// as: EntityMap
//

export const useSdkStateEntitiesGet = ({
  query,
  enabled = true,
}: Omit<UseSdkGetProps, 'setEntities'>): useSdkStateResult => {
  const store = useMemo(() => createDojoStore<PistolsSchemaType>(), [query])
  const state = useStore(store, (state) => state)

  const { isLoading } = useSdkEntitiesGet({
    query,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      console.log('useSdkStateEntitiesGet() GOT:', entities, query)
      state.setEntities([...entities]);
    },
  })

  const entities = useMemo(() => Object.values(state.entities), [state.entities])

  return {
    entities,
    isLoading,
  }
}

export const useSdkStateEntitiesSub = ({
  query,
  enabled = true,
}: Omit<UseSdkSubProps, 'setEntities' | 'updateEntity'>): useSdkStateResult => {
  const store = useMemo(() => createDojoStore<PistolsSchemaType>(), [query])
  const state = useStore(store, (state) => state)

  const { isLoading } = useSdkEntitiesSub({
    query,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      console.log('useSdkStateEntitiesSub() GOT:', entities, query)
      state.setEntities([...entities]);
    },
    updateEntity: (entity: PistolsEntity) => {
      console.log('useSdkStateEntitiesSub() SUB:', entity, query)
      state.updateEntity(entity);
    },
  })

  const entities = useMemo(() => Object.values(state.entities), [state.entities])

  return {
    entities,
    isLoading,
  }
}


//---------------------------------------
// Get events from torii
// (ephemeral)
//
// stores results at the hook local state
// as: EntityMap
//

export const useSdkStateEventsGet = ({
  query,
  enabled = true,
  retryInterval = 0,
}: Omit<UseSdkGetProps, 'setEntities'>): useSdkStateResult => {
  const store = useMemo(() => createDojoStore<PistolsSchemaType>(), [query])
  const state = useStore(store, (state) => state)
  const historical = useMemo(() => query?.build().historical, [query])

  const { isLoading } = useSdkEventsGet({
    query,
    enabled,
    retryInterval,
    setEntities: (entities: PistolsEntity[]) => {
      console.log('useSdkStateEventsGet() GOT:', entities, query)
      if (historical) {
        // historical events can have duplicated entityIds
        state.setEntities(entities.map((e, i) => ({...e, entityId: bigintToDecimal(i) })));
      } else {
        state.setEntities([...entities]);
      }
    },
  })

  const entities = useMemo(() => Object.values(state.entities), [state.entities])

  return {
    entities,
    isLoading,
  }
}
