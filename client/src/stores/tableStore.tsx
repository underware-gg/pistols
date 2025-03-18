import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityModel } from '@underware/pistols-sdk/dojo'
import { useEntityId } from '@underware/pistols-sdk/utils/hooks'
import { feltToString, stringToFelt, parseEnumVariant } from '@underware/pistols-sdk/utils/starknet'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { bigintToDecimal, bigintToHex } from '@underware/pistols-sdk/utils'

export const useTableConfigStore = createDojoStore<PistolsSchemaType>();

export const useAllTableIds = () => {
  const entities = useTableConfigStore((state) => state.entities)
  const tableIds = useMemo(() => (
    Object.values(entities).map(e => feltToString(e.models.pistols.TableConfig.table_id))
  ), [entities])
  return {
    tableIds,
  }
}

export const useAllSeasonTableIds = () => {
  const entities = useTableConfigStore((state) => state.entities)
  const seasonTableIds = useMemo(() => (
    Object.values(entities)
      .filter(e => Boolean(e.models?.pistols?.SeasonConfig))
      .map(e => feltToString(e.models?.pistols?.SeasonConfig?.table_id))
    // .map(e => feltToString(e.models?.pistols?.TableConfig?.table_id))
    // .filter(id => id.startsWith('Season'))
  ), [entities])
  return {
    seasonTableIds,
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

export const useSeason = (table_id: string) => {
  const entityId = useEntityId([stringToFelt(table_id)])
  const entities = useTableConfigStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const season = useEntityModel<models.SeasonConfig>(entity, 'SeasonConfig')
  // console.log(`useSeason() =>`, table_id, season)

  const seasonId = useMemo(() => (season ? feltToString(season.season_id) : '?'), [season])
  const phase = useMemo(() => (parseEnumVariant<constants.SeasonPhase>(season?.phase) ?? null), [season])
  const period = useMemo(() => (season?.period ?? null), [season])
  const timestamp_start = useMemo(() => (period ? Number(period.start) : null), [period])
  const timestamp_end = useMemo(() => (period ? Number(period.end) : null), [period])

  return {
    tableId: table_id,
    seasonId,
    phase,
    timestamp_start,
    timestamp_end,
  }
}

export type DuelistScore = {
  duelistId: bigint
  score: number
}

export const useLeaderboard = (table_id: string) => {
  const entityId = useEntityId([stringToFelt(table_id)])
  const entities = useTableConfigStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const leaderboard = useEntityModel<models.Leaderboard>(entity, 'Leaderboard')
  // console.log(`useLeaderboard() =>`, table_id, leaderboard)

  const maxPositions = useMemo(() => Number(leaderboard?.positions ?? 0), [leaderboard])
  const _duelistIds = useMemo(() => BigInt(leaderboard?.duelist_ids ?? 0), [leaderboard])
  const _scores = useMemo(() => BigInt(leaderboard?.scores ?? 0), [leaderboard])

  const scores = useMemo(() => {
    const result: DuelistScore[] = []
    for (let i = 0n; i < maxPositions; i++) {
      const duelistId = (_duelistIds >> (i * 24n)) & 0xffffffn
      const score = (_scores >> (i * 24n)) & 0xffffffn
      if (duelistId > 0n) {
        result.push({
          duelistId,
          score: Number(score),
        })
      }
    }
    return result
  }, [leaderboard, _duelistIds, _scores])

  return {
    tableId: table_id,
    maxPositions,
    scores,
  }
}
