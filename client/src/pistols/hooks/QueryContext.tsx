import React, { ReactNode, createContext, useReducer, useContext, useMemo, useEffect } from 'react'
import { Entity, getComponentValue, Has } from '@dojoengine/recs'
import { useEntityQuery } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { ChallengeState } from '@/pistols/utils/pistols'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { calcWinRatio } from '@/pistols/hooks/useScore'
import { keysToEntity } from '@/lib/utils/types'

export type DuelistRow = {
  entity: Entity
  duelist_id: bigint
  duelist: any
  // filters
  name: string,
  score: any,
  balance: number,
  level: number,
  win_ratio: number
  total_duels: number
  is_active: boolean,
}
export type ChallengeRow = {
  entity: Entity
  duel_id: bigint
  challenge: any,
  // filters
  state: number
  isLive: boolean
  isFinished: boolean
  isCanceled: boolean
}

export enum DuelistColumn {
  Name = 'Name',
  Honour = 'Honour',
  Level = 'Level',
  Wins = 'Wins',
  Losses = 'Losses',
  Draws = 'Draws',
  Total = 'Total',
  WinRatio = 'WinRatio',
  Balance = 'Balance',
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
  // queries
  queryDuelists: [] as DuelistRow[],
  queryYourDuels: [] as ChallengeRow[],
  queryLiveDuels: [] as ChallengeRow[],
  queryPastDuels: [] as ChallengeRow[],
}

enum QueryActions {
  SET_DUELISTS = 'SET_DUELISTS',
  SET_CHALLENGES = 'SET_CHALLENGES',
  FILTER_DUELIST_NAME = 'FILTER_DUELIST_NAME',
  FILTER_DUELIST_TABLE = 'FILTER_DUELIST_TABLE',
  FILTER_DUELIST_ACTIVE = 'FILTER_DUELIST_ACTIVE',
  FILTER_DUELIST_SORT_COLUMN = 'FILTER_DUELIST_SORT_COLUMN',
  FILTER_DUELIST_SORT_DIRECTION = 'FILTER_DUELIST_SORT_DIRECTION',
  QUERY_DUELISTS = 'QUERY_DUELISTS',
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
  | { type: 'QUERY_DUELISTS', payload: DuelistRow[] }



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
  const { tableId } = useSettings()

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
        newState.filterDuelistName = action.payload as string
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
      case QueryActions.QUERY_DUELISTS: {
        newState.queryDuelists = action.payload as DuelistRow[]
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
      const duelist_id = duelist.duelist_id
      let score = duelist.score
      let balance = 0
      if (state.filterDuelistTable && tableId) {
        const scoreboard = getComponentValue(Scoreboard, keysToEntity([tableIdAsFelt, duelist_id]))
        score = scoreboard?.score ?? {} as any
        balance = scoreboard ? (Number(scoreboard.wager_won) - Number(scoreboard.wager_lost)) : undefined
      }
      acc.push({
        entity,
        duelist_id,
        duelist,
        // filters
        name: feltToString(duelist.name),
        score,
        balance,
        win_ratio: calcWinRatio(score.total_duels ?? 0, score.total_wins ?? 0),
        level: Math.max(score.level_villain, score.level_trickster, score.level_lord),
        total_duels: score.total_duels ?? 0,
        is_active: (score.total_duels > 0),
      })
      return acc
    }, [] as DuelistRow[]), [duelistEntities, tableId, tableIdAsFelt, state.filterDuelistTable])

  const allChallenges: ChallengeRow[] = useMemo(() =>
    challengeEntities.reduce((acc, entity) => {
      const challenge = getComponentValue(Challenge, entity)
      const duel_id = challenge.duel_id
      const state = challenge.state
      acc.push({
        entity,
        duel_id,
        challenge,
        // filters
        state,
        isLive: (state == ChallengeState.Awaiting || state == ChallengeState.InProgress),
        isFinished: (state == ChallengeState.Resolved || state == ChallengeState.Draw),
        isCanceled: (state == ChallengeState.Withdrawn || state == ChallengeState.Refused),
      })
      return acc
    }, [] as ChallengeRow[]), [challengeEntities])

  useEffect(() => dispatch({ type: QueryActions.SET_DUELISTS, payload: allDuelists }), [allDuelists])
  useEffect(() => dispatch({ type: QueryActions.SET_CHALLENGES, payload: allChallenges }), [allChallenges])


  //====================================
  // Custom Duelist Query
  //
  useEffect(() => {
    let excludes = new Set()
    //
    // filter by name
    if (state.filterDuelistName) {
      allDuelists.forEach((row, index) => {
        if (!row.duelist.name.includes(state.filterDuelistName)) excludes.add(index)
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
    const rows = allDuelists.reduce((acc, row, index) => {
      if (!excludes.has(index)) acc.push(row)
      return acc
    }, [])
    //
    // Sort
    // console.log(`ROWS:`,rows)
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
      if (sortColumn == DuelistColumn.Level) return _sortTotals(rowA.level, rowB.level)
      if (sortColumn == DuelistColumn.Wins) return _sortTotals(rowA.score.total_wins, rowB.score.total_wins)
      if (sortColumn == DuelistColumn.Losses) return _sortTotals(rowA.score.total_losses, rowB.score.total_losses)
      if (sortColumn == DuelistColumn.Draws) return _sortTotals(rowA.score.total_draws, rowB.score.total_draws)
      if (sortColumn == DuelistColumn.Total) return _sortTotals(rowA.score.total_duels, rowB.score.total_duels)
      if (sortColumn == DuelistColumn.WinRatio) return _sortTotals(rowA.win_ratio, rowB.win_ratio)
      if (sortColumn == DuelistColumn.Balance) return _sortTotals(rowA.balance, rowB.balance)
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
    dispatch({
      type: QueryActions.FILTER_DUELIST_NAME,
      payload,
    })
  }
  const dispatchFilterDuelistTable = (payload: boolean) => {
    dispatch({
      type: QueryActions.FILTER_DUELIST_TABLE,
      payload,
    })
  }
  const dispatchFilterDuelistActive = (payload: boolean) => {
    dispatch({
      type: QueryActions.FILTER_DUELIST_ACTIVE,
      payload,
    })
  }
  const dispatchFilterDuelistSortColumn = (payload: DuelistColumn) => {
    dispatch({
      type: QueryActions.FILTER_DUELIST_SORT_COLUMN,
      payload,
    })
  }
  const dispatchFilterDuelistSortDirection = (payload: SortDirection) => {
    dispatch({
      type: QueryActions.FILTER_DUELIST_SORT_DIRECTION,
      payload,
    })
  }
  const dispatchFilterDuelistSortSwitch = () => {
    dispatch({
      type: QueryActions.FILTER_DUELIST_SORT_DIRECTION,
      payload: state.filterDuelistSortDirection == SortDirection.Ascending ? SortDirection.Descending : SortDirection.Ascending,
    })
  }
  return {
    ...state,
    dispatchFilterDuelistName,
    dispatchFilterDuelistTable,
    dispatchFilterDuelistActive,
    dispatchFilterDuelistSortColumn,
    dispatchFilterDuelistSortDirection,
    dispatchFilterDuelistSortSwitch,
  }
}
