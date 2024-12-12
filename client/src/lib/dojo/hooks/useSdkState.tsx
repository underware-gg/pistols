import { useState } from 'react'
import { useSdkEntities, UseSdkEntitiesProps } from '@/lib/dojo/hooks/useSdkEntities'
import {
  PistolsSchemaType,
  PistolsGetQuery,
  PistolsSubQuery,
  PistolsEntity,
  PistolsModelType,
} from '@/lib/dojo/hooks/useSdkTypes'

export type {
  PistolsGetQuery,
  PistolsSubQuery,
}

export type EntityMap = {
  [entityId: string]: Partial<PistolsSchemaType['pistols']>,
}

export type useSdkStateResult = {
  entities: EntityMap | null
  isLoading: boolean
  isSubscribed: boolean
  refetch: () => void
}

export const getEntityMapModels = <M extends PistolsModelType>(entities: EntityMap, modelName: string): M[] =>
  (Object.values(entities ?? {}).map(e => (e[modelName] as M)) ?? [])


//---------------------------------------
// Get entities from torii
// (ephemeral)
//
// stores results at the hook local state
// as: EntityMap
//

export const useSdkState = ({
  query_get,
  query_sub,
  enabled = true,
  historical = undefined,
  limit = 100,
  offset = 0,
  logging = false,
}: Partial<UseSdkEntitiesProps>): useSdkStateResult => {
  const [entities, setEntities] = useState<EntityMap | null>()

  const { isLoading, isSubscribed, refetch } = useSdkEntities({
    query_get,
    query_sub,
    enabled,
    historical,
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
