import { useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { bigintToAddress, arrayClean } from 'src/utils/misc/types'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import {
  PistolsToriiResponse,
  PistolsEntity,
  PistolsQueryBuilder,
  PistolsHistoricalQueryBuilder,
  PistolsModelType,
  PistolsSchemaModelNames,
  PistolsGetParams,
} from 'src/games/pistols/sdk/types_web'
import * as torii from '@dojoengine/torii-client'
import { useEntityId } from 'src/exports/dojo'


//---------------------------------------
// Get entities from torii
//
// stores at remote store compatible with createDojoStore()
// initial state calls: setEntities()
// updates calls: updateEntity() (optional)
//

type UseSdkGetResult = {
  isLoading: boolean | undefined
  isFinished: boolean | undefined
}

export type UseSdkGetProps = {
  query: PistolsQueryBuilder
  enabled?: boolean
  retryInterval?: number
  resetStore?: () => void // called on the 1st page to reset store, is present
  setEntities: (entities: PistolsEntity[]) => void // stores set callback (erases previous state)
}
export type UseSdkSubProps = UseSdkGetProps & {
  updateEntity: (entities: PistolsEntity) => void // store update callback
}

export type SdkSubscribeResponse = [
  PistolsToriiResponse,
  torii.Subscription
];

type SdkSubscriptionCallbackResponse = {
  data?: PistolsEntity[]
  error?: Error
};


//---------------------------------------
// get w/ pagination
//

const _filterItems = (data: PistolsEntity[]): PistolsEntity[] => {
  return data ? data.filter(e => e && e.entityId != '0x0') : []
}

const _useSdkGet = (prefix: string, {
  fn,
  query,
  enabled,
  setEntities,
  resetStore,
  retryInterval = 0,
}: UseSdkGetProps & {
  fn: (query: PistolsGetParams) => Promise<PistolsToriiResponse>
}): UseSdkGetResult => {
  const [isLoading, setIsLoading] = useState<boolean>()

  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      setIsLoading(true)
      try {
        let pageIndex = 0;
        let lastCursor = undefined;
        while (query) {
          const response: PistolsToriiResponse = await fn({ query });
          if (!_mounted) return
          console.log(`${prefix} GOT[page:${pageIndex}]:`, response)
          const entities = _filterItems(response.getItems())
          if (pageIndex == 0 && resetStore) {
            // console.log(`${prefix} RESET>>>>>>>>>>>>`)
            resetStore?.()
          }
          if (entities.length > 0) {
            // console.log(`${prefix} GOT>>>>>>>>>>>>`, entities)
            setEntities(entities)
            query = (
              response.cursor && // has next cursor
              response.cursor != lastCursor // avoid sdk sending repeated cursor
            ) ? response.getNextQuery(query) : null
            lastCursor = response.cursor
          } else {
            query = null
            if (pageIndex == 0 && retryInterval > 0) {
              console.log(`${prefix} retry...`, retryInterval)
              setTimeout(() => _get(), retryInterval)
            }
          }
          pageIndex++;
        }
        setIsLoading(false)
      } catch (error) {
        console.error(`${prefix} exception:`, error)
        if (_mounted) setIsLoading(false)
      }
    }
    // get...
    if (enabled && fn && query) _get()
    return () => {
      _mounted = false
    }
  }, [enabled, fn, query])

  return {
    isLoading,
    isFinished: (isLoading === false)
  }
}

export const useSdkEntitiesGet = ({
  query,
  resetStore,
  setEntities,
  enabled = true,
  retryInterval = 0,
}: UseSdkGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  // const limit = useMemo(() => query?.build().pagination.limit, [query])

  const { isLoading, isFinished } = _useSdkGet('useSdkEntitiesGet()', {
    fn: sdk.getEntities,
    query,
    resetStore,
    setEntities,
    enabled,
    retryInterval,
  })

  return {
    isLoading,
    isFinished,
  }
}

export const useSdkEventsGet = ({
  query,
  resetStore,
  setEntities,
  enabled = true,
  retryInterval = 0,
}: UseSdkGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const historical = useMemo(() => query?.build().historical, [query])
  // const limit = useMemo(() => query?.build().pagination.limit, [query])

  const { isLoading, isFinished } = _useSdkGet(`useSdkEventsGet(${historical})`, {
    fn: sdk.getEventMessages,
    query,
    resetStore,
    setEntities,
    enabled,
    retryInterval,
  })

  return {
    isLoading,
    isFinished,
  }
}



//---------------------------------------
// subscriptions...
//

export const useSdkEntitiesSub = ({
  query,
  setEntities,
  updateEntity,
  enabled = true,
}: UseSdkSubProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const limit = useMemo(() => query?.build().pagination.limit, [query])

  useEffect(() => {
    let _mounted = true
    let _unsubscribe: (() => void) = undefined;
    const _subscribe = async () => {
      setIsLoading(true)
      console.log("ENTITIES SUB _______ query:", query);
      sdk.subscribeEntityQuery({
        query,
        callback: (response: SdkSubscriptionCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEntitiesSub() callback error:", response.error, query)
          } else {
            console.log("useSdkEntitiesSub() SUB:", response.data);
            _filterItems(response.data).forEach(entity => updateEntity(entity))
          }
        },
      }).then((response: SdkSubscribeResponse) => {
        if (!_mounted) return
        // console.log("useSdkEntitiesSub() ENTITIES SUB ====== initialEntities:", response);
        const [initialEntities, sub] = response;
        // if (initialEntities.getItems().length == limit) {
        //   console.warn("useSdkEntitiesSub() LIMIT REACHED!!!! Possible loss of data", limit, query)
        // }
        if (!_unsubscribe) {
          _unsubscribe = () => sub.cancel()
          console.log("useSdkEntitiesSub() ====== initialEntities>>>>>", initialEntities)
          setEntities(_filterItems(initialEntities.getItems()))
        }
        setIsLoading(false)
      }).catch(error => {
        if (!_mounted) return
        console.error("useSdkEntitiesSub() promise error:", error, query)
        setIsLoading(false)
      })
    };
    // subscribe
    if (sdk && enabled && query) _subscribe()
    // unsubscribe
    return () => {
      _unsubscribe?.()
      _unsubscribe = undefined
      _mounted = false
    }
  }, [sdk, enabled, query])

  return {
    isLoading,
    isFinished: (isLoading === false)
  }
}

export const useSdkEventsSub = ({
  query,
  setEntities,
  updateEntity,
  enabled = true,
}: UseSdkSubProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const limit = useMemo(() => query?.build().pagination.limit, [query])
  const historical = useMemo(() => query?.build().historical, [query])

  useEffect(() => {
    let _mounted = true
    let _unsubscribe: (() => void) = undefined;
    const _subscribe = async () => {
      setIsLoading(true)
      console.log("useSdkEventsSub() _______ query:", query);
      await sdk.subscribeEventQuery({
        query,
        callback: (response: SdkSubscriptionCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEventsSub() callback error:", historical, response.error, query)
          } else {
            // console.log("useSdkEventsSub() SUB:", historical, response.data);
            _filterItems(response.data).forEach(entity => updateEntity(entity))
          }
        },
      }).then((response: SdkSubscribeResponse) => {
        if (!_mounted) return
        // console.log("useSdkEventsSub() ENTITIES SUB ====== initialEntities:", historical, response);
        const [initialEntities, sub] = response;
        // if (initialEntities.getItems().length == limit) {
        //   console.warn("useSdkEventsSub() LIMIT REACHED!!!! Possible loss of data", limit, query)
        // }
        if (!_unsubscribe) {
          _unsubscribe = () => sub.cancel()
          console.log("useSdkEventsSub() ====== initialEntities>>>>>", historical, initialEntities, _filterItems(initialEntities.getItems()))
          setEntities(_filterItems(initialEntities.getItems()))
          setIsLoading(false)
        }
      }).catch(error => {
        if (!_mounted) return
        console.error("useSdkEventsSub() promise error:", historical, error, query)
        setIsLoading(false)
      })
    };
    // subscribe...
    if (sdk && enabled && query) _subscribe()
    // unsubscribe...
    return () => {
      _unsubscribe?.()
      _unsubscribe = undefined
      _mounted = false
    }
  }, [sdk, enabled, query])

  return {
    isLoading,
    isFinished: (isLoading === false)
  }
}


//---------------------------------------
// utils
//

//
// Format Bignumberish value for torii query operators
export const formatQueryValue = (value: BigNumberish): string => {
  return bigintToAddress(value)
}

//
// Extract models from a stored entity
//
export const getEntityModel = <M extends PistolsModelType>(entity: PistolsEntity, modelName: PistolsSchemaModelNames): M | undefined => (
  entity?.models.pistols?.[modelName] as M
)
export const entityContainsModels = (entity: PistolsEntity, modelNames: PistolsSchemaModelNames[]): boolean => (
  modelNames.some(modelName => Boolean(entity?.models.pistols?.[modelName]))
)

// hooks on DojoStore entities
export const useAllStoreModels = <M extends PistolsModelType>(entitiesMap: Record<string, PistolsEntity>, modelName: PistolsSchemaModelNames): M[] => {
  const entities = useMemo(() => Object.values(entitiesMap), [entitiesMap])
  return useEntitiesModel(entities, modelName)
}
export const useStoreModelsByKeys = <M extends PistolsModelType>(entitiesMap: Record<string, PistolsEntity>, modelName: PistolsSchemaModelNames, keys: BigNumberish[]): M | undefined => {
  const entityId = useEntityId(keys)
  return useStoreModelsById(entitiesMap, modelName, entityId)
}
export const useStoreModelsById = <M extends PistolsModelType>(entitiesMap: Record<string, PistolsEntity>, modelName: PistolsSchemaModelNames, entityId: string): M | undefined => {
  const entity = useMemo(() => entitiesMap[entityId], [entitiesMap[entityId]])
  return useEntityModel(entity, modelName)
}

// hooks on PistolsEntity
export const useEntityModel = <M extends PistolsModelType>(entity: PistolsEntity, modelName: PistolsSchemaModelNames): M | undefined => {
  const model = useMemo(() => getEntityModel<M>(entity, modelName), [entity, modelName])
  return model
}
export const useEntitiesModel = <M extends PistolsModelType>(entities: PistolsEntity[], modelName: PistolsSchemaModelNames): M[] => {
  const models = useMemo(() => (
    entities.reduce((acc, e) => {
      const m = getEntityModel<M>(e, modelName);
      if (m) acc.push(m);
      return acc;
    }, [] as M[])
  ), [entities, modelName])
  return models
}

//
// Filter entities by model
//
export const filterEntitiesByModels = (entities: PistolsEntity[], modelNames: PistolsSchemaModelNames[]): PistolsEntity[] => {
  return entities.filter(e => entityContainsModels(e, modelNames))
}
