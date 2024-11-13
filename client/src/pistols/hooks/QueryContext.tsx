import React, { ReactNode, createContext, useReducer, useContext, useMemo, useEffect } from 'react'
import { BigNumberish } from 'starknet'
import { Entity, getComponentValue, Has } from '@dojoengine/recs'
import { useAccount } from '@starknet-react/core'
import { useEntityQuery } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { calcWinRatio } from '@/pistols/hooks/useScore'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { arrayUnique, bigintEquals, bigintToEntity, keysToEntity } from '@/lib/utils/types'
import { ChallengeState } from '@/games/pistols/generated/constants'
import { AllChallengeStates } from '@/pistols/utils/pistols'
import { useFameBalanceDuelist } from './useFame'

export type DuelistRow = {
  entity: Entity
  duelist_id: bigint
  duelist: any
  // filters
  name: string
  score: any
  fame: any,
  win_ratio: number
  total_duels: number
  is_active: boolean
}
export type ChallengeRow = {
  entity: Entity
  duel_id: bigint
  challenge: any
  // filters
  duelist_a_name: string
  duelist_b_name: string
  state: ChallengeState
  timestamp: number
  isLive: boolean
  isFinished: boolean
  isCanceled: boolean
}

const emptyChallengeQuery = {
  rows: [] as ChallengeRow[],
  challengeIds: [] as bigint[],
  states: [] as ChallengeState[],
  liveCount: 0,
}
export type ChallengeQuery = typeof emptyChallengeQuery

export enum DuelistColumn {
  Name = 'Name',
  Honour = 'Honour', 
  Wins = 'Wins',
  Losses = 'Losses',
  Draws = 'Draws',
  Total = 'Total',
  WinRatio = 'WinRatio',
}

export enum ChallengeColumn {
  Time = 'Time',
  Status = 'Status'
}

export enum SortDirection {
  Ascending = 'ascending',
  Descending = 'descending',
}



//--------------------------------
// State
//

export const initialState = {
  // base data
  allDuelists: [] as DuelistRow[],
  allChallenges: [] as ChallengeRow[],
  // duelist filters
  filterDuelistName: '',
  filterDuelistTable: false,
  filterDuelistActive: false,
  filterDuelistSortColumn: DuelistColumn.Honour,
  filterDuelistSortDirection: SortDirection.Descending,
  //challenge filters
  filterChallengeSortColumn: ChallengeColumn.Time,
  filterChallengeSortDirection: SortDirection.Descending,
  filterStatesLiveDuels: AllChallengeStates,
  filterStatesPastDuels: AllChallengeStates,
  filterStatesDuelistDuels: AllChallengeStates,
  filterShowAllDuels: false,
  // queries
  queryDuelists: [] as DuelistRow[],
  queryLiveDuels: emptyChallengeQuery,
  queryPastDuels: emptyChallengeQuery,
  querySelectedDuelistDuels: emptyChallengeQuery,
}

enum QueryActions {
  SET_DUELISTS = 'SET_DUELISTS',
  SET_CHALLENGES = 'SET_CHALLENGES',
  FILTER_DUELIST_NAME = 'FILTER_DUELIST_NAME',
  FILTER_DUELIST_TABLE = 'FILTER_DUELIST_TABLE',
  FILTER_DUELIST_ACTIVE = 'FILTER_DUELIST_ACTIVE',
  FILTER_DUELIST_SORT_COLUMN = 'FILTER_DUELIST_SORT_COLUMN',
  FILTER_DUELIST_SORT_DIRECTION = 'FILTER_DUELIST_SORT_DIRECTION',
  FILTER_CHALLENGE_SORT_COLUMN = 'FILTER_CHALLENGE_SORT_COLUMN',
  FILTER_CHALLENGE_SORT_DIRECTION = 'FILTER_CHALLENGE_SORT_DIRECTION',
  FILTER_STATE_LIVE_DUELS = 'FILTER_STATE_LIVE_DUELS',
  FILTER_STATE_PAST_DUELS = 'FILTER_STATE_PAST_DUELS',
  FILTER_STATE_DUELIST_DUELS = 'FILTER_STATE_DUELIST_DUELS',
  FILTER_SHOW_ONLY_YOUR_DUELS = 'FILTER_SHOW_ONLY_YOUR_DUELS',
  QUERY_DUELISTS = 'QUERY_DUELISTS',
  QUERY_LIVE_DUELS = 'QUERY_LIVE_DUELS',
  QUERY_PAST_DUELS = 'QUERY_PAST_DUELS',
  QUERY_DUELIST_DUELS = 'QUERY_DUELIST_DUELS',
}


//--------------------------------
// Types
//
type QueryContextStateType = typeof initialState

type ActionType =
  | { type: 'SET_DUELISTS', payload: DuelistRow[] }
  | { type: 'SET_CHALLENGES', payload: ChallengeRow[] }
  | { type: 'FILTER_DUELIST_NAME', payload: string }
  | { type: 'FILTER_DUELIST_TABLE', payload: boolean }
  | { type: 'FILTER_DUELIST_ACTIVE', payload: boolean }
  | { type: 'FILTER_DUELIST_SORT_COLUMN', payload: DuelistColumn }
  | { type: 'FILTER_DUELIST_SORT_DIRECTION', payload: SortDirection }
  | { type: 'FILTER_CHALLENGE_SORT_COLUMN', payload: ChallengeColumn }
  | { type: 'FILTER_CHALLENGE_SORT_DIRECTION', payload: SortDirection }
  | { type: 'FILTER_STATE_LIVE_DUELS', payload: ChallengeState[] }
  | { type: 'FILTER_STATE_PAST_DUELS', payload: ChallengeState[] }
  | { type: 'FILTER_STATE_DUELIST_DUELS', payload: ChallengeState[] }
  | { type: 'FILTER_SHOW_ONLY_YOUR_DUELS', payload: boolean }
  | { type: 'QUERY_DUELISTS', payload: DuelistRow[] }
  | { type: 'QUERY_LIVE_DUELS', payload: ChallengeQuery }
  | { type: 'QUERY_PAST_DUELS', payload: ChallengeQuery }
  | { type: 'QUERY_DUELIST_DUELS', payload: ChallengeQuery }



//--------------------------------
// Context
//
const QueryContext = createContext<{
  state: QueryContextStateType
  dispatch: React.Dispatch<any>
}>({
  state: initialState,
  dispatch: () => null,
})


//--------------------------------
// Provider
//
interface QueryProviderProps {
  children: string | JSX.Element | JSX.Element[] | ReactNode
}
const QueryProvider = ({
  children,
}: QueryProviderProps) => {
  const { Duelist, Scoreboard, Challenge } = useDojoComponents()
  const { tableId, duelistId } = useSettings()
  const { selectedDuelistId } = usePistolsContext()
  const { address } = useAccount()

  const [state, dispatch] = useReducer((state: QueryContextStateType, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
      case QueryActions.SET_DUELISTS: {
        newState.allDuelists = action.payload as DuelistRow[]
        break
      }
      case QueryActions.SET_CHALLENGES: {
        newState.allChallenges = action.payload as ChallengeRow[]
        break
      }
      case QueryActions.FILTER_DUELIST_NAME: {
        newState.filterDuelistName = (action.payload as string).toLowerCase()
        break
      }
      case QueryActions.FILTER_DUELIST_TABLE: {
        newState.filterDuelistTable = action.payload as boolean
        break
      }
      case QueryActions.FILTER_DUELIST_ACTIVE: {
        newState.filterDuelistActive = action.payload as boolean
        break
      }
      case QueryActions.FILTER_DUELIST_SORT_COLUMN: {
        newState.filterDuelistSortColumn = action.payload as DuelistColumn
        break
      }
      case QueryActions.FILTER_DUELIST_SORT_DIRECTION: {
        newState.filterDuelistSortDirection = action.payload as SortDirection
        break
      }
      case QueryActions.FILTER_CHALLENGE_SORT_COLUMN: {
        newState.filterChallengeSortColumn = action.payload as ChallengeColumn
        break
      }
      case QueryActions.FILTER_CHALLENGE_SORT_DIRECTION: {
        newState.filterChallengeSortDirection = action.payload as SortDirection
        break
      }
      case QueryActions.FILTER_STATE_LIVE_DUELS: {
        newState.filterStatesLiveDuels = action.payload as ChallengeState[]
        break
      }
      case QueryActions.FILTER_STATE_PAST_DUELS: {
        newState.filterStatesPastDuels = action.payload as ChallengeState[]
        break
      }
      case QueryActions.FILTER_STATE_DUELIST_DUELS: {
        newState.filterStatesDuelistDuels = action.payload as ChallengeState[]
        break
      }
      case QueryActions.FILTER_SHOW_ONLY_YOUR_DUELS: {
        newState.filterShowAllDuels = action.payload as boolean
        break
      }
      case QueryActions.QUERY_DUELISTS: {
        newState.queryDuelists = action.payload as DuelistRow[]
        break
      }
      case QueryActions.QUERY_LIVE_DUELS: {
        newState.queryLiveDuels = action.payload as ChallengeQuery
        break
      }
      case QueryActions.QUERY_PAST_DUELS: {
        newState.queryPastDuels = action.payload as ChallengeQuery
        break
      }
      case QueryActions.QUERY_DUELIST_DUELS: {
        newState.querySelectedDuelistDuels = action.payload as ChallengeQuery
        break
      }
      default:
        console.warn(`QueryProvider: Unknown action [${action.type}]`)
        return state
    }
    return newState
  }, initialState)


  //----------------------
  // Base data
  //
  const duelistEntities: Entity[] = useEntityQuery([Has(Duelist)]) ?? []
  const challengeEntities: Entity[] = useEntityQuery([Has(Challenge)]) ?? []
  const tableIdAsFelt = useMemo(() => stringToFelt(tableId ?? ''), [tableId])

  const allDuelists: DuelistRow[] = useMemo(() =>
    duelistEntities.reduce((acc, entity) => {
      const duelist = getComponentValue(Duelist, entity)
      // const duelistFame = useFameBalanceDuelist(duelist.duelist_id)
      const duelist_id = duelist.duelist_id
      let score = duelist.score
      if (state.filterDuelistTable && tableId) {
        const scoreboard = getComponentValue(Scoreboard, keysToEntity([tableIdAsFelt, duelist_id]))
        score = scoreboard?.score ?? {} as any
      }
      acc.push({
        entity,
        duelist_id,
        duelist,
        // filters
        name: feltToString(duelist.name).toLowerCase(),
        score,
        fame: 1,
        win_ratio: calcWinRatio(score.total_duels ?? 0, score.total_wins ?? 0),
        total_duels: score.total_duels ?? 0,
        is_active: (score.total_duels > 0),
      })
      return acc
    }, [] as DuelistRow[]), [duelistEntities, tableId, tableIdAsFelt, state.filterDuelistTable])

  const allChallenges: ChallengeRow[] = useMemo(() =>
    challengeEntities.reduce((acc, entity) => {
      const challenge = getComponentValue(Challenge, entity)
      const duelistA = getComponentValue(Duelist, bigintToEntity(challenge.duelist_id_a))
      const duelistB = getComponentValue(Duelist, bigintToEntity(challenge.duelist_id_b))
      if (tableId && bigintEquals(challenge.table_id, tableIdAsFelt)) {
        const duel_id = challenge.duel_id
        const state = challenge.state as unknown as ChallengeState
        const timestamp = Number(challenge.timestamp_end ? challenge.timestamp_end : challenge.timestamp_start)
        acc.push({
          entity,
          duel_id,
          challenge,
          // filters
          duelist_a_name: feltToString(duelistA.name).toLowerCase(),
          duelist_b_name: feltToString(duelistB.name).toLowerCase(),
          state,
          timestamp,
          isLive: (state == ChallengeState.Awaiting || state == ChallengeState.InProgress),
          isFinished: (state == ChallengeState.Resolved || state == ChallengeState.Draw),
          isCanceled: (state == ChallengeState.Withdrawn || state == ChallengeState.Refused),
        })
      }
      return acc
    }, [] as ChallengeRow[]), [challengeEntities, tableId, tableIdAsFelt])

  useEffect(() => dispatch({ type: QueryActions.SET_DUELISTS, payload: allDuelists }), [allDuelists])
  useEffect(() => dispatch({ type: QueryActions.SET_CHALLENGES, payload: allChallenges }), [allChallenges])

  function _reduceRowsExcludes<T>(rows: T[], excludes: Set<number>): T[] {
    return rows.reduce((acc, row, index) => {
      if (!excludes.has(index)) acc.push(row)
      return acc
    }, [] as T[])
  }


  //====================================
  // Duelist Query
  //
  useEffect(() => {
    let excludes = new Set<number>()
    //
    // filter by name
    if (state.filterDuelistName) {
      allDuelists.forEach((row, index) => {
        if (!row.name.includes(state.filterDuelistName)) excludes.add(index)
      })
    }
    //
    // filter by active
    if (state.filterDuelistActive) {
      allDuelists.forEach((row, index) => {
        if (!row.is_active) excludes.add(index)
      })
    }
    //
    // filter rows
    const rows = _reduceRowsExcludes(allDuelists, excludes)
    const sortedRows = rows.sort((rowA, rowB) => {
      // Sort by names, or both rookies
      const _sortByName = (a: string, b: string) => {
        return isAscending ? a.localeCompare(rowB.name) : b.localeCompare(rowA.name)
      }
      const sortColumn = state.filterDuelistSortColumn
      const isAscending = (state.filterDuelistSortDirection == SortDirection.Ascending)
      if (sortColumn == DuelistColumn.Name) {
        return _sortByName(rowA.name, rowB.name)
      }
      // Rookies at the bottom
      if (!rowA.is_active && !rowB.is_active) return 0
      if (!rowA.is_active) return 1
      if (!rowB.is_active) return -1
      // Sort by values
      const _sortTotals = (a: number, b: number) => {
        return (!isAscending ? (b - a) : (a - b))
        // return (!isAscending ? (b - a) : (a && !b) ? -1 : (!a && b) ? 1 : (a - b))
      }
      if (sortColumn == DuelistColumn.Honour) return _sortTotals(rowA.score.honour, rowB.score.honour)
      if (sortColumn == DuelistColumn.Wins) return _sortTotals(rowA.score.total_wins, rowB.score.total_wins)
      if (sortColumn == DuelistColumn.Losses) return _sortTotals(rowA.score.total_losses, rowB.score.total_losses)
      if (sortColumn == DuelistColumn.Draws) return _sortTotals(rowA.score.total_draws, rowB.score.total_draws)
      if (sortColumn == DuelistColumn.Total) return _sortTotals(rowA.score.total_duels, rowB.score.total_duels)
      if (sortColumn == DuelistColumn.WinRatio) return _sortTotals(rowA.win_ratio, rowB.win_ratio)
      return 0
    })
    //
    // done!
    dispatch({ type: QueryActions.QUERY_DUELISTS, payload: sortedRows })
  }, [allDuelists,
    state.filterDuelistName,
    state.filterDuelistActive,
    state.filterDuelistSortColumn,
    state.filterDuelistSortDirection,
  ])


  
  //====================================
  // Challenge Queries
  //

  const _buildChallengeQuery = (allRows: ChallengeRow[], excludes: Set<number>, statesFilter: ChallengeState[]): ChallengeQuery => {
    // all rows without state filter
    let rows = _reduceRowsExcludes(allRows, excludes)
    const states = arrayUnique(rows.map(row => row.state))
    // filter by state
    let hides = new Set<number>()
    rows.forEach((row, index) => {
      if (!statesFilter.includes(row.state)) hides.add(index)
    })
    rows = _reduceRowsExcludes(rows, hides)
    // filter by duelist names
    if (state.filterDuelistName) {
      const nameFilter = state.filterDuelistName.toLowerCase()
      hides = new Set<number>()
      rows.forEach((row, index) => {
        const nameA = row.duelist_a_name || ''
        const nameB = row.duelist_b_name || ''
        console.log(nameA, nameB, nameFilter)
        if (!nameA.includes(nameFilter) && !nameB.includes(nameFilter)) {
          hides.add(index)
        }
      })
      rows = _reduceRowsExcludes(rows, hides)
    }
    // sort challenges
    const isAscending = (state.filterChallengeSortDirection == SortDirection.Ascending)
    rows = rows.sort((rowA, rowB) => {
      if (state.filterChallengeSortColumn == ChallengeColumn.Time) {
        return isAscending ? rowA.timestamp - rowB.timestamp : rowB.timestamp - rowA.timestamp
      }
      if (state.filterChallengeSortColumn == ChallengeColumn.Status) {
        return isAscending ? 
          Object.values(ChallengeState).indexOf(rowA.state) - Object.values(ChallengeState).indexOf(rowB.state) :
          Object.values(ChallengeState).indexOf(rowB.state) - Object.values(ChallengeState).indexOf(rowA.state)
      }
      return 0
    })
    // compute totals
    const challengeIds = rows.map(row => row.duel_id)
    const liveCount = rows.reduce((acc, row) => {
      if (row.isLive) acc++
      return acc
    }, 0)
    return {
      rows,
      challengeIds,
      liveCount,
      states,
    }
  }

  function _excludeRowsByDuelist(rows: ChallengeRow[], address: BigNumberish, duelist_id: BigNumberish): Set<number> {
    let excludes = new Set<number>()
    if (!state.filterShowAllDuels) {
      rows.map((row, index) => {
        const check = (
          (duelist_id && bigintEquals(duelist_id, row.challenge.duelist_id_a)) ||
          (duelist_id && bigintEquals(duelist_id, row.challenge.duelist_id_b)) ||
          (address && bigintEquals(address, row.challenge.address_b) && row.state == ChallengeState.Awaiting)
        )
        if (!check) excludes.add(index)
      })
    }
    return excludes
  }

  // Live Duels
  useEffect(() => {
    let excludes = _excludeRowsByDuelist(allChallenges, address, duelistId)
    allChallenges.forEach((row, index) => {
      if (!row.isLive) excludes.add(index)
    })
    const result = _buildChallengeQuery(allChallenges, excludes, state.filterStatesLiveDuels)
    dispatch({ type: QueryActions.QUERY_LIVE_DUELS, payload: result })
  }, [allChallenges, address, duelistId, state.filterStatesLiveDuels, state.filterChallengeSortColumn, state.filterChallengeSortDirection, state.filterDuelistName, state.filterShowAllDuels])

  // Past Duels
  useEffect(() => {
    let excludes = _excludeRowsByDuelist(allChallenges, address, duelistId)
    allChallenges.forEach((row, index) => {
      if (row.isLive) excludes.add(index)
    })
    const result = _buildChallengeQuery(allChallenges, excludes, state.filterStatesPastDuels)
    dispatch({ type: QueryActions.QUERY_PAST_DUELS, payload: result })
  }, [allChallenges, address, duelistId, state.filterStatesPastDuels, state.filterChallengeSortColumn, state.filterChallengeSortDirection, state.filterDuelistName, state.filterShowAllDuels])

  // Selected Duelist Duels
  useEffect(() => {
    let excludes = _excludeRowsByDuelist(allChallenges, undefined, selectedDuelistId)
    const result = _buildChallengeQuery(allChallenges, excludes, state.filterStatesDuelistDuels)
    dispatch({ type: QueryActions.QUERY_DUELIST_DUELS, payload: result })
  }, [allChallenges, selectedDuelistId, state.filterStatesDuelistDuels, state.filterChallengeSortColumn, state.filterChallengeSortDirection, state.filterDuelistName])

  //
  // Finito
  return (
    <QueryContext.Provider value={{
      dispatch, state: {
        ...state,
      }
    }}>
      {children}
    </QueryContext.Provider>
  )
}

export { QueryProvider, QueryContext, QueryActions }







//--------------------------------
// Query Context
//
export const useQueryContext = () => {
  const { state, dispatch } = useContext(QueryContext)
  const dispatchFilterDuelistName = (payload: string) => {
    dispatch({ type: QueryActions.FILTER_DUELIST_NAME, payload })
  }
  const dispatchFilterDuelistTable = (payload: boolean) => {
    dispatch({ type: QueryActions.FILTER_DUELIST_TABLE, payload })
  }
  const dispatchFilterDuelistActive = (payload: boolean) => {
    dispatch({ type: QueryActions.FILTER_DUELIST_ACTIVE, payload })
  }
  const dispatchFilterDuelistSortColumn = (payload: DuelistColumn) => {
    dispatch({ type: QueryActions.FILTER_DUELIST_SORT_COLUMN, payload })
  }
  const dispatchFilterDuelistSortDirection = (payload: SortDirection) => {
    dispatch({ type: QueryActions.FILTER_DUELIST_SORT_DIRECTION, payload })
  }
  const dispatchFilterDuelistSortSwitch = () => {
    dispatch({
      type: QueryActions.FILTER_DUELIST_SORT_DIRECTION,
      payload: state.filterDuelistSortDirection == SortDirection.Ascending ? SortDirection.Descending : SortDirection.Ascending,
    })
  }
  const dispatchFilterChallengeSortColumn = (payload: ChallengeColumn) => {
    dispatch({ type: QueryActions.FILTER_CHALLENGE_SORT_COLUMN, payload })
  }
  const dispatchFilterChallengeSortDirection = (payload: SortDirection) => {
    dispatch({ type: QueryActions.FILTER_CHALLENGE_SORT_DIRECTION, payload })
  }
  const dispatchFilterChallengeSortSwitch = () => {
    dispatch({
      type: QueryActions.FILTER_CHALLENGE_SORT_DIRECTION,
      payload: state.filterChallengeSortDirection == SortDirection.Ascending ? SortDirection.Descending : SortDirection.Ascending,
    })
  }
  const dispatchFilterStatesLiveDuels = (payload: ChallengeState[]) => {
    dispatch({ type: QueryActions.FILTER_STATE_LIVE_DUELS, payload })
  }
  const dispatchFilterStatesPastDuels = (payload: ChallengeState[]) => {
    dispatch({ type: QueryActions.FILTER_STATE_PAST_DUELS, payload })
  }
  const dispatchFilterStatesDuelistDuels = (payload: ChallengeState[]) => {
    dispatch({ type: QueryActions.FILTER_STATE_DUELIST_DUELS, payload })
  }
  const dispatchFilterShowAllDuels = (payload: boolean) => {
    dispatch({ type: QueryActions.FILTER_SHOW_ONLY_YOUR_DUELS, payload })
  }
  return {
    ...state,
    dispatchFilterDuelistName,
    dispatchFilterDuelistTable,
    dispatchFilterDuelistActive,
    dispatchFilterDuelistSortColumn,
    dispatchFilterDuelistSortDirection,
    dispatchFilterDuelistSortSwitch,
    dispatchFilterChallengeSortColumn,
    dispatchFilterChallengeSortDirection,
    dispatchFilterChallengeSortSwitch,
    dispatchFilterStatesLiveDuels,
    dispatchFilterStatesPastDuels,
    dispatchFilterStatesDuelistDuels,
    dispatchFilterShowAllDuels,
  }
}
