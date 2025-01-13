import { useCallback, useEffect, useMemo, useState } from 'react'
import { BigNumberish, addAddressPadding } from 'starknet'
import { bigintToHex, isPositiveBigint, arrayClean } from 'src/utils/misc/types'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import {
  PistolsGetQuery,
  PistolsSubQuery,
  PistolsEntity,
  PistolsModelType,
  PistolsSchemaModelNames,
} from 'src/games/pistols/config/types'


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

export type SdkCallbackResponse = {
  data?: PistolsEntity[] | PistolsEntity[][]
  error?: Error
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

  const _parseResponseData = (data: SdkCallbackResponse['data']): PistolsEntity[] => {
    return !data ? []
      // PistolsEntity[]
      : !Array.isArray(data[0]) ? data as PistolsEntity[] :
        // historical events from getEventMessages: PistolsEntity[][]
        (data as PistolsEntity[][]).reduce((acc: PistolsEntity[], e: PistolsEntity[]) => (
          acc.concat(e)
        ), [] as PistolsEntity[])
  }

  //----------------------
  // get initial entities
  //
  useEffect(() => {
    const _get = async () => {
      setIsLoading(true)
      await (isEvent ? sdk.getEventMessages : sdk.getEntities)({
        query: query_get,
        callback: (response: SdkCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEntities().sdk.get() error:", response.error)
          } else if (response.data) {
            // console.log("useSdkEntities() GOT:", isEvent, response.data)
            setEntities(_parseResponseData(response.data))
          }
          setIsLoading(false)
        },
        limit,
        offset,
        options: { logging },
        historical,
        dontIncludeHashedKeys: false,
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
        callback: (response: SdkCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEntities().sdk.subscribe() error:", response.error)
          } else {
            const data = _parseResponseData(response.data)
            if (isPositiveBigint(data?.[0]?.entityId ?? 0)) {
              console.log("useSdkEntities() SUB:", data[0]);
              updateEntity(data[0]);
            }
          }
        },
        options: { logging },
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
// Format Bignumberish value for operators
export const formatQueryValue = (value: BigNumberish): string => {
  return addAddressPadding(bigintToHex(value))
}

//
// Extract models from a stored entity
//
export const getEntityModel = <M extends PistolsModelType>(entity: PistolsEntity, modelName: PistolsSchemaModelNames): M => (
  entity?.models.pistols[modelName] as M
)
export const getEntityModels = <M extends PistolsModelType>(entity: PistolsEntity, modelNames: PistolsSchemaModelNames[]): M[] => (
  arrayClean(modelNames.map(modelName => getEntityModel<M>(entity, modelName)))
)

export const useEntityModel = <M extends PistolsModelType>(entity: PistolsEntity, modelName: PistolsSchemaModelNames): M => {
  const model = useMemo(() => getEntityModel<M>(entity, modelName), [entity, modelName])
  return model
}
export const useEntityModels = <M extends PistolsModelType>(entity: PistolsEntity, modelNames: PistolsSchemaModelNames[]): M[] => {
  const models = useMemo(() => getEntityModels<M>(entity, modelNames), [entity, modelNames])
  return models
}

//
// Filter entities by model
//
export const filterEntitiesByModel = (entities: PistolsEntity[], modelNames: PistolsSchemaModelNames | PistolsSchemaModelNames[]): PistolsEntity[] => {
  if (Array.isArray(modelNames)) {
    return entities.filter(e => {
      return (getEntityModels(e, modelNames).length > 0)
    })
  }
  return entities.filter(e => Boolean(getEntityModel(e, modelNames)))
}
