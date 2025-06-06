import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useConfig } from '/src/stores/configStore'
import { useSeasonScoreboard } from '/src/stores/scoreboardStore'
import { useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { useBlockedPlayersDuelistIds } from '/src/stores/playerStore'

export const useSeasonStore = createDojoStore<PistolsSchemaType>();

export const useAllSeasonIds = () => {
  const entities = useSeasonStore((state) => state.entities)
  const seasonIdsAscending = useMemo(() => (
    Object.values(entities)
      .filter(e => Boolean(e.models?.pistols?.SeasonConfig))
      .sort((a, b) => Number(b.models?.pistols?.SeasonConfig?.period?.start) - Number(a.models?.pistols?.SeasonConfig?.period?.start))
      .map(e => Number(e.models?.pistols?.SeasonConfig?.season_id))
      .sort((a, b) => (a - b))
  ), [entities])
  const seasonIdsDescending = useMemo(() => (
    seasonIdsAscending.sort((a, b) => (b - a))
  ), [seasonIdsAscending])
  return {
    seasonIdsAscending,
    seasonIdsDescending,
  }
}

export const useCurrentSeason = () => {
  const { currentSeasonId } = useConfig()
  return useSeason(currentSeasonId)
}

export const useSeason = (season_id: number) => {
  const entities = useSeasonStore((state) => state.entities);
  const season = useStoreModelsByKeys<models.SeasonConfig>(entities, 'SeasonConfig', [season_id])
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



//----------------------------------------
// Leaderboards
//

export type DuelistScore = {
  duelistId: bigint
  points: number
}

export const useLeaderboard = (season_id: number) => {
  const entities = useSeasonStore((state) => state.entities);
  const leaderboard = useStoreModelsByKeys<models.Leaderboard>(entities, 'Leaderboard', [season_id])
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

export const useFullLeaderboard = (season_id: number) => {
  const { scores: leaderboardScores } = useLeaderboard(season_id || 0);
  const { seasonScoreboard } = useSeasonScoreboard(season_id || 0);
  const { blockedPlayersDuelistIds } = useBlockedPlayersDuelistIds()

  const scores = useMemo(() => (
    [
      ...leaderboardScores,
      ...(seasonScoreboard || []).filter(s =>
        s && s.duelistId !== undefined &&
        !(leaderboardScores || []).some(l => l && l.duelistId === s.duelistId)
      ),
    ].filter(score => !blockedPlayersDuelistIds.includes(score.duelistId))
  ), [leaderboardScores, seasonScoreboard, blockedPlayersDuelistIds])

  return {
    scores,
  }
}
