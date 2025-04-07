import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { feltToString, makeAbiCustomEnum, makeCustomEnumEntityId, stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { useDojoSystem, useEntityModel } from '@underware/pistols-sdk/dojo'
import { usePackType } from '/src/stores/packStore'

export const useBankStore = createDojoStore<PistolsSchemaType>();


const _usePoolEntityId = (pool_type: string, value?: bigint): string | undefined => {
  const { abi } = useDojoSystem('bank')
  const _enum = makeAbiCustomEnum(abi, 'PoolType', pool_type, value)
  const _entityId = makeCustomEnumEntityId(_enum)
  return _entityId
}

const _usePool = (pool_type: string, value?: bigint) => {
  const entities = useBankStore((state) => state.entities);
  const entityId = _usePoolEntityId(pool_type, value)
  const entity = useMemo(() => entities[entityId], [entities])

  const pool = useEntityModel<models.Pool>(entity, 'Pool')
  // useEffect(() => console.log(`useConfig() =>`, config), [config])

  // const poolId = useMemo(() => (pool?.pool_id ?? '?'), [pool])
  const balanceLords = useMemo(() => BigInt(pool?.balance_lords ?? 0), [pool])
  const balanceFame = useMemo(() => BigInt(pool?.balance_fame ?? 0), [pool])

  return {
    poolType: pool_type,
    seasonId: value ? feltToString(value) : undefined,
    tournamentId: value,
    balanceLords,
    balanceFame,
  }
}

//--------------------------------
// 'consumer' hooks
//
export type UsePoolResult = ReturnType<typeof _usePool>

export const usePool = (pool_type: string) => {
  return _usePool(pool_type)
}

export const useSeasonPool = (season_table_id: string) => {
  return _usePool(constants.PoolType.Season, BigInt(stringToFelt(season_table_id)))
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

