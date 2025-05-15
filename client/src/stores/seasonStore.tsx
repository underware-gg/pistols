import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityModelByKeys } from '@underware/pistols-sdk/dojo'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { useConfig } from '/src/stores/configStore'

export const useSeasonStore = createDojoStore<PistolsSchemaType>();

export const useAllSeasonIds = () => {
  const entities = useSeasonStore((state) => state.entities)
  const seasonIds = useMemo(() => (
    Object.values(entities)
      .filter(e => Boolean(e.models?.pistols?.SeasonConfig))
      .map(e => Number(e.models?.pistols?.SeasonConfig?.season_id))
  ), [entities])
  return {
    seasonIds,
  }
}

export const useCurrentSeason = () => {
  const { currentSeasonId } = useConfig()
  return useSeason(currentSeasonId)
}

export const useSeason = (season_id: number) => {
  const entities = useSeasonStore((state) => state.entities);
  const season = useEntityModelByKeys<models.SeasonConfig>(entities, 'SeasonConfig', [season_id])
  // console.log(`useSeason() =>`, season_id, season)

  const seasonExists = useMemo(() => Boolean(season), [season])
  const seasonName = useMemo(() => (`Season ${season?.season_id ?? '?'}`), [season])
  const phase = useMemo(() => (parseEnumVariant<constants.SeasonPhase>(season?.phase) ?? null), [season])
  const isActive = useMemo(() => (phase == constants.SeasonPhase.InProgress), [season])
  const isFinished = useMemo(() => (phase == constants.SeasonPhase.Ended), [season])

  const period = useMemo(() => (season?.period ?? null), [season])
  const timestamp_start = useMemo(() => (period ? Number(period.start) : null), [period])
  const timestamp_end = useMemo(() => (period ? Number(period.end) : null), [period])

  return {
    seasonId: season_id,
    seasonExists,
    seasonName,
    phase,
    timestamp_start,
    timestamp_end,
    isActive,
    isFinished,
  }
}

export type DuelistScore = {
  duelistId: bigint
  points: number
}

export const useLeaderboard = (season_id: number) => {
  const entities = useSeasonStore((state) => state.entities);
  const leaderboard = useEntityModelByKeys<models.Leaderboard>(entities, 'Leaderboard', [season_id])
  // console.log(`useLeaderboard() =>`, season_id, leaderboard)

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
          points: Number(score),
        })
      }
    }
    return result
  }, [leaderboard, _duelistIds, _scores])

  return {
    seasonId: season_id,
    maxPositions,
    scores,
  }
}
