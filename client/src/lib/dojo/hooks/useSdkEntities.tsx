import { useEffect, useMemo, useState } from 'react'
import { ParsedEntity, SubscriptionQueryType, QueryType } from '@dojoengine/sdk'
import { PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { isPositiveBigint } from '@/lib/utils/types'
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
  isSubscribed: boolean
}

export type UseSdkEntitiesProps = {
  query_get: PistolsGetQuery
  query_sub?: PistolsSubQuery
  setEntities: (entities: PistolsEntity[]) => void // stores initial state
  updateEntity?: (entities: PistolsEntity) => void // store updates (if absent, do not subscribe)
  enabled?: boolean
  logging?: boolean
}

export const useSdkEntities = <T,>({
  query_get,
  query_sub,
  setEntities,
  updateEntity,
  enabled = true,
  logging = false,
}: UseSdkEntitiesProps): UseSdkEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [isSubscribed, setIsSubscribed] = useState(false)

  //----------------------
  // get initial entities
  //
  useEffect(() => {
    const _get = async () => {
      await sdk.getEntities({
        query: query_get,
        callback: (response) => {
          if (response.error) {
            console.error("useSdkEntities().getEntities() error:", response.error)
          } else if (response.data) {
            // console.log("useSdkEntities() GOT:", response.data);
            setEntities(response.data);
          }
        },
      })
    }
    if (enabled) {
      _get()
    }
  }, [sdk, query_get, enabled])

  //----------------------
  // subscribe for updates
  //
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const _subscribe = async () => {
      const subscription = await sdk.subscribeEntityQuery({
        query: query_sub,
        callback: (response) => {
          if (response.error) {
            console.error("useSdkEntities().subscribeEntityQuery() error:", response.error)
          } else if (isPositiveBigint(response.data?.[0]?.entityId ?? 0)) {
            console.log("useSdkEntities() SUB:", response.data[0]);
            updateEntity(response.data[0]);
          }
        },
        options: { logging },
      })
      setIsSubscribed(true)
      unsubscribe = () => subscription.cancel()
    };

    setIsSubscribed(true)
    if (enabled && query_sub && updateEntity) {
      _subscribe()
    }

    return () => {
      setIsSubscribed(false)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [sdk, query_sub, enabled, logging, updateEntity])

  return {
    isSubscribed,
  }
}

//---------------------------------------
// Extract one model from a stored entity
//
export const useEntityModel = <T,>(entity: PistolsEntity, modelName: string) => {
  const model = useMemo(() => (entity?.models.pistols[modelName] as T), [entity, modelName])
  return model
}
