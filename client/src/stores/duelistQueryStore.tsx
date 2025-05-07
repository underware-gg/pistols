import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useAccount } from '@starknet-react/core'
import { usePlayer } from '/src/stores/playerStore'
import { parseCustomEnum } from '@underware/pistols-sdk/starknet'
import { PistolsEntity } from '@underware/pistols-sdk/pistols'
import { DuelistColumn, SortDirection } from '/src/stores/queryParamsStore'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { calcWinRatio } from '/src/stores/duelistStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
interface StateEntity {
  duelist_id: bigint
  timestamp_registered: number
  timestamp_active: number
  name: string
  fame: number
  honour: number
  win_ratio: number
  total_duels: number
  total_wins: number
  total_losses: number
  total_draws: number
  is_active: boolean
  is_alive: boolean
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
    const { variant } = parseCustomEnum<constants.DuelistProfile, any>(duelist?.duelist_profile)
    if (!duelist || variant != constants.DuelistProfile.Genesis) return undefined
    let currentChallenge = e.models.pistols.DuelistAssignment
    let memorial = e.models.pistols.DuelistMemorial
    return {
      duelist_id: BigInt(duelist.duelist_id),
      timestamp_registered: Number(duelist.timestamps.registered),
      timestamp_active: Number(duelist.timestamps.active),
      name: 'DUELIST_????',
      fame: 0,
      honour: Number(duelist.totals.honour ?? 0),
      win_ratio: calcWinRatio(Number(duelist.totals.total_duels ?? 0), Number(duelist.totals.total_wins ?? 0)),
      total_duels: Number(duelist.totals.total_duels ?? 0),
      total_wins: Number(duelist.totals.total_wins ?? 0),
      total_losses: Number(duelist.totals.total_losses ?? 0),
      total_draws: Number(duelist.totals.total_draws ?? 0),
      is_active: (Number(duelist.totals.total_duels ?? 0) > 0 || isPositiveBigint(currentChallenge?.duel_id ?? 0n)),
      is_alive: !Boolean(memorial),
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
      result = result.filter((e) => e.name.toLowerCase().includes(filterName.toLowerCase()))
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
