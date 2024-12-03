import { useCallback, useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'
import { PistolsGetQuery, PistolsSubQuery, useSdkEntities } from '@/lib/dojo/hooks/useSdkEntities'
import { useDojoSetup } from '@/lib/dojo/DojoContext'

export type {
  PistolsGetQuery,
  PistolsSubQuery,
}

export type EntityResult = {
  entityId: BigNumberish,
} & Partial<PistolsSchemaType['pistols']>

export type UseSdkGetResult = {
  entities: EntityResult[] | null
  isLoading: boolean
  isSubscribed: boolean
  refetch: () => void
}

export const filterEntitiesByModel = <T,>(entities: EntityResult[], modelName: string): T[] =>
  (entities?.map(e => (e[modelName] as T)) ?? [])


//---------------------------------------
// Get entities from torii
//
// (ephemeral)
// stores results at the hook local state
// as: EntityResult[]
//

export type UseSdkGetProps = {
  query_get: PistolsGetQuery
  query_sub?: PistolsSubQuery
  enabled?: boolean
  limit?: number
  offset?: number
  logging?: boolean
}

export const useSdkGet = <T,>({
  query_get,
  query_sub,
  enabled = true,
  limit = 100,
  offset = 0,
  logging = false,
}: UseSdkGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [entities, setEntities] = useState<EntityResult[] | null>()

  const { isLoading, isSubscribed, refetch } = useSdkEntities({
    query_get,
    query_sub,
    enabled,
    limit,
    offset,
    logging,
    setEntities: (entities) => {
      setEntities(entities.map((e: any) => ({
        entityId: e.entityId,
        ...e.models.pistols,
      } as EntityResult)));
    },
    // updateEntity: (e) => {
    //   setEntities(data.map((e: any) => ({
    //     entityId: e.entityId,
    //     ...e.models.pistols,
    //   } as EntityResult)));
    // }
  })

  return {
    entities,
    isLoading,
    isSubscribed,
    refetch,
  }
}
