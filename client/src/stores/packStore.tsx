import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityId } from '@underware_gg/pistols-sdk/utils/hooks'
import { parseEnumVariant, isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
import { formatQueryValue, useEntityModel, useSdkEntitiesGet } from '@underware_gg/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware_gg/pistols-sdk/pistols'
import { constants, models } from '@underware_gg/pistols-sdk/pistols/gen'

export const usePackStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// Get pack from the store
//
export const usePack = (pack_id: BigNumberish) => {
  const entityId = useEntityId([pack_id])
  const entities = usePackStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const pack = useEntityModel<models.Pack>(entity, 'Pack')

  const packType = useMemo(() => parseEnumVariant<constants.PackType>(pack?.pack_type), [pack])
  const isOpen = useMemo(() => pack?.is_open ?? false, [pack])

  const description = useMemo(() => (packType ? constants.PACK_TYPES[packType] : null), [packType])
  const name = useMemo(() => (description?.name ?? '?'), [description])
  const imageUrlOpen = useMemo(() => (description?.image_url_open ?? null), [description])
  const imageUrlClosed = useMemo(() => (description?.image_url_closed ?? null), [description])
  const canPurchase = useMemo(() => (description?.can_purchase ?? false), [description])
  const price = useMemo(() => (description?.lords_price ?? null), [description])
  const quantity = useMemo(() => (description?.quantity ?? null), [description])

  return {
    packExists: (pack != null),
    packType,
    isOpen,
    name,
    imageUrlOpen,
    imageUrlClosed,
    canPurchase,
    price,
    quantity,
  }
}



//-----------------------------------------
// Fetch new Pack and add to the store
// (for non default tables, like tutorials)
//

export const useGetPack = (pack_id: BigNumberish) => {
  const result = usePack(pack_id)

  // const query_get = useMemo<PistolsQueryBuilder>(() => ({
  //   pistols: {
  //     Pack: {
  //       $: {
  //         where: {
  //           pack_id: { $eq: formatQueryValue(pack_id) },
  //         },
  //       },
  //     },
  //   },
  // }), [pack_id])
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

