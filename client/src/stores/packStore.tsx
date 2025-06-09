import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { formatQueryValue, useEntitiesModel, useSdkEntitiesGet, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { usePacksOfPlayer } from '/src/hooks/useTokenPacks'
import { debug } from '@underware/pistols-sdk/pistols'

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

export const useFetchPacksOfPlayer = () => {
  const packState = usePackStore((state) => state)
  const { packIds } = usePacksOfPlayer()

  const entities = useMemo(() => Object.values(packState.entities), [packState.entities])
  const packs = useEntitiesModel<models.Pack>(entities, 'Pack')
  const existingPackIds = useMemo(() => packs.map((p) => BigInt(p.pack_id)), [packs])

  const newPackIds = useMemo(() => (
    packIds.filter((id) => !existingPackIds.includes(BigInt(id)))
  ), [packIds, existingPackIds])

  const query = useMemo<PistolsQueryBuilder>(() => (
    newPackIds.length > 0
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().where("pistols-Pack", "pack_id", "In", newPackIds.map(formatQueryValue)).build()
        )
        .withEntityModels(
          ["pistols-Pack"]
        )
        .includeHashedKeys()
      : null
  ), [newPackIds])

  useSdkEntitiesGet({
    query,
    setEntities: (entities: PistolsEntity[]) => {
      entities.forEach(e => {
        debug.log(`usePack() SET =======> [entity]:`, e)
        packState.updateEntity(e)
      })
    },
  })


  return {}
}
