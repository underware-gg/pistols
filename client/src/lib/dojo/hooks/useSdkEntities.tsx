import { useCallback, useEffect, useMemo, useState } from 'react'
import { ParsedEntity, SubscriptionQueryType, QueryType } from '@dojoengine/sdk'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { isPositiveBigint } from '@/lib/utils/types'
import { PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'
import * as models from '@/games/pistols/generated/typescript/models.gen'

type PistolsGetQuery = QueryType<PistolsSchemaType>
type PistolsSubQuery = SubscriptionQueryType<PistolsSchemaType>
type PistolsEntity = ParsedEntity<PistolsSchemaType>
export type {
  PistolsSchemaType,
  PistolsGetQuery,
  PistolsSubQuery,
  PistolsEntity,
  models,
}

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
  events?: boolean
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
  events = false,
  limit = 100,
  offset = 0,
  logging = false,
}: UseSdkEntitiesProps): UseSdkEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  //----------------------
  // get initial entities
  //
  useEffect(() => {
    const _get = async () => {
      setIsLoading(true)
      await (events ? sdk.getEventMessages : sdk.getEntities)({
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
      })
    }
    if (sdk && enabled) {
      _get()
    }
  }, [sdk, query_get, enabled])

  //----------------------
  // subscribe for updates
  //
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const _subscribe = async () => {
      setIsSubscribed(undefined)
      const subscription = await (events ? sdk.subscribeEventQuery : sdk.subscribeEntityQuery)({
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
      })
      setIsSubscribed(true)
      unsubscribe = () => subscription.cancel()
    };

    if (sdk && enabled && query_sub && updateEntity) {
      _subscribe()
    }

    return () => {
      setIsSubscribed(false)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [sdk, query_sub, enabled, logging])

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
// Extract one model from a stored entity
//
export const useEntityModel = <T,>(entity: PistolsEntity, modelName: string) => {
  const model = useMemo(() => (entity?.models.pistols[modelName] as T), [entity, modelName])
  return model
}

