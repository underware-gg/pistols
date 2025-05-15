import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { formatQueryValue, useEntitiesModel, useSdkEntitiesGetState } from '@underware/pistols-sdk/dojo'
import { PistolsClauseBuilder, PistolsEntity, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { bigintEquals } from '@underware/pistols-sdk/utils'
import { models } from '@underware/pistols-sdk/pistols/gen'
import { useLeaderboard, DuelistScore } from './seasonStore'
import { useConfig } from './configStore'

// re-export
export type { DuelistScore }

//----------------------------------------
// Scoreboards of the current season
//

interface State {
  scoreboard: DuelistScore[],
  resetStore: () => void;
  setEntities: (entities: PistolsEntity[]) => void;
  updateEntity: (entity: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEntity = (e: PistolsEntity): DuelistScore | null => {
    const scoreboard = e.models.pistols.SeasonScoreboard
    return scoreboard ? {
      duelistId: BigInt(scoreboard.holder),
      points: Number(scoreboard.points),
    } : null
  }
  const _pushScoreboards = (state: State, entities: PistolsEntity[]) => {
    const newScores = entities.map(_parseEntity).filter(Boolean);
    state.scoreboard = [
      // current scores, less new ones
      ...state.scoreboard.filter(s => !newScores.some(n => bigintEquals(n.duelistId, s.duelistId))),
      // new scores
      ...newScores,
    ].sort((a, b) => b.points - a.points)
  }
  return create<State>()(immer((set) => ({
    scoreboard: [],
    resetStore: () => {
      set((state: State) => {
        state.scoreboard = []
      })
    },
    setEntities: (entities: PistolsEntity[]) => {
      // console.warn("setEntities() =>", entities)
      set((state: State) => {
        _pushScoreboards(state, entities)
      })
    },
    updateEntity: (e: PistolsEntity) => {
      set((state: State) => {
        _pushScoreboards(state, [e])
      });
    },
  })))
}

export const useScoreboardStore = createStore();



//----------------------------------------
// consumer hooks
//

//
// Return the complete Scoreboard of the current season
// in order from first to last
//
export const useCurrentSeasonScoreboard = () => {
  const scoreboard = useScoreboardStore((state) => state.scoreboard);
  // merge with Leaderboard (10 first may be out of order)
  const { currentSeasonId } = useConfig()
  const seasonScoreboard = _useMergeScoreboardWithLeaderboard(scoreboard, currentSeasonId)
  return {
    seasonScoreboard,
  }
}

const _useMergeScoreboardWithLeaderboard = (scoreboard: DuelistScore[], seasonId: number): DuelistScore[] => {
  const { scores: leaderboardScores } = useLeaderboard(seasonId)
  const result = useMemo(() => {
    return [
      ...leaderboardScores,
      ...scoreboard.filter(s => !leaderboardScores.some(l => bigintEquals(l.duelistId, s.duelistId))),
    ]
  }, [leaderboardScores, scoreboard])
  return result
}

export const useDuelistCurrentSeasonScore = (duelist_id: BigNumberish) => {
  const { seasonScoreboard } = useCurrentSeasonScoreboard();
  return _useDuelistScoreboard(seasonScoreboard, duelist_id);
}

const _useDuelistScoreboard = (seasonScoreboard: DuelistScore[], duelist_id: BigNumberish) => {
  const { position, points } = useMemo(() => {
    const index = seasonScoreboard.findIndex(s => bigintEquals(s.duelistId, duelist_id));
    return {
      position: index + 1,
      points: seasonScoreboard[index]?.points ?? 0,
    }
  }, [duelist_id, seasonScoreboard])
  // console.log(`DUELIST SCORE >>>>>>>`, duelist_id, position, points)
  return {
    position,
    points,
  }
}



//----------------------------------------
// queries -- get past season scores
// use with caution (like once per page)
//

export const useSeasonScoreboard = (season_id: number) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    (season_id > 0)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-SeasonScoreboard"],
            [formatQueryValue(season_id), undefined]
          ).build()
        )
        .withEntityModels(
          ["pistols-SeasonScoreboard"]
        )
        .withLimit(1000)
        .includeHashedKeys()
      : null
  ), [season_id])

  const { entities, isLoading } = useSdkEntitiesGetState({ query })
  const scoreboards = useEntitiesModel<models.SeasonScoreboard>(entities, 'SeasonScoreboard')

  const scoreboard = useMemo<DuelistScore[]>(() => (
    scoreboards.map(scoreboard => ({
      duelistId: BigInt(scoreboard.holder),
      points: Number(scoreboard.points),
    })).sort((a, b) => b.points - a.points)
  ), [scoreboards])
  // useEffect(() => console.log(`SCOREBOARDS...`, season_id, seasonScores), [seasonScores])

  const seasonScoreboard = _useMergeScoreboardWithLeaderboard(scoreboard, season_id)

  return {
    seasonScoreboard,
    isLoading,
  }
}

