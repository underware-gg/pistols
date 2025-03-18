import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityModel } from '@underware/pistols-sdk/dojo'
import { useEntityId } from '@underware/pistols-sdk/utils/hooks'
import { feltToString, stringToFelt, parseEnumVariant } from '@underware/pistols-sdk/utils/starknet'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'

export const useTableConfigStore = createDojoStore<PistolsSchemaType>();

export const useAllTableIds = () => {
  const entities = useTableConfigStore((state) => state.entities)
  const tableIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models.pistols.TableConfig.table_id)), [entities])
  return {
    tableIds,
  }
}

export const useAllSeasonIds = () => {
  const entities = useTableConfigStore((state) => state.entities)
  const seasonIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models?.pistols?.TableConfig?.table_id)), [entities])
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
  const rules = useMemo(() => (parseEnumVariant<constants.RulesType>(table?.rules) ?? null), [table])

  const isPractice = useMemo(() => (table_id == constants.TABLES.PRACTICE), [table_id])
  const isTutorial = useMemo(() => (table_id == constants.TABLES.TUTORIAL), [table_id])
  const isSeason = useMemo(() => (table_id?.startsWith('Season') ?? false), [table_id])
  const tableTypeDescription = useMemo(() => (
    isPractice ? 'Practice'
      : isTutorial ? 'Tutorial'
        : isSeason ? 'Season'
          : 'Unknown'
  ), [isPractice, isTutorial, isSeason])

  return {
    tableId: table_id,
    description,
    rules,
    isPractice,
    isTutorial,
    isSeason,
    tableTypeDescription,
  }
}
