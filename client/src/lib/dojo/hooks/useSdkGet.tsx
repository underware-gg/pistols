import { useState } from 'react'
import { PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'
import {
  PistolsGetQuery,
  PistolsSubQuery,
  PistolsEntity,
  useSdkEntities,
  UseSdkEntitiesProps,
} from '@/lib/dojo/hooks/useSdkEntities'

export type {
  PistolsGetQuery,
  PistolsSubQuery,
}

export type EntityMap = {
  [entityId: string]: Partial<PistolsSchemaType['pistols']>,
}

export type UseSdkGetResult = {
  entities: EntityMap | null
  isLoading: boolean
  isSubscribed: boolean
  refetch: () => void
}

export const getEntityMapModels = <T,>(entities: EntityMap, modelName: string): T[] =>
  (Object.values(entities ?? {}).map(e => (e[modelName] as T)) ?? [])


//---------------------------------------
// Get entities from torii
// (ephemeral)
//
// stores results at the hook local state
// as: EntityMap
//

export const useSdkGet = ({
  query_get,
  query_sub,
  enabled = true,
  events = false,
  limit = 100,
  offset = 0,
  logging = false,
}: Partial<UseSdkEntitiesProps>): UseSdkGetResult => {
  const [entities, setEntities] = useState<EntityMap | null>()

  const { isLoading, isSubscribed, refetch } = useSdkEntities({
    query_get,
    query_sub,
    enabled,
    events,
    limit,
    offset,
    logging,
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
    isSubscribed,
    refetch,
  }
}
