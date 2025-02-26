import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useDojoSystem, useEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { constants, models } from '@underware_gg/pistols-sdk/pistols/gen'
import { makeAbiCustomEnum, makeCustomEnumEntityId } from '@underware_gg/pistols-sdk/utils'
import { usePackType } from '/src/stores/packStore'

export const useBankStore = createDojoStore<PistolsSchemaType>();


const _usePoolEntityId = (pool_id: string, value?: bigint): string | undefined => {
  const { abi } = useDojoSystem('bank')
  const _enum = makeAbiCustomEnum(abi, 'PoolType', pool_id, value)
  const _entityId = makeCustomEnumEntityId(_enum)
  return _entityId
}

const _usePool = (pool_id: string, value?: bigint) => {
  const entities = useBankStore((state) => state.entities);
  const entityId = _usePoolEntityId(pool_id, value)
  const entity = useMemo(() => entities[entityId], [entities])

  const pool = useEntityModel<models.Pool>(entity, 'Pool')
  // useEffect(() => console.log(`useConfig() =>`, config), [config])

  // const poolId = useMemo(() => (pool?.pool_id ?? '?'), [pool])
  const balanceLords = useMemo(() => BigInt(pool?.balance_lords ?? 0), [pool])
  const balanceFame = useMemo(() => BigInt(pool?.balance_fame ?? 0), [pool])

  return {
    poolId: pool_id,
    seasonId: value,
    tournamentId: value,
    balanceLords,
    balanceFame,
  }
}

//--------------------------------
// 'consumer' hooks
//
export type UsePoolResult = ReturnType<typeof _usePool>

export const usePool = (pool_id: string) => {
  return _usePool(pool_id)
}

export const useSeasonPool = (season_id: BigNumberish) => {
  return _usePool(constants.PoolType.Season, BigInt(season_id))
}

export const useTournamentPool = (tournament_id: BigNumberish) => {
  return _usePool(constants.PoolType.Tournament, BigInt(tournament_id))
}


//
// count the number of funded Starter Packs
// If zero, claiming will fail!
export const useFundedStarterPackCount = () => {
  const { balanceLords } = usePool(constants.PoolType.Purchases)
  const { priceLords } = usePackType(constants.PackType.StarterPack)
  const fundedCount = useMemo(() => Number(balanceLords / priceLords), [balanceLords, priceLords])
  return {
    fundedCount,
  }
}

