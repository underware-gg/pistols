import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useDojoSystem, useEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { constants, models } from '@underware_gg/pistols-sdk/pistols/gen'
import { makeAbiCustomEnum, makeCustomEnum, makeCustomEnumEntityId } from '@underware_gg/pistols-sdk/utils'
import { BigNumberish, CallData } from 'starknet'

export const useBankStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// 'consumer' hooks
//
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

export const usePool = (pool_id: string) => {
  return _usePool(pool_id)
}

export const useSeasonPool = (season_id: BigNumberish) => {
  return _usePool(constants.PoolType.Season, BigInt(season_id))
}

export type UsePoolResult = ReturnType<typeof _usePool>
