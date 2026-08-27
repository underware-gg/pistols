import { useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { bigintToAddress } from 'src/utils/misc/types'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import {
  PistolsToriiResponse,
  PistolsEntity,
  PistolsQueryBuilder,
  PistolsModelType,
  PistolsSchemaModelNames,
  PistolsGetParams,
  SdkSubscribeResponse,
  SdkSubscriptionCallbackResponse,
} from 'src/games/pistols/sdk/types_web'
import {
  getEntityModel,
  entityContainsModels,
} from 'src/games/pistols/sdk/utils_web'
import { useEntityId } from 'src/dojo/hooks/useEntityId'
import { debug } from 'src/games/pistols/misc/debug'
import { useLatestRef } from 'src/utils/hooks/useLatestRef'


//---------------------------------------
// Get entities from torii
//
// stores at remote store compatible with createDojoStore()
// initial state calls: setEntities()
// updates calls: updateEntity() (optional)
//

export type UseSdkGetResult = {
  isLoading: boolean | undefined
  isFinished: boolean | undefined
}

export type UseSdkGetProps = {
  query: PistolsQueryBuilder
  enabled?: boolean
  retryInterval?: number
  resetStore?: () => void     // called on the 1st page to reset store, if present
  setEntities: (entities: PistolsEntity[]) => void
  updateProgress?: (currentPage: number, finished?: boolean) => void  // called page by page to report progress
}
export type UseSdkSubProps = UseSdkGetProps & {
  updateEntity: (entities: PistolsEntity) => void // store update callback
}


//---------------------------------------
// get w/ pagination
//

const _filterItems = (data: PistolsEntity[]): PistolsEntity[] => {
  return data ? data.filter(e => e && e.entityId != '0x0') : []
}

// Named so eslint can see this is a hook. The underscore prefix hid it from
// react-hooks/rules-of-hooks, which cannot tell an internal hook from a plain
// function that illegally calls hooks.
const useSdkGetInternal = (prefix: string, {
  fn,
  query,
  enabled,
  setEntities,
  resetStore,
  updateProgress,
  retryInterval = 0,
}: UseSdkGetProps & {
  fn: (query: PistolsGetParams) => Promise<PistolsToriiResponse>
}): UseSdkGetResult => {
  const [isLoading, setIsLoading] = useState<boolean>(undefined)
  const [isFinished, setIsFinished] = useState<boolean>(undefined)
  const prefixRef = useLatestRef(prefix)
  const resetStoreRef = useLatestRef(resetStore)
  const setEntitiesRef = useLatestRef(setEntities)
  const updateProgressRef = useLatestRef(updateProgress)

  useEffect(() => {
    let _mounted = true
    let paginatedQuery = query
    const _get = async () => {
      setIsLoading(true)
      setIsFinished(false)
      try {
        let pageIndex = 0;
        let lastCursor = undefined;
        while (paginatedQuery) {
          updateProgressRef.current?.(pageIndex);
          const response: PistolsToriiResponse = await fn({ query: paginatedQuery });
          if (!_mounted) {
            console.warn(`${prefixRef.current} UNMOUNTED GOT:`, response)
            return
          }
          debug.log(`${prefixRef.current} GOT[page:${pageIndex}]:`, response, paginatedQuery)
          const entities = _filterItems(response.getItems())
          if (pageIndex == 0 && resetStoreRef.current) {
            // debug.log(`${prefix} RESET>>>>>>>>>>>>`)
            resetStoreRef.current()
          }
          if (entities.length > 0) {
            // debug.log(`${prefix} GOT>>>>>>>>>>>>`, entities)
            setEntitiesRef.current(entities)
            paginatedQuery = (
              response.cursor && // has next cursor
              response.cursor != lastCursor // avoid sdk sending repeated cursor
            ) ? response.getNextQuery(paginatedQuery) : null
            lastCursor = response.cursor
            debug.log(`${prefixRef.current} cursor/query=`, lastCursor, paginatedQuery)
          } else {
            setEntitiesRef.current([]); // notify that no events exist to stop trying
            paginatedQuery = null
            if (pageIndex == 0 && retryInterval > 0) {
              debug.log(`${prefixRef.current} retry...`, retryInterval)
              setTimeout(() => _get(), retryInterval)
            }
          }
          pageIndex++;
        }
        updateProgressRef.current?.(pageIndex, true);
      } catch (error) {
        console.error(`${prefixRef.current} exception:`, error)
      }
      if (_mounted) {
        setIsLoading(undefined)
        setIsFinished(true)
      }
    }
    // get...
    if (enabled && fn && query) _get()
    return () => {
      _mounted = false
    }
  }, [enabled, fn, query, retryInterval, prefixRef, resetStoreRef, setEntitiesRef, updateProgressRef])

  return {
    isLoading,
    isFinished,
  }
}

export const useSdkEntitiesGet = ({
  query,
  resetStore,
  setEntities,
  updateProgress,
  enabled = true,
  retryInterval = 0,
}: UseSdkGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  // const limit = useMemo(() => query?.build().pagination.limit, [query])

  const { isLoading, isFinished } = useSdkGetInternal('useSdkEntitiesGet()', {
    fn: sdk.getEntities,
    query,
    resetStore,
    setEntities,
    updateProgress,
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
  updateProgress,
  enabled = true,
  retryInterval = 0,
}: UseSdkGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const historical = useMemo(() => query?.build().historical, [query])
  // const limit = useMemo(() => query?.build().pagination.limit, [query])

  const { isLoading, isFinished } = useSdkGetInternal(`useSdkEventsGet(${historical})`, {
    fn: sdk.getEventMessages,
    query,
    resetStore,
    setEntities,
    updateProgress,
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
  const [isLoading, setIsLoading] = useState<boolean>(undefined)
  const [isFinished, setIsFinished] = useState<boolean>(undefined)
  const setEntitiesRef = useLatestRef(setEntities)
  const updateEntityRef = useLatestRef(updateEntity)

  const limit = useMemo(() => query?.build().pagination.limit, [query])

  useEffect(() => {
    let _mounted = true
    let _unsubscribe: (() => void) = undefined;
    const _subscribe = async () => {
      setIsLoading(true)
      setIsFinished(false)
      debug.log("ENTITIES SUB _______ query:", query);
      sdk.subscribeEntityQuery({
        query,
        callback: (response: SdkSubscriptionCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEntitiesSub() callback error:", response.error, query)
          } else {
            debug.log("useSdkEntitiesSub() SUB:", response.data);
            _filterItems(response.data).forEach(entity => updateEntityRef.current(entity))
          }
        },
      }).then((response: SdkSubscribeResponse) => {
        if (!_mounted) {
          console.warn(`useSdkEntitiesSub() UNMOUNTED GOT:`, response)
          return
        }
        // debug.log("useSdkEntitiesSub() ENTITIES SUB ====== initialEntities:", response);
        const [initialEntities, sub] = response;
        // if (initialEntities.getItems().length == limit) {
        //   console.warn("useSdkEntitiesSub() LIMIT REACHED!!!! Possible loss of data", limit, query)
        // }
        if (!_unsubscribe) {
          _unsubscribe = () => sub.cancel()
          debug.log("useSdkEntitiesSub() ====== initialEntities>>>>>", initialEntities)
          setEntitiesRef.current(_filterItems(initialEntities.getItems()))
        }
      }).catch(error => {
        if (!_mounted) return
        console.error("useSdkEntitiesSub() promise error:", error, query)
      }).finally(() => {
        if (_mounted) {
          setIsLoading(undefined)
          setIsFinished(true)
        }
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
  }, [sdk, enabled, query, setEntitiesRef, updateEntityRef])

  return {
    isLoading,
    isFinished,
  }
}

export const useSdkEventsSub = ({
  query,
  setEntities,
  updateEntity,
  enabled = true,
}: UseSdkSubProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>(undefined)
  const [isFinished, setIsFinished] = useState<boolean>(undefined)
  const setEntitiesRef = useLatestRef(setEntities)
  const updateEntityRef = useLatestRef(updateEntity)

  const limit = useMemo(() => query?.build().pagination.limit, [query])
  const historical = useMemo(() => query?.build().historical, [query])

  useEffect(() => {
    let _mounted = true
    let _unsubscribe: (() => void) = undefined;
    const _subscribe = async () => {
      setIsLoading(true)
      setIsFinished(false)
      debug.log("useSdkEventsSub() _______ query:", query);
      await sdk.subscribeEventQuery({
        query,
        callback: (response: SdkSubscriptionCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEventsSub() callback error:", historical, response.error, query)
          } else {
            // debug.log("useSdkEventsSub() SUB:", historical, response.data);
            _filterItems(response.data).forEach(entity => updateEntityRef.current(entity))
          }
        },
      }).then((response: SdkSubscribeResponse) => {
        if (!_mounted) {
          console.warn(`useSdkEventsSub() UNMOUNTED GOT:`, response)
          return
        }
        // debug.log("useSdkEventsSub() ENTITIES SUB ====== initialEntities:", historical, response);
        const [initialEntities, sub] = response;
        // if (initialEntities.getItems().length == limit) {
        //   console.warn("useSdkEventsSub() LIMIT REACHED!!!! Possible loss of data", limit, query)
        // }
        if (!_unsubscribe) {
          _unsubscribe = () => sub.cancel()
          debug.log("useSdkEventsSub() ====== initialEntities>>>>>", historical, initialEntities, _filterItems(initialEntities.getItems()))
          setEntitiesRef.current(_filterItems(initialEntities.getItems()))
        }
      }).catch(error => {
        if (!_mounted) return
        console.error("useSdkEventsSub() promise error:", historical, error, query)
      }).finally(() => {
        if (_mounted) {
          setIsLoading(undefined)
          setIsFinished(true)
        }
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
  }, [sdk, enabled, query, historical, setEntitiesRef, updateEntityRef])

  return {
    isLoading,
    isFinished,
  }
}


//---------------------------------------
// utils
//

//
// Extract models from a stored entity
//

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
  const entity = useMemo(() => entitiesMap[entityId], [entitiesMap, entityId])
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
