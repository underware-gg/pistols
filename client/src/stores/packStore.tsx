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
  const descriptor = useMemo(() => constants.PACK_TYPES[packType], [packType])
  const name = useMemo(() => (descriptor?.name ?? 'Pack'), [descriptor])
  const imageUrlOpen = useMemo(() => (descriptor?.image_url_open ?? null), [descriptor])
  const imageUrlClosed = useMemo(() => (descriptor?.image_url_closed ?? null), [descriptor])
  const canPurchase = useMemo(() => (descriptor?.can_purchase ?? false), [descriptor])
  const priceLords = useMemo(() => (descriptor?.price_lords ?? null), [descriptor])
  const quantity = useMemo(() => (descriptor?.quantity ?? null), [descriptor])
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
  const packDescriptor = usePackType(packType)

  return {
    packExists: (pack != null),
    packType,
    isOpen,
    ...packDescriptor,
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

  const { isLoading, isFinished } = useSdkEntitiesGet({
    query,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useFetchPacksOfPlayer() SET =======> [entities]:`, entities)
      entities.forEach(e => {
        packState.updateEntity(e)
      })
    },
  })

  return {
    isLoading,
    isFinished,
  }
}
