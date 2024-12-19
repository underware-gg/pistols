import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk'
import { useEntityModel } from '@/lib/dojo/hooks/useSdkEntities'
import { PistolsSchemaType, models } from '@/lib/dojo/hooks/useSdkTypes'
import { useEntityId } from '@underware_gg/pistols-sdk/hooks'
import { TableType } from '@/games/pistols/generated/constants'
import { feltToString, stringToFelt } from '@underware_gg/pistols-sdk/utils'

export const useTableConfigStore = createDojoStore<PistolsSchemaType>();

export const useAllTableIds = () => {
  const entities = useTableConfigStore((state) => state.entities)
  const tableIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models.pistols.TableConfig.table_id)), [entities])
  return {
    tableIds,
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
  const tableType = useMemo(() => ((table?.table_type as unknown as TableType) ?? null), [table])
  const tableTypeDescription = useMemo(() => (table?.table_type ? {
    [TableType.Classic]: 'Classic',
    [TableType.Tournament]: 'Tournament',
    [TableType.IRLTournament]: 'IRL Tournamment',
  }[table.table_type] : null), [table])

  return {
    tableId: table_id,
    description,
    feeMin,
    tableType: tableTypeDescription ?? '?',
    tableIsOpen: table?.is_open ?? false,
    isTournament: (tableType == TableType.Tournament),
    isIRLTournament: (tableType == TableType.IRLTournament),
  }
}
