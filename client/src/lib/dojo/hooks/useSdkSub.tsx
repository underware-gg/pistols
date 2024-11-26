import { useEffect, useMemo, useState } from 'react'
import { ParsedEntity, SubscriptionQueryType, QueryType } from '@dojoengine/sdk'
import { PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { isPositiveBigint } from '@/lib/utils/types'
import * as models from '@/games/pistols/generated/typescript/models.gen'

type PistolsQuery = QueryType<PistolsSchemaType>
type PistolsSubQuery = SubscriptionQueryType<PistolsSchemaType>
type PistolsEntity = ParsedEntity<PistolsSchemaType>
export type {
  PistolsSchemaType,
  PistolsQuery,
  PistolsSubQuery,
  PistolsEntity,
  models,
}

export type UseSdkSubEntitiesResult = {
  // entities: EntityResult[] | null
  isSubscribed: boolean
}

export type UseSdkSubEntitiesProps = {
  query: PistolsSubQuery | PistolsQuery
  set: (entities: PistolsEntity[]) => void
  update: (entities: PistolsEntity) => void
  logging?: boolean
}

export const useSdkSubscribeEntities = <T,>({
  query,
  set,
  update,
  logging = false,
}: UseSdkSubEntitiesProps): UseSdkSubEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [isSubscribed, setIsSubscribed] = useState(false)

  //----------------------
  // get initial entities
  //
  useEffect(() => {
    const _get = async () => {
      await sdk.getEntities({
        query: query as PistolsQuery,
        callback: (response) => {
          if (response.error) {
            console.error("useSdkSubscribeEntities().getEntities() error:", response.error)
          } else if (response.data) {
            // console.log("useSdkSubscribeEntities() GOT:", response.data);
            set?.(response.data);
          }
        },
      });
    };
    _get();
  }, [sdk, query]);

  //----------------------
  // subscribe for updates
  //
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const _subscribe = async () => {
      const subscription = await sdk.subscribeEntityQuery({
        query: query as PistolsSubQuery,
        callback: (response) => {
          if (response.error) {
            console.error("useSdkSubscribeEntities().subscribeEntityQuery() error:", response.error)
          } else if (isPositiveBigint(response.data?.[0]?.entityId ?? 0)) {
            // console.log("useSdkSubscribeEntities() SUB:", response.data[0]);
            update?.(response.data[0]);
          }
        },
        options: { logging },
      });
      setIsSubscribed(true)
      unsubscribe = () => subscription.cancel();
    };

    setIsSubscribed(true)
    _subscribe();

    return () => {
      setIsSubscribed(false)
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sdk, query]);

  return {
    isSubscribed,
  }
}

//---------------------------------------
// Extract one model from a atored entity
//
export const useEntityModel = <T,>(entity: PistolsEntity, modelName: string) => {
  const model = useMemo(() => (entity?.models.pistols[modelName] as T), [entity, modelName])
  return model
}

