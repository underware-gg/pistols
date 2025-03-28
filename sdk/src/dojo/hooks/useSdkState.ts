import { useState } from 'react'
import {
  useSdkEntitiesGet,
  UseSdkEntitiesGetProps,
  useSdkEntitiesSub,
  UseSdkEntitiesSubProps,
  useSdkEventsGet,
  UseSdkEventsGetProps,
} from 'src/dojo/hooks/useSdkEntities'
import {
  PistolsModelType,
  PistolsSchemaModels,
  PistolsEntity,
  PistolsSchemaModelNames,
} from 'src/games/pistols/config/types'

export type EntityMap = {
  [entityId: string]: Partial<PistolsSchemaModels>,
}

export type useSdkStateResultOLD = {
  entities: EntityMap | null
  isLoading: boolean | undefined
}
export type useSdkStateResult = {
  entities: PistolsEntity[] | null
  isLoading: boolean | undefined
}

export const getEntityMapModels = <M extends PistolsModelType>(entities: EntityMap, modelName: PistolsSchemaModelNames): M[] =>
  (Object.values(entities ?? {}).map(e => (e[modelName] as unknown as M)) ?? [])


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
}: Omit<UseSdkEntitiesGetProps, 'setEntities'>): useSdkStateResultOLD => {
  const [entities, setEntities] = useState<EntityMap | null>()

  const { isLoading } = useSdkEntitiesGet({
    query,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      setEntities(entities.reduce((acc: EntityMap, e: PistolsEntity) => ({
        ...acc,
        [e.entityId]: {
          ...(acc[e.entityId] ?? {}),
          ...e.models.pistols
        } as EntityMap,
      }), {} as EntityMap));
    },
  })

  return {
    entities,
    isLoading,
  }
}

export const useSdkStateEntitiesSub = ({
  query,
  enabled = true,
}: Omit<UseSdkEntitiesSubProps, 'setEntities' | 'updateEntity'>): useSdkStateResultOLD => {
  const [entities, setEntities] = useState<EntityMap | null>()

  const { isLoading } = useSdkEntitiesSub({
    query,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      setEntities(entities.reduce((acc: EntityMap, e: PistolsEntity) => ({
        ...acc,
        [e.entityId]: {
          ...(acc[e.entityId] ?? {}),
          ...e.models.pistols
        } as EntityMap,
      }), {} as EntityMap));
    },
    updateEntity: (e: PistolsEntity) => {
      setEntities({
        ...entities,
        [e.entityId]: {
          ...(entities[e.entityId] ?? {}),
          ...e.models.pistols
        } as EntityMap,
      });
    }
  })

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
  historical,
  enabled = true,
  retryInterval = 0,
}: Omit<UseSdkEventsGetProps, 'setEntities'>): useSdkStateResult => {
  const [entities, setEntities] = useState<PistolsEntity[]>([])

  const { isLoading } = useSdkEventsGet({
    query,
    enabled,
    historical,
    retryInterval,
    setEntities: (entities: PistolsEntity[]) => {
      console.log('useSdkStateEventsGet() GOT:', entities, query)
      setEntities([...entities]);
    },
  })

  return {
    entities,
    isLoading,
  }
}
