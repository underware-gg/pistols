import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { bigintEquals, bigintToAddress } from '@underware/pistols-sdk/utils'
import { useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsClauseBuilder, PistolsEntity, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { useLeaderboard, DuelistScore } from '/src/stores/seasonStore'
import { useScoreboardFetchStore } from '/src/stores/fetchStore'
import { useConfig } from '/src/stores/configStore'
import { debug } from '@underware/pistols-sdk/pistols'
import { useBlockedPlayersDuelistIds } from '/src/stores/playerStore'

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
      seasonId: Number(scoreboard.season_id),
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
  const { blockedPlayersDuelistIds } = useBlockedPlayersDuelistIds()
  
  const { position, points } = useMemo(() => {
    const filteredScoreboard = seasonScoreboard.filter(
      score => !blockedPlayersDuelistIds.includes(score.duelistId)
    )
    
    const sortedScoreboard = [...filteredScoreboard].sort((a, b) => b.points - a.points)
    const index = sortedScoreboard.findIndex(s => bigintEquals(s.duelistId, duelist_id));
    
    return {
      position: index >= 0 ? index + 1 : 0,
      points: sortedScoreboard[index]?.points ?? 0,
    }
  }, [duelist_id, seasonScoreboard, blockedPlayersDuelistIds])
  // console.log(`DUELIST SCORE >>>>>>>`, duelist_id, position, points)
  return {
    position,
    points,
  }
}

export const useDuelistSeasonScore = (duelist_id: BigNumberish, season_id: number) => {
  const { seasonScoreboard } = useGetSeasonScoreboard(season_id);
  const { blockedPlayersDuelistIds } = useBlockedPlayersDuelistIds()
  
  const { position, points } = useMemo(() => {
    const filteredScoreboard = seasonScoreboard.filter(
      score => !blockedPlayersDuelistIds.includes(score.duelistId)
    )
    
    const sortedScoreboard = [...filteredScoreboard].sort((a, b) => b.points - a.points)
    const index = sortedScoreboard.findIndex(s => bigintEquals(s.duelistId, duelist_id));

    return {
      position: index >= 0 ? index + 1 : 0,
      points: sortedScoreboard[index]?.points ?? 0,
    }
  }, [duelist_id, seasonScoreboard, blockedPlayersDuelistIds])
  
  return {
    position,
    points,
  }
}



//----------------------------------------
// queries -- get past season scores
// use with caution (like once per page)
//

export const useGetSeasonScoreboard = (season_id: number) => {
  const scoreboardState = useScoreboardStore((state) => state);
  const fetchState = useScoreboardFetchStore((state) => state);

  // fetch only once per season
  const query = useMemo<PistolsQueryBuilder>(() => (
    (season_id > 0 && fetchState.getNewIds([season_id]).length > 0)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-SeasonScoreboard"],
            [bigintToAddress(season_id), undefined]
          ).build()
        )
        .withEntityModels(
          ["pistols-SeasonScoreboard"]
        )
        .withLimit(2000)
        .includeHashedKeys()
      : null
  ), [season_id, fetchState.ids])

  // add season scores to the store
  const { isLoading, isFinished } = useSdkEntitiesGet({
    query,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useGetSeasonScoreboard() GOT`, season_id, entities);
      scoreboardState.setEntities(entities);
      fetchState.setFetchedIds([BigInt(season_id)]);
    },
  })

  const scoreboard = useMemo<DuelistScore[]>(() => (
    scoreboardState.scoreboard.filter(s => s.seasonId === season_id)
  ), [scoreboardState.scoreboard, season_id])

  const seasonScoreboard = _useMergeScoreboardWithLeaderboard(scoreboard, season_id)

  return {
    seasonScoreboard,
    isLoading,
    isFinished,
  }
}

