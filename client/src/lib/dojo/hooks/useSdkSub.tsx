import { useCallback, useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { SubscriptionQueryType } from '@dojoengine/sdk'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { PistolsSchemaType } from '@/games/pistols/generated/typescript/models.gen'

export type PistolsSubQuery = SubscriptionQueryType<PistolsSchemaType>

export type EntityResult = {
  entityId: BigNumberish,
} & Partial<PistolsSchemaType['pistols']>

export type UseSdkSubEntitiesResult = {
  entities: EntityResult[] | null
  isSubscribed: boolean
}

export type UseSdkSubEntitiesProps = {
  query: PistolsSubQuery
  logging?: boolean
  enabled?: boolean
}

export const useSdkSubscribeEntities = <T,>({
  query,
  logging = false,
  enabled = true,
}: UseSdkSubEntitiesProps): UseSdkSubEntitiesResult => {
  const { sdk } = useDojoSetup()
  const [entities, setEntities] = useState<EntityResult[] | null>()
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    let _unsubscribe: (() => void) | undefined;
    
    const _subscribe = async () => {
      const subscription = await sdk.subscribeEntityQuery(
        query,
        (response) => {
          if (response.error) {
            if (_unsubscribe) {
              setEntities(undefined);
              console.error("useSdkSubscribeEntities() error:", response.error.message)
            }
          } else if (
            response.data &&
            response.data[0].entityId !== "0x0"
          ) {
            if (_unsubscribe) {
              setEntities(response.data.map((e: any) => ({
                entityId: e.entityId,
                ...e.models.pistols,
              } as EntityResult)))
            }
          }
        },
        { logging }
      );
      setIsSubscribed(true)
      _unsubscribe = () => subscription.cancel()
    }

    // mount
    setIsSubscribed(false)
    if (enabled) {
      _subscribe()
    } else {
      setEntities(undefined)
    }

    // umnount
    return () => {
      setIsSubscribed(false)
      _unsubscribe?.()
      _unsubscribe = undefined
    }
  }, [sdk, query, logging, enabled])

  return {
    entities,
    isSubscribed,
  }
}
