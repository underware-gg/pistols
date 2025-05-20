import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useDojoSystem, makeCustomEnumEntityId, useStoreModelsById } from '@underware/pistols-sdk/dojo'
import { feltToString, makeAbiCustomEnum } from '@underware/pistols-sdk/starknet'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
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
  const pool = useStoreModelsById<models.Pool>(entities, 'Pool', entityId)
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

export const useSeasonPool = (season_id: number) => {
  return _usePool(constants.PoolType.Season, BigInt(season_id ?? 0))
}

export const useTournamentPool = (tournament_id: BigNumberish) => {
  return _usePool(constants.PoolType.Tournament, BigInt(tournament_id ?? 0))
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

