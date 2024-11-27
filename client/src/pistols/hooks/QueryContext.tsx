import React, { ReactNode, createContext, useReducer, useContext } from 'react'
import { ChallengeState } from '@/games/pistols/generated/constants'
import { AllChallengeStates } from '@/pistols/utils/pistols'

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
}

enum QueryActions {
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
}


//--------------------------------
// Types
//
type QueryContextStateType = typeof initialState

type ActionType =
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

  const [state, dispatch] = useReducer((state: QueryContextStateType, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
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
      default:
        console.warn(`QueryProvider: Unknown action [${action.type}]`)
        return state
    }
    return newState
  }, initialState)


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
