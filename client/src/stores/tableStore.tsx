import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { useEntityId } from '@underware_gg/pistols-sdk/utils/hooks'
import { feltToString, stringToFelt, parseEnumVariant } from '@underware_gg/pistols-sdk/utils'
import { PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { constants, models } from '@underware_gg/pistols-sdk/pistols/gen'
// FIX: dojo.js 1.0.12 createDojoStore()
import type { GameState } from '@dojoengine/sdk/state'
import { StoreApi, UseBoundStore } from 'zustand'

export const useTableConfigStore = createDojoStore<PistolsSchemaType>() as UseBoundStore<StoreApi<GameState<PistolsSchemaType>>>;

export const useAllTableIds = () => {
  const entities = useTableConfigStore((state) => state.entities)
  const tableIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models.pistols.TableConfig.table_id)), [entities])
  return {
    tableIds,
  }
}

export const useAllSeasonIds = () => {
  const entities = useTableConfigStore((state) => state.entities)
  const seasonIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models.pistols.SeasonConfig.season_id)), [entities])
  return {
    seasonIds,
  }
}

export const useTable = (table_id: string) => {
  const entityId = useEntityId([stringToFelt(table_id)])
  const entities = useTableConfigStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const table = useEntityModel<models.TableConfig>(entity, 'TableConfig')
  // console.log(`useTable() =>`, table_id, table)

  const description = useMemo(() => (table ? feltToString(table.description) : '?'), [table])
  const feeMin = useMemo(() => BigInt(table?.fee_min ?? 0), [table])
  const tableType = useMemo(() => (parseEnumVariant<constants.TableType>(table?.table_type) ?? null), [table])
  const tableTypeDescription = useMemo(() => (table?.table_type ? {
    [constants.TableType.Practice]: 'Practice',
    [constants.TableType.Tutorial]: 'Tutorial',
    [constants.TableType.Season]: 'Season',
  }[tableType] : null), [table])

  return {
    tableId: table_id,
    description,
    feeMin,
    tableType: tableTypeDescription ?? '?',
    tableIsOpen: table?.is_open ?? false,
    isPractice: (tableType == constants.TableType.Practice),
    isTutorial: (tableType == constants.TableType.Tutorial),
    isSeason: (tableType == constants.TableType.Season),
  }
}