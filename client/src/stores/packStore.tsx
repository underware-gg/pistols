import { useMemo } from 'react'
import { BigNumberish, CairoCustomEnum } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { createDojoStore } from '@dojoengine/sdk/react'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { useEntitiesModel, useSdkEntitiesGet, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { usePacksOwnedByAccount } from '/src/hooks/useTokenPacks'
import { debug } from '@underware/pistols-sdk/pistols'
import { bigintToAddress, bigintToDecimal, bigintToHex128 } from '@underware/pistols-sdk/utils'
import { useDuelistProfile } from './duelistStore'

export const usePackStore = createDojoStore<PistolsSchemaType>();


export const usePackType = (packType: constants.PackType) => {
  const descriptor = useMemo(() => constants.PACK_TYPES[packType], [packType])
  const name = useMemo(() => (descriptor?.name ?? null), [descriptor])
  const canPurchase = useMemo(() => (descriptor?.can_purchase ?? false), [descriptor])
  const priceLords = useMemo(() => (descriptor?.price_lords ?? null), [descriptor])
  const quantity = useMemo(() => (descriptor?.quantity ?? null), [descriptor])
  const contents = useMemo(() => (descriptor?.contents ?? null), [descriptor])
  const imageUrlOpen = useMemo(() => (
    descriptor ? `/tokens/packs/${descriptor.image_file_open}` : null
  ), [descriptor])
  const imageUrlClosed = useMemo(() => (
    descriptor ? `/tokens/packs/${descriptor.image_file_closed}` : null
  ), [descriptor])
  return {
    name,
    imageUrlOpen,
    imageUrlClosed,
    canPurchase,
    priceLords,
    quantity,
    contents,
  }
}


//--------------------------------
// Get pack from the store
//
export const usePack = (pack_id: BigNumberish) => {
  const entities = usePackStore((state) => state.entities);
  const pack = useStoreModelsByKeys<models.Pack>(entities, 'Pack', [pack_id])

  const packExists = useMemo(() => Boolean(pack), [pack])
  const isOpen = useMemo(() => pack?.is_open ?? false, [pack])
  const packType = useMemo(() => pack ? parseEnumVariant<constants.PackType>(pack.pack_type) : null, [pack])
  const descriptor = usePackType(packType)

  const packIdDisplay = useMemo(() => (
    `Pack #${packExists ? bigintToDecimal(pack_id) : '?'}`
  ), [pack_id, packExists])

  const { profileType, profileKey } = useDuelistProfile(pack?.duelist_profile?.isSome() ? pack.duelist_profile.unwrap() : null)
  const contents = useMemo(() => {
    return (profileType && profileKey) ? `${profileType}: (${profileKey})` : descriptor.contents
  }, [profileType, profileKey, descriptor])

  return {
    packExists,
    packType,
    isOpen,
    packIdDisplay,
    ...descriptor,
    contents,
  }
}



//-----------------------------------------
// Fetch new Pack and add to the store
// (for non default challenges, like tutorials)
//

export const useFetchPacksOwnedByPlayer = () => {
  const { address } = useAccount()
  return useFetchPacksOwnedByAccount(address)
}

export const useFetchPacksOwnedByAccount = (address: BigNumberish) => {
  const packState = usePackStore((state) => state)
  const { packIds } = usePacksOwnedByAccount(address)

  const entities = useMemo(() => Object.values(packState.entities), [packState.entities])
  const packs = useEntitiesModel<models.Pack>(entities, 'Pack')
  const existingPackIds = useMemo(() => packs.map((p) => BigInt(p.pack_id)), [packs])

  debug.log(`PROGRESS(player_packs) - ${packIds.length} packs to fetch, ${existingPackIds.length} packs already in store`)

  const newPackIds = useMemo(() => (
    packIds.filter((id) => !existingPackIds.includes(BigInt(id)))
  ), [packIds, existingPackIds])

  debug.log("PROGRESS(player_packs) - newPackIds", newPackIds)

  const query = useMemo<PistolsQueryBuilder>(() => (
    newPackIds.length > 0
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().where("pistols-Pack", "pack_id", "In", newPackIds.map(bigintToHex128)).build()
        )
        .withEntityModels(
          ["pistols-Pack"]
        )
        .includeHashedKeys()
      : null
  ), [newPackIds])

  debug.log("PROGRESS(player_packs) - query", query)

  const { isLoading, isFinished } = useSdkEntitiesGet({
    query,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useFetchPacksOwnedByAccount() SET =======> [entities]:`, entities)
      entities.forEach(e => {
        packState.updateEntity(e)
      })
    },
  })

  debug.log("PROGRESS(player_packs) - isLoading", isLoading)
  debug.log("PROGRESS(player_packs) - isFinished", isFinished)

  return {
    isLoading,
    isFinished,
  }
}
