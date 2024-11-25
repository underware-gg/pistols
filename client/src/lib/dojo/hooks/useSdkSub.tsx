import { useEffect, useState } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore, ParsedEntity, StandardizedQueryResult, SubscriptionQueryType } from '@dojoengine/sdk'
import { PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { isPositiveBigint } from '@/lib/utils/types'

type PistolsSubQuery = SubscriptionQueryType<PistolsSchemaType>
export type {
  PistolsSchemaType,
  PistolsSubQuery,
}

export type UseSdkSubEntitiesResult = {
  // entities: EntityResult[] | null
  isSubscribed: boolean
}

export type UseSdkSubEntitiesProps = {
  query: PistolsSubQuery
  set: (entities: ParsedEntity<PistolsSchemaType>[]) => void
  update: (entities: ParsedEntity<PistolsSchemaType>) => void
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
      await sdk.getEntities(
        query,
        (response) => {
          if (response.error) {
            console.error("useSdkSubscribeEntities().getEntities() error:", response.error)
          } else if (response.data) {
            console.log("useSdkSubscribeEntities() GOT:", response.data);
            set?.(response.data);
          }
        },
      );
    };
    _get();
  }, [sdk, query]);

  //----------------------
  // subscribe for updates
  //
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const _subscribe = async () => {
      const subscription = await sdk.subscribeEntityQuery(
        query,
        (response) => {
          if (response.error) {
            console.error("useSdkSubscribeEntities().subscribeEntityQuery() error:", response.error)
          } else if (isPositiveBigint(response.data?.[0]?.entityId ?? 0)) {
            console.log("useSdkSubscribeEntities() SUB:", response.data[0]);
            update?.(response.data[0]);
          }
        },
        { logging }
      );
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
