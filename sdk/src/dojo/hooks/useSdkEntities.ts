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
} from 'src/games/pistols/config/types'
import * as torii from '@dojoengine/torii-client'


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

type UseSdkEntitiesProps = {
  query: PistolsQueryBuilder
  enabled?: boolean
}
export type UseSdkEntitiesGetProps = UseSdkEntitiesProps & {
  retryInterval?: number
  setEntities: (entities: PistolsEntity[]) => void // stores set callback (erases previous state)
}
export type UseSdkEntitiesSubProps = UseSdkEntitiesProps & {
  setEntities: (entities: PistolsEntity[]) => void // stores set callback (erases previous state)
  updateEntity: (entities: PistolsEntity) => void // store update callback
}

export type UseSdkEventsGetProps = UseSdkEntitiesGetProps & {
  query: PistolsQueryBuilder | PistolsHistoricalQueryBuilder
}
export type UseSdkEventsSubProps = UseSdkEntitiesSubProps & {
  query: PistolsQueryBuilder | PistolsHistoricalQueryBuilder
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
// entities get/subscribe
//

const _filterItems = (data: PistolsEntity[]): PistolsEntity[] => {
  return data ? data.filter(e => e && e.entityId != '0x0') : []
}

export const useSdkEntitiesGet = ({
  query,
  setEntities,
  enabled = true,
  retryInterval = 0,
}: UseSdkEntitiesGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const limit = useMemo(() => query?.build().pagination.limit, [query])

  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      setIsLoading(true)
      await sdk.getEntities({
        query,
      }).then((response: PistolsToriiResponse) => {
        if (!_mounted) return
        console.log("useSdkEntitiesGet() GOT:", response)
        const entities = _filterItems(response.getItems())
        if (entities.length > 0) {
          // console.log("useSdkEntitiesGet() GOT>>>>>>>>>>>>", entities)
          setEntities(entities)
          setIsLoading(false)
        } else if (retryInterval > 0) {
          console.log("useSdkEntitiesGet() retry...", retryInterval)
          setTimeout(() => _get(), retryInterval)
        } else {
          setIsLoading(false)
        }
      }).catch((error: Error) => {
        if (!_mounted) return
        console.error("useSdkEntitiesGet().sdk.get() error:", error, query)
        setIsLoading(false)
      })
    }
    // get...
    if (sdk && query && enabled) _get()
    return () => {
      _mounted = false
    }
  }, [sdk, query, enabled])

  return {
    isLoading,
    isFinished: (isLoading === false)
  }
}

export const useSdkEntitiesSub = ({
  query,
  setEntities,
  updateEntity,
  enabled = true,
}: UseSdkEntitiesSubProps): UseSdkGetResult => {
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
            _filterItems(response.data).forEach(entity => updateEntity(entity) )
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


//---------------------------------------
// events get/subscribe
//

export const useSdkEventsGet = ({
  query,
  setEntities,
  enabled = true,
  retryInterval = 0,
}: UseSdkEventsGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const limit = useMemo(() => query?.build().pagination.limit, [query])
  const historical = useMemo(() => query?.build().historical, [query])

  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      setIsLoading(true)
      sdk.getEventMessages({
        query,
      }).then((response: PistolsToriiResponse) => {
        if (!_mounted) return
        // console.log("useSdkEventsGet() GOT:", historical, response.data)
        const entities = _filterItems(response.getItems())
        // if (entities.length == limit) {
        //   console.warn("useSdkEventsGet() LIMIT REACHED!!!! Possible loss of data", limit, query)
        // }
        if (entities.length > 0) {
          // console.log("useSdkEventsGet() GOT>>>>>>>>>>>>", historical, entities)
          setEntities(entities)
          setIsLoading(false)
        } else if (retryInterval > 0) {
          console.log("useSdkEventsGet() retry...", historical, retryInterval)
          setTimeout(() => _get(), retryInterval)
        }
      }).catch((error: Error) => {
        if (!_mounted) return
        console.error("useSdkEventsGet() error:", historical, error, query)
        setIsLoading(false)
      })
    }
    // get...
    if (sdk && query && enabled) _get()
    return () => {
      _mounted = false
    }
  }, [sdk, query, enabled])

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
}: UseSdkEventsSubProps): UseSdkGetResult => {
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
export const getEntityModel = <M extends PistolsModelType>(entity: PistolsEntity, modelName: PistolsSchemaModelNames): M => (
  entity?.models.pistols?.[modelName] as M
)
export const getEntityModels = <M extends PistolsModelType>(entity: PistolsEntity, modelNames: PistolsSchemaModelNames[]): M[] => (
  arrayClean(modelNames.map(modelName => getEntityModel<M>(entity, modelName)))
)
export const entityHasModels = (entity: PistolsEntity, modelNames: PistolsSchemaModelNames[]): boolean => (
  modelNames.some(modelName => Boolean(entity?.models.pistols?.[modelName]))
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
