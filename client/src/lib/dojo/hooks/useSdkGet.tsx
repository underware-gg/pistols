import { useCallback, useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { QueryType } from '@dojoengine/sdk'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'

export type PistolsGetQuery = QueryType<PistolsSchemaType>

export type EntityResult = {
  entityId: BigNumberish,
} & Partial<PistolsSchemaType['pistols']>

export type UseSdkGetEntitiesResult = {
  entities: EntityResult[] | null
  isLoading: boolean
  refetch: () => void
}
export type UseSdkGetEntityResult = {
  entity: EntityResult | null
  isLoading: boolean
  refetch: () => void
}

export type UseSdkGetEntitiesProps = {
  query: PistolsGetQuery
  limit?: number
  offset?: number
  logging?: boolean
  enabled?: boolean
}

export const useSdkGetEntities = <T,>({
  query,
  limit = 100,
  offset = 0,
  logging = false,
  enabled = true,
}: UseSdkGetEntitiesProps): UseSdkGetEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [entities, setEntities] = useState<EntityResult[] | null>()
  const [isLoading, setIsLoading] = useState(false)

  const fetchEntities = useCallback( async () => {
    try {
      setIsLoading(true)
      await sdk.getEntities(
        query,
        (resp) => {
          if (resp.error) {
            setEntities(undefined);
            console.error("useSdkGetEntities() error:", resp.error.message);
            return;
          }
          if (resp.data) {
            // console.log(`useSdkGetEntities() RESP:`, query, resp)
            setEntities(resp.data.map((e: any) => ({
              entityId: e.entityId,
              ...e.models.pistols,
            } as EntityResult)));
          }
        },
        limit,
        offset,
        { logging }
      );
    } catch (error) {
      console.error("useSdkGetEntities() exception:", error);
    } finally {
      setIsLoading(false)
    }
  }, [sdk, query, limit, offset, logging])

  useEffect(() => {
    if (enabled) {
      fetchEntities();
    } else {
      setIsLoading(false)
      setEntities(null);
    }
  }, [fetchEntities, enabled]);

  return {
    entities,
    isLoading,
    refetch: fetchEntities,
  }
}

//
// Single Entity fetch
// (use only when fetching with a keys)
export const useSdkGetEntity = (props: UseSdkGetEntitiesProps): UseSdkGetEntityResult => {
  const { entities, isLoading, refetch } = useSdkGetEntities({
    ...props,
    limit: 1,
  })
  const entity = useMemo(() => (Array.isArray(entities) ? entities[0] : entities), [entities])
  return {
    entity,
    isLoading,
    refetch,
  }
}