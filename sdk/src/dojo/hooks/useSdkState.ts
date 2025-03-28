import { createDojoStore } from '@dojoengine/sdk/react'
import { useEffect, useMemo } from 'react'
import {
  useSdkEntitiesGet,
  UseSdkEntitiesGetProps,
  useSdkEntitiesSub,
  UseSdkEntitiesSubProps,
  useSdkEventsGet,
  UseSdkEventsGetProps,
} from 'src/dojo/hooks/useSdkEntities'
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
}: Omit<UseSdkEntitiesGetProps, 'setEntities'>): useSdkStateResult => {
  const store = useMemo(() => createDojoStore<PistolsSchemaType>(), [])
  const state = useStore(store, (state) => state)

  const { isLoading } = useSdkEntitiesGet({
    query,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      console.log('useSdkStateEntitiesGet() GOT:', entities, query)
      state.setEntities([...entities]);
    },
  })

  return {
    entities: Object.values(state.entities),
    isLoading,
  }
}

export const useSdkStateEntitiesSub = ({
  query,
  enabled = true,
}: Omit<UseSdkEntitiesSubProps, 'setEntities' | 'updateEntity'>): useSdkStateResult => {
  const store = useMemo(() => createDojoStore<PistolsSchemaType>(), [])
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

  return {
    entities: Object.values(state.entities),
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
  historical,
  enabled = true,
  retryInterval = 0,
}: Omit<UseSdkEventsGetProps, 'setEntities'>): useSdkStateResult => {
  const store = useMemo(() => createDojoStore<PistolsSchemaType>(), [])
  const state = useStore(store, (state) => state)

  const { isLoading } = useSdkEventsGet({
    query,
    enabled,
    historical,
    retryInterval,
    setEntities: (entities: PistolsEntity[]) => {
      console.log('useSdkStateEventsGet() GOT:', entities, query)
      state.setEntities([...entities]);
    },
  })

  useEffect(() => {
    console.log('useSdkStateEventsGet() STORE:', state)
  }, [state])

  return {
    entities: Object.values(state.entities),
    isLoading,
  }
}
