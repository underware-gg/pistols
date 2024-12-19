import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { arrayClean, isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
import {
  PistolsGetQuery,
  PistolsSubQuery,
  PistolsEntity,
  PistolsModelType,
} from '@/lib/dojo/hooks/useSdkTypes'


//---------------------------------------
// Get entities from torii
//
// stores at remote store compatible with createDojoStore()
// initial state calls: setEntities()
// updates calls: updateEntity() (optional)
//

export type UseSdkEntitiesResult = {
  isLoading: boolean
  isSubscribed: boolean
  refetch: () => void
}

export type UseSdkEntitiesProps = {
  query_get: PistolsGetQuery
  query_sub?: PistolsSubQuery
  setEntities: (entities: PistolsEntity[]) => void // stores initial state
  updateEntity?: (entities: PistolsEntity) => void // store updates (if absent, do not subscribe)
  enabled?: boolean
  // events options
  historical?: boolean // if defined, will fetch for event messages
  // get options
  limit?: number
  offset?: number
  // subscribe options
  logging?: boolean
}

export const useSdkEntities = ({
  query_get,
  query_sub,
  setEntities,
  updateEntity,
  enabled = true,
  historical = undefined,
  limit = 100,
  offset = 0,
  logging = false,
}: UseSdkEntitiesProps): UseSdkEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const [isSubscribed, setIsSubscribed] = useState<boolean>()
  const isEvent = useMemo(() => (historical !== undefined), [historical])

  //----------------------
  // get initial entities
  //
  useEffect(() => {
    const _get = async () => {
      setIsLoading(true)
      await (isEvent ? sdk.getEventMessages : sdk.getEntities)({
        query: query_get,
        callback: (response) => {
          if (response.error) {
            console.error("useSdkEntities().sdk.get() error:", response.error)
          } else if (response.data) {
            // console.log("useSdkEntities() GOT:", response.data);
            setEntities(response.data);
          }
          setIsLoading(false)
        },
        limit,
        offset,
        options: { logging },
        //@ts-ignore
        historical,
      })
    }
    if (sdk && query_get && enabled) {
      _get()
    }
  }, [sdk, query_get, enabled])

  //----------------------
  // subscribe for updates
  //
  useEffect(() => {
    let _unsubscribe: (() => void) | undefined;

    const _subscribe = async () => {
      setIsSubscribed(undefined)
      const subscription = await (isEvent ? sdk.subscribeEventQuery : sdk.subscribeEntityQuery)({
        query: query_sub,
        callback: (response) => {
          if (response.error) {
            console.error("useSdkEntities().sdk.subscribe() error:", response.error)
          } else if (isPositiveBigint(response.data?.[0]?.entityId ?? 0)) {
            // console.log("useSdkEntities() SUB:", response.data[0]);
            updateEntity(response.data[0]);
          }
        },
        options: { logging },
        //@ts-ignore
        historical,
      })
      setIsSubscribed(true)
      _unsubscribe = () => subscription.cancel()
    };

    if (sdk && query_sub && enabled && updateEntity && isLoading === false) {
      _subscribe()
    }

    return () => {
      setIsSubscribed(false)
      _unsubscribe?.()
    }
  }, [sdk, query_sub, enabled, isLoading])

  const refetch = useCallback(() => {
    console.warn(`useSdkEntities().refetch() not implemented`)
  }, [])

  return {
    isLoading,
    isSubscribed,
    refetch,
  }
}


//---------------------------------------
// utils
//

//
// Extract models from a stored entity
//
export const getEntityModel = <M extends PistolsModelType>(entity: PistolsEntity, modelName: string): M => (entity?.models.pistols[modelName] as M)
export const getEntityModels = <M extends PistolsModelType>(entity: PistolsEntity, modelNames: string[]): M[] => (
  arrayClean(modelNames.map(modelName => getEntityModel<M>(entity, modelName)))
)

export const useEntityModel = <M extends PistolsModelType>(entity: PistolsEntity, modelName: string): M => {
  const model = useMemo(() => getEntityModel<M>(entity, modelName), [entity, modelName])
  return model
}
export const useEntityModels = <M extends PistolsModelType>(entity: PistolsEntity, modelNames: string[]): M[] => {
  const models = useMemo(() => getEntityModels<M>(entity, modelNames), [entity, modelNames])
  return models
}

//
// Filter entities by model
//
export const filterEntitiesByModel = (entities: PistolsEntity[], modelNames: string | string[]): PistolsEntity[] => {
  if (Array.isArray(modelNames)) {
    return entities.filter(e => {
      return (getEntityModels(e, modelNames).length > 0)
    })
  }
  return entities.filter(e => Boolean(getEntityModel(e, modelNames)))
}
