import { useState } from 'react'
import { useSdkEntitiesGet, useSdkEntitiesSub, UseSdkEntitiesProps, useSdkEventsGet, UseSdkEventsProps } from 'src/dojo/hooks/useSdkEntities'
import {
  PistolsModelType,
  PistolsSchemaModels,
  PistolsEntity,
  PistolsSchemaModelNames,
} from 'src/games/pistols/config/types'

export type EntityMap = {
  [entityId: string]: Partial<PistolsSchemaModels>,
}

export type useSdkStateResult = {
  entities: EntityMap | null
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
}: UseSdkEntitiesProps): useSdkStateResult => {
  const [entities, setEntities] = useState<EntityMap | null>()

  const { isLoading } = useSdkEntitiesGet({
    query,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      setEntities(entities.reduce((acc: EntityMap, e: PistolsEntity) => ({
        ...acc,
        [e.entityId]: {
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
}: UseSdkEntitiesProps): useSdkStateResult => {
  const [entities, setEntities] = useState<EntityMap | null>()

  const { isLoading } = useSdkEntitiesSub({
    query,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      setEntities(entities.reduce((acc: EntityMap, e: PistolsEntity) => ({
        ...acc,
        [e.entityId]: {
          ...e.models.pistols
        } as EntityMap,
      }), {} as EntityMap));
    },
    updateEntity: (e: PistolsEntity) => {
      setEntities({
        ...entities,
        [e.entityId]: {
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
}: UseSdkEventsProps): useSdkStateResult => {
  const [entities, setEntities] = useState<EntityMap | null>()

  const { isLoading } = useSdkEventsGet({
    query,
    enabled,
    historical,
    setEntities: (entities: PistolsEntity[]) => {
      console.log('useSdkStateEventsGet', entities)
      setEntities(entities.reduce((acc: EntityMap, e: PistolsEntity) => ({
        ...acc,
        [e.entityId]: {
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
