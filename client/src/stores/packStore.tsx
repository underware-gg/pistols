import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { formatQueryValue, useSdkEntitiesGet, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'

export const usePackStore = createDojoStore<PistolsSchemaType>();


export const usePackType = (packType: constants.PackType) => {
  const description = useMemo(() => constants.PACK_TYPES[packType], [packType])
  const name = useMemo(() => (description?.name ?? 'Pack'), [description])
  const imageUrlOpen = useMemo(() => (description?.image_url_open ?? null), [description])
  const imageUrlClosed = useMemo(() => (description?.image_url_closed ?? null), [description])
  const canPurchase = useMemo(() => (description?.can_purchase ?? false), [description])
  const priceLords = useMemo(() => (description?.price_lords ?? null), [description])
  const quantity = useMemo(() => (description?.quantity ?? null), [description])
  return {
    name,
    imageUrlOpen,
    imageUrlClosed,
    canPurchase,
    priceLords,
    quantity,
  }
}


//--------------------------------
// Get pack from the store
//
export const usePack = (pack_id: BigNumberish) => {
  const entities = usePackStore((state) => state.entities);
  const pack = useStoreModelsByKeys<models.Pack>(entities, 'Pack', [pack_id])

  const isOpen = useMemo(() => pack?.is_open ?? false, [pack])
  const packType = useMemo(() => parseEnumVariant<constants.PackType>(pack?.pack_type), [pack])
  const packDescription = usePackType(packType)

  return {
    packExists: (pack != null),
    packType,
    isOpen,
    ...packDescription,
  }
}



//-----------------------------------------
// Fetch new Pack and add to the store
// (for non default challenges, like tutorials)
//

export const useGetPack = (pack_id: number) => {
  const result = usePack(pack_id)

  const query = useMemo<PistolsQueryBuilder>(() => (
    isPositiveBigint(pack_id)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-Pack"],
            [formatQueryValue(pack_id)]
          ).build()
        )
        .withEntityModels(
          ["pistols-Pack"]
        )
        .includeHashedKeys()
      : null
  ), [pack_id])

  const updateEntity = usePackStore((state) => state.updateEntity)

  useSdkEntitiesGet({
    query,
    enabled: !result.packExists,
    setEntities: (entities: PistolsEntity[]) => {
      entities.forEach(e => {
        console.log(`useGetPack() SET =======> [entity]:`, e)
        updateEntity(e)
      })
    },
  })

  return result
}

