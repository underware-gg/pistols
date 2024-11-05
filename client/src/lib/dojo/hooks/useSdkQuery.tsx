import { useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { QueryType } from '@dojoengine/sdk'
import { Duelist, PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'
import { useDojoSetup } from '@/lib/dojo/DojoContext'

export type PistolsQuery = QueryType<PistolsSchemaType>


export type EntityResult = {
  entityId: BigNumberish,
} & Partial<PistolsSchemaType['pistols']>

export type UseSdkEntitiesResult = EntityResult[] | null
export type UseSdkEntityResult = EntityResult | null

export type UseSdkEntitiesProps = {
  query: PistolsQuery
  limit?: number
  offset?: number
  logging?: boolean
  enabled?: boolean
}

export const useSdkEntities = <T,>({
  query,
  limit = 100,
  offset = 0,
  logging = false,
  enabled = true,
}: UseSdkEntitiesProps): UseSdkEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [entities, setEntities] = useState<EntityResult[] | null>()

  useEffect(() => {
    const _fetchEntities = async () => {
      try {
        await sdk.getEntities(
          query,
          (resp) => {
            if (resp.error) {
              setEntities(undefined);
              console.error("useSdkEntities() error:", resp.error.message);
              return;
            }
            if (resp.data) {
              // console.log(`useSdkEntities() RESP:`, query, resp)
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
        console.error("useSdkEntities() exception:", error);
      }
    };
    if (enabled) {
      _fetchEntities();
    } else {
      setEntities(null);
    }
  }, [sdk, query, enabled]);

  return entities
}

//
// Single Entity fetch
// (use only when fetching with a keys)
export const useSdkEntity = (props: UseSdkEntitiesProps): UseSdkEntityResult => {
  const entities = useSdkEntities({
    ...props,
    limit: 1,
  })
  const entity = useMemo(() => (Array.isArray(entities) ? entities[0] : entities), [entities])
  return entity
}

export const useSdkDuelist = (props: UseSdkEntitiesProps): Duelist | null => {
  const duelist = useSdkEntity(props)?.['Duelist'] as Duelist
  return duelist
}

