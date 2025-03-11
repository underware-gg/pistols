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

export type UseSdkEntitiesProps = {
  query: PistolsQueryBuilder
  enabled?: boolean
}
type UseSdkEntitiesGetProps = UseSdkEntitiesProps & {
  setEntities: (entities: PistolsEntity[]) => void // stores set callback (erases previous state)
}
type UseSdkEntitiesSubProps = UseSdkEntitiesProps & {
  setEntities: (entities: PistolsEntity[]) => void // stores set callback (erases previous state)
  updateEntity: (entities: PistolsEntity) => void // store update callback
}

export type UseSdkEventsProps = UseSdkEntitiesProps & {
  historical: boolean
}
type UseSdkEventsGetProps = UseSdkEntitiesGetProps & {
  historical: boolean
}
type UseSdkEventsSubProps = UseSdkEntitiesSubProps & {
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
}: UseSdkEntitiesGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()

  useEffect(() => {
    const _get = async () => {
      setIsLoading(true)
      await sdk.getEntities({
        query,
      }).then((data: PistolsEntity[]) => {
        console.log("useSdkEntitiesGet() GOT:", data)
        setEntities(_filterEntities(data))
      }).catch((error: Error) => {
        console.error("useSdkEntitiesGet().sdk.get() error:", error, query)
      }).finally(() => {
        setIsLoading(false)
      })
    }
    // get...
    if (sdk && query && enabled) _get()
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

  useEffect(() => {
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
        const [initialEntities, sub] = response;
        // console.log("ENTITIES SUB ====== initialEntities:", initialEntities);
        if (!_unsubscribe) {
          _unsubscribe = () => sub.cancel()
          setEntities(_filterEntities(initialEntities))
        }
      }).catch(error => {
        console.error("useSdkEntitiesSub() promise error:", error, query)
      }).finally(() => {
        setIsLoading(false)
      })
    };
    // subscribe
    if (sdk && enabled && query) _subscribe()
    // unsubscribe
    return () => {
      _unsubscribe?.()
      _unsubscribe = () => {}
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
}: UseSdkEventsGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()

  useEffect(() => {
    const _get = async () => {
      setIsLoading(true)
      sdk.getEventMessages({
        query,
        historical,
      }).then((data: PistolsEntity[] | PistolsEntity[][]) => {
        // console.log("useSdkEventsGet() GOT:", historical, response.data)
        setEntities(_parseEvents(data, historical))
      }).catch((error: Error) => {
        console.error("useSdkEventsGet() error:", error, query)
      }).finally(() => {
        setIsLoading(false)
      })
    }
    // get...
    if (sdk && query && enabled) _get()
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

  useEffect(() => {
    let _unsubscribe: (() => void) = undefined;
    const _subscribe = async () => {
      setIsLoading(true)
      console.log("EVENTS SUB _______ query:", query);
      await sdk.subscribeEventQuery({
        query,
        historical,
        callback: (response: SdkEventsCallbackResponse) => {
          if (response.error) {
            console.error("useSdkEventsSub() callback error:", response.error, query)
          } else {
            // console.log("useSdkEventsSub() SUB:", historical, response.data);
            _parseEvents(response.data, historical).forEach(entity => updateEntity(entity))
          }
        },
      }).then(response => {
        const [initialEntities, sub] = response;
        // console.log("EVENTS SUB ====== initialEntities:", initialEntities);
        if (!_unsubscribe) {
          _unsubscribe = () => sub.cancel()
          setEntities(_parseEvents(initialEntities, historical))
          setIsLoading(false)
        }
      }).catch(error => {
        console.error("useSdkEventsSub() promise error:", error, query)
      }).finally(() => {
        setIsLoading(false)
      })
    };
    // subscribe...
    if (sdk && enabled && query) _subscribe()
    // unsubscribe...
    return () => {
      _unsubscribe?.()
      _unsubscribe = () => { }
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
