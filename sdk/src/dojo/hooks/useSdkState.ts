import { useState } from 'react'
import { useSdkEntities, UseSdkEntitiesProps } from 'src/dojo/hooks/useSdkEntities'
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
  isSubscribed: boolean | undefined
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

export const useSdkState = ({
  query_get,
  query_sub,
  enabled = true,
  limit = 100,
  offset = 0,
  logging = false,
}: Partial<UseSdkEntitiesProps>): useSdkStateResult => {
  const [entities, setEntities] = useState<EntityMap | null>()

  const { isLoading, isSubscribed } = useSdkEntities({
    query_get,
    query_sub,
    enabled,
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
  }
}
