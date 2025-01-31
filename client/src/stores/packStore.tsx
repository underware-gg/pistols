import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityId, useClientTimestamp } from '@underware_gg/pistols-sdk/utils/hooks'
import { feltToString, parseCustomEnum, bigintEquals, parseEnumVariant, isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
import { formatQueryValue, useEntityModel, useSdkEntities } from '@underware_gg/pistols-sdk/dojo'
import { constants, models, PistolsGetQuery, PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
// FIX: dojo.js 1.0.12 createDojoStore()
import type { GameState } from '@dojoengine/sdk/state'
import { StoreApi, UseBoundStore } from 'zustand'

export const usePackStore = createDojoStore<PistolsSchemaType>() as UseBoundStore<StoreApi<GameState<PistolsSchemaType>>>;


//--------------------------------
// Get pack from the store
//
export const usePack = (duelId: BigNumberish) => {
  const entityId = useEntityId([duelId])
  const entities = usePackStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const pack = useEntityModel<models.Pack>(entity, 'Pack')

  const packType = useMemo(() => parseEnumVariant<constants.PackType>(pack?.pack_type), [pack])
  const isOpen = useMemo(() => pack?.is_open ?? false, [pack])

  const description = useMemo(() => (packType ? constants.PACK_TYPES[packType] : null), [packType])
  const name = useMemo(() => (description?.name ?? '?'), [description])
  const imageUrlOpen = useMemo(() => (description?.image_url_open ?? null), [description])
  const imageUrlClosed = useMemo(() => (description?.image_url_closed ?? null), [description])
  const price = useMemo(() => (description?.price ?? null), [description])

  return {
    packExists: (pack != null),
    packType,
    isOpen,
    name,
    imageUrlOpen,
    imageUrlClosed,
    price,
  }
}



//--------------------------------
// Fetch new challenge and add to the store
// (for non default tables, like tutorials)
//

export const useGetPack = (pack_id: BigNumberish) => {
  const result = usePack(pack_id)

  const query_get = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      Pack: {
        $: {
          where: {
            pack_id: { $eq: formatQueryValue(pack_id) },
          },
        },
      },
    },
  }), [pack_id])

  const setEntities = usePackStore((state) => state.setEntities)

  useSdkEntities({
    query_get,
    enabled: (isPositiveBigint(pack_id) && !result.packExists),
    setEntities,
  })

  return result
}

