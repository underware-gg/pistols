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
  isLoading: boolean | undefined
  isSubscribed: boolean | undefined
}

export type UseSdkEntitiesProps = {
  query_get: PistolsGetQuery
  query_sub?: PistolsSubQuery
  setEntities: (entities: PistolsEntity[]) => void // stores initial state
  updateEntity?: (entities: PistolsEntity) => void // store updates (if absent, do not subscribe)
  enabled?: boolean
  // get options
  limit?: number
  offset?: number
  logging?: boolean
}
export type UseSdkEventsProps = UseSdkEntitiesProps & {
  historical?: boolean
}

export type SdkCallbackResponse = {
  data?: PistolsEntity[] | PistolsEntity[][]
  error?: Error
}


//---------------------------------------
// entities get/subscribe
//
export const useSdkEntities = ({
  query_get,
  query_sub,
  setEntities,
  updateEntity,
  enabled = true,
  limit = 100,
  offset = 0,
  logging = false,
}: UseSdkEntitiesProps): UseSdkEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const [isSubscribed, setIsSubscribed] = useState<boolean>()

  //
  // get...
  useEffect(() => {
    const _get = async () => {
      setIsLoading(true)
      await sdk.getEntities({
        query: query_get,
        callback: (response: SdkCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEntities().sdk.get() error:", response.error)
          } else if (response.data) {
            // console.log("useSdkEntities() GOT:", response.data)
            setEntities(response.data as PistolsEntity[])
          }
          setIsLoading(false)
        },
        limit,
        offset,
        options: { logging },
        dontIncludeHashedKeys: false,
      })
    }
    // get...
    if (sdk && query_get && enabled) _get()
  }, [sdk, query_get, enabled])

  //
  // subscribe...
  useEffect(() => {
    let _unsubscribe: (() => void) | undefined;
    const _subscribe = async () => {
      setIsSubscribed(undefined)
      const subscription = await sdk.subscribeEntityQuery({
        query: query_sub,
        callback: (response: SdkCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEntities().sdk.subscribe() error:", response.error)
          } else {
            console.log("useSdkEntities() SUB:", response.data);
            if (response.data[0]) {
              updateEntity(response.data[0] as PistolsEntity)
            }
          }
        },
        options: { logging },
      })
      setIsSubscribed(true)
      _unsubscribe = () => subscription.cancel()
    };
    // subscribe
    if (sdk && enabled && query_sub && isLoading === false) _subscribe()
    // unsubscribe
    return () => {
      setIsSubscribed(false)
      _unsubscribe?.()
    }
  }, [sdk, enabled, query_sub, isLoading])

  return {
    isLoading,
    isSubscribed,
  }
}


//---------------------------------------
// events get/subscribe
//
export const useSdkEvents = ({
  query_get,
  query_sub,
  setEntities,
  updateEntity,
  enabled = true,
  limit = 100,
  offset = 0,
  logging = false,
  historical = true,
}: UseSdkEventsProps): UseSdkEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const [isSubscribed, setIsSubscribed] = useState<boolean>()

  const _parseEvents = (data: SdkCallbackResponse['data']): PistolsEntity[] => {
    return !data ? []
      : !historical ? (data as PistolsEntity[])
        : (data as PistolsEntity[][]).reduce((acc: PistolsEntity[], e: PistolsEntity[]) => (
          acc.concat(e)
        ), [] as PistolsEntity[])
  }

  //
  // get...
  useEffect(() => {
    const _get = async () => {
      setIsLoading(true)
      await sdk.getEventMessages({
        query: query_get,
        callback: (response: SdkCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEvents().sdk.get() error:", response.error)
          } else if (response.data) {
            // console.log("useSdkEvents() GOT:", historical, response.data)
            setEntities(_parseEvents(response.data))
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
    // get...
    if (sdk && query_get && enabled) _get()
  }, [sdk, query_get, enabled])

  //
  // subscribe...
  useEffect(() => {
    let _unsubscribe: (() => void) | undefined;

    const _subscribe = async () => {
      setIsSubscribed(undefined)
      const subscription = await sdk.subscribeEventQuery({
        query: query_sub,
        callback: (response: SdkCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEvents().sdk.subscribe() error:", response.error)
          } else {
            // console.log("useSdkEvents() SUB:", historical, response.data);
            const entity = _parseEvents(response.data)[0]
            if (entity) updateEntity(entity)
          }
        },
        options: { logging },
        historical,
      })
      setIsSubscribed(true)
      _unsubscribe = () => subscription.cancel()
    };

    if (sdk && enabled && query_sub && isLoading === false) {
      _subscribe()
    }

    return () => {
      setIsSubscribed(false)
      _unsubscribe?.()
    }
  }, [sdk, enabled, query_sub, isLoading])

  return {
    isLoading,
    isSubscribed,
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
  entity?.models.pistols?.[modelName] as M
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
