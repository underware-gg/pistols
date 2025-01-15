import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useAccount } from '@starknet-react/core'
import { PistolsEntity } from '@underware_gg/pistols-sdk/pistols'
import { DuelistColumn, SortDirection } from '/src/stores/queryParamsStore'
import { feltToString, bigintEquals, isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
import { calcWinRatio } from '/src/hooks/useScore'
import { usePlayer } from '/src/stores/playerStore'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
interface StateEntity {
  duelist_id: bigint
  timestamp: number
  name: string
  fame: number
  honour: number
  win_ratio: number
  total_duels: number
  total_wins: number
  total_losses: number
  total_draws: number
  is_active: boolean
}
interface StateEntities {
  [entityId: string]: StateEntity,
}
interface State {
  entities: StateEntities,
  setEntities: (entities: PistolsEntity[]) => void;
  updateEntity: (entity: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEntity = (e: PistolsEntity) => {
    let duelist = e.models.pistols.Duelist
    let currentChallenge = e.models.pistols.DuelistChallenge
    let scoreboard = e.models.pistols.Scoreboard
    if (!duelist) return undefined
    return {
      duelist_id: BigInt(duelist.duelist_id),
      timestamp: Number(duelist.timestamp),
      name: 'DUELIST_????',
      fame: 0,
      honour: Number(scoreboard?.score.honour ?? 0),
      win_ratio: calcWinRatio(Number(scoreboard?.score.total_duels ?? 0), Number(scoreboard?.score.total_wins ?? 0)),
      total_duels: Number(scoreboard?.score.total_duels ?? 0),
      total_wins: Number(scoreboard?.score.total_wins ?? 0),
      total_losses: Number(scoreboard?.score.total_losses ?? 0),
      total_draws: Number(scoreboard?.score.total_draws ?? 0),
      is_active: (Number(scoreboard?.score.total_duels ?? 0) > 0 || isPositiveBigint(currentChallenge?.duel_id ?? 0n)),
    }
  }
  return create<State>()(immer((set) => ({
    entities: {},
    setEntities: (entities: PistolsEntity[]) => {
      // console.warn("setEntities() =>", entities)
      set((state: State) => {
        state.entities = entities.reduce((acc, e) => {
          const value = _parseEntity(e)
          if (value) {
            acc[e.entityId] = value
          }
          return acc
        }, {} as StateEntities)
      })
    },
    updateEntity: (e: PistolsEntity) => {
      set((state: State) => {
        const value = _parseEntity(e)
        if (value) {
          state.entities[e.entityId] = value
        }
      });
    },
  })))
}

export const useDuelistQueryStore = createStore();



//--------------------------------
// 'consumer' hooks
// will filter and sort all duelists for each view
//
export const useQueryDuelistIds = (
  filterName: string,
  filterActive: boolean,
  filterBookmarked: boolean,
  sortColumn: DuelistColumn,
  sortDirection: SortDirection,
) => {
  const { address } = useAccount()
  const { bookmarkedDuelists } = usePlayer(address)
  const entities = useDuelistQueryStore((state) => state.entities);

  const duelistIds = useMemo(() => {
    let result = Object.values(entities)

    // filter by name
    if (filterName) {
      result = result.filter((e) => e.name.includes(filterName))
    }

    // filter by bookmarked duelists
    if (filterBookmarked) {
      result = result.filter((e) => (bookmarkedDuelists.find(p => bigintEquals(p, e.duelist_id)) !== undefined))
    }

    // filter by active
    if (filterActive) {
      result = result.filter((e) => (e.is_active))
    }

    // sort...
    result = result.sort((duelist_a, duelist_b) => {
      // Sort by names, or both rookies
      const _sortByName = (a: string, b: string) => {
        return isAscending ? a.localeCompare(duelist_b.name) : b.localeCompare(duelist_a.name)
      }
      const isAscending = (sortDirection == SortDirection.Ascending)
      if (sortColumn == DuelistColumn.Name) {
        return _sortByName(duelist_a.name, duelist_b.name)
      }
      // Rookies at the bottom
      if (!duelist_a.is_active && !duelist_b.is_active) return 0
      if (!duelist_a.is_active) return 1
      if (!duelist_b.is_active) return -1
      // Sort by values
      const _sortTotals = (a: number, b: number) => {
        return (!isAscending ? (b - a) : (a - b))
        // return (!isAscending ? (b - a) : (a && !b) ? -1 : (!a && b) ? 1 : (a - b))
      }
      if (sortColumn == DuelistColumn.Honour) return _sortTotals(duelist_a.honour, duelist_b.honour)
      if (sortColumn == DuelistColumn.Wins) return _sortTotals(duelist_a.total_wins, duelist_b.total_wins)
      if (sortColumn == DuelistColumn.Losses) return _sortTotals(duelist_a.total_losses, duelist_b.total_losses)
      if (sortColumn == DuelistColumn.Draws) return _sortTotals(duelist_a.total_draws, duelist_b.total_draws)
      if (sortColumn == DuelistColumn.Total) return _sortTotals(duelist_a.total_duels, duelist_b.total_duels)
      if (sortColumn == DuelistColumn.WinRatio) return _sortTotals(duelist_a.win_ratio, duelist_b.win_ratio)
      return 0
    })

    // return ids only
    return result.map((e) => e.duelist_id)
  }, [entities, filterName, filterActive, sortColumn, sortDirection, filterBookmarked, bookmarkedDuelists])

  return {
    duelistIds,
  }
}
