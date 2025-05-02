import { useEffect, useMemo, useState } from 'react'
import { BigNumberish, addAddressPadding } from 'starknet'
import { bigintToHex, arrayClean } from 'src/utils/misc/types'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import {
  PistolsQueryBuilder,
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

type UseSdkGetResult = {
  isLoading: boolean | undefined
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
  historical: boolean
}
export type UseSdkEventsSubProps = UseSdkEntitiesSubProps & {
  historical: boolean
}

type SdkEntitiesCallbackResponse = {
  data?: PistolsEntity[]
  error?: Error
};
type SdkEventsCallbackResponse = {
  data?: PistolsEntity[] | PistolsEntity[][]
  error?: Error
};


//---------------------------------------
// entities get/subscribe
//
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
      }).then((data: PistolsEntity[]) => {
        if (!_mounted) return
        console.log("useSdkEntitiesGet() GOT:", data)
        if (data.length == limit) {
          console.warn("useSdkEntitiesGet() LIMIT REACHED!!!! Possible loss of data", limit, query)
        }
        const entities = _filterEntities(data)
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
        callback: (response: SdkEntitiesCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEntitiesSub() callback error:", response.error, query)
          } else {
            console.log("useSdkEntitiesSub() SUB:", response.data);
            _filterEntities(response.data).forEach(entity => updateEntity(entity) )
          }
        },
      }).then(response => {
        if (!_mounted) return
        const [initialEntities, sub] = response;
        // console.log("ENTITIES SUB ====== initialEntities:", initialEntities);
        if (initialEntities.length == limit) {
          console.warn("useSdkEntitiesSub() LIMIT REACHED!!!! Possible loss of data", limit, query)
        }
        if (!_unsubscribe) {
          _unsubscribe = () => sub.cancel()
          setEntities(_filterEntities(initialEntities))
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
  }
}


//---------------------------------------
// events get/subscribe
//
export const useSdkEventsGet = ({
  query,
  setEntities,
  historical,
  enabled = true,
  retryInterval = 0,
}: UseSdkEventsGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const limit = useMemo(() => query?.build().pagination.limit, [query])

  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      setIsLoading(true)
      sdk.getEventMessages({
        query,
        historical,
      }).then((data: PistolsEntity[] | PistolsEntity[][]) => {
        if (!_mounted) return
        // console.log("useSdkEventsGet() GOT:", historical, response.data)
        const entities = _parseEvents(data, historical)
        if (entities.length == limit) {
          console.warn("useSdkEventsGet() LIMIT REACHED!!!! Possible loss of data", limit, query)
        }
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
  }
}

export const useSdkEventsSub = ({
  query,
  setEntities,
  updateEntity,
  historical,
  enabled = true,
}: UseSdkEventsSubProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()
  const limit = useMemo(() => query?.build().pagination.limit, [query])

  useEffect(() => {
    let _mounted = true
    let _unsubscribe: (() => void) = undefined;
    const _subscribe = async () => {
      setIsLoading(true)
      console.log("useSdkEventsSub() _______ query:", query);
      await sdk.subscribeEventQuery({
        query,
        historical,
        callback: (response: SdkEventsCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEventsSub() callback error:", historical, response.error, query)
          } else {
            // console.log("useSdkEventsSub() SUB:", historical, response.data);
            _parseEvents(response.data, historical).forEach(entity => updateEntity(entity))
          }
        },
      }).then(response => {
        if (!_mounted) return
        console.log("useSdkEventsSub() ====== initialEntities:", historical, response);
        const [initialEntities, sub] = response;
        if (initialEntities.length == limit) {
          console.warn("useSdkEventsSub() LIMIT REACHED!!!! Possible loss of data", limit, query)
        }
        if (!_unsubscribe) {
          _unsubscribe = () => sub.cancel()
          console.log("useSdkEventsSub() ====== initialEntities>>>>>", historical, initialEntities, _parseEvents(initialEntities, historical))
          setEntities(_parseEvents(initialEntities, historical))
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
  }
}

const _filterEntities = (data: PistolsEntity[]): PistolsEntity[] => {
  return (data ?? []).filter(e => e && e.entityId != '0x0')
}

const _parseEvents = (data: PistolsEntity[] | PistolsEntity[][], historical: boolean): PistolsEntity[] => {
  return _filterEntities(
    !data ? []
      : !historical ? (data as PistolsEntity[])
        : (data as PistolsEntity[][]).reduce((acc: PistolsEntity[], e: PistolsEntity[]) => (
          acc.concat(e)
        ), [] as PistolsEntity[])
  )
}


//---------------------------------------
// utils
//

//
// Format Bignumberish value for torii query operators
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
