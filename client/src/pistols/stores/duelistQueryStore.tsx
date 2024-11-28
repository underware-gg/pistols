import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { useSdkEntities, PistolsQuery, PistolsEntity } from '@/lib/dojo/hooks/useSdkEntities'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { DuelistColumn, SortDirection } from '@/pistols/stores/queryParamsStore'
import { feltToString } from '@/lib/utils/starknet'
import { calcWinRatio } from '@/pistols/hooks/useScore'


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
    let score = e.models.pistols.Duelist.score
    return {
      duelist_id: BigInt(e.models.pistols.Duelist.duelist_id),
      timestamp: Number(e.models.pistols.Duelist.timestamp),
      name: feltToString(e.models.pistols.Duelist.name).toLowerCase(),
      fame: 0,
      honour: Number(score.honour ?? 0),
      win_ratio: calcWinRatio(Number(score.total_duels ?? 0), Number(score.total_wins ?? 0)),
      total_duels: Number(score.total_duels ?? 0),
      total_wins: Number(score.total_wins ?? 0),
      total_losses: Number(score.total_losses ?? 0),
      total_draws: Number(score.total_draws ?? 0),
      is_active: (Number(score.total_duels ?? 0) > 0),
    }
  }
  return create<State>()((set) => ({
    entities: {},
    setEntities: (entities: PistolsEntity[]) => {
      // console.warn("setEntities() =>", entities)
      set((state: State) => ({
        entities: entities.reduce((acc, e) => {
          acc[e.entityId] = _parseEntity(e)
          return acc
        }, {} as StateEntities)
      }))
    },
    updateEntity: (e: PistolsEntity) => {
      set((state: State) => {
        state.entities[e.entityId] = _parseEntity(e)
        return state
      });
    },
  }))
}

export const useDuelistQueryStore = createStore();

//----------------------------------------
// Sync all duelists!
// Add only once to a top level component
//
export function DuelistQueryStoreSync() {
  const { tableId } = useSettings()
  const query = useMemo<PistolsQuery>(() => ({
    pistols: {
      Duelist: [],
    },
  }), [tableId])

  const state = useDuelistQueryStore((state) => state)

  useSdkEntities({
    query,
    setEntities: state.setEntities,
    updateEntity: state.updateEntity,
  })

  useEffect(() => console.log("DuelistQueryStoreSync() =>", state.entities), [state.entities])

  return (<></>)
}


//--------------------------------
// 'consumer' hooks
// will filter and sort all duelists for each view
//
export const useQueryDuelistIds = (
  filterName: string,
  filterActive: boolean,
  sortColumn: DuelistColumn,
  sortDirection: SortDirection,
) => {
  const entities = useDuelistQueryStore((state) => state.entities);

  const duelistIds = useMemo(() => {
    let result = Object.values(entities)

    // filter by name
    if (filterName) {
      result = result.filter((e) => e.name.includes(filterName))
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
  }, [entities, filterName, filterActive, sortColumn, sortDirection])

  return {
    duelistIds,
  }
}
