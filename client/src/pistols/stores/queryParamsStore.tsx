import { create } from 'zustand'
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

const _switchDirection = (direction: SortDirection) => (direction == SortDirection.Ascending ? SortDirection.Descending : SortDirection.Ascending)

type State = {
  // duelist filters
  filterDuelistName: string
  filterDuelistActive: boolean
  filterDuelistSortColumn: DuelistColumn
  filterDuelistSortDirection: SortDirection
  //challenge filters
  filterChallengeSortColumn: ChallengeColumn
  filterChallengeSortDirection: SortDirection
  filterStatesLiveDuels: ChallengeState[]
  filterStatesPastDuels: ChallengeState[]
  filterStatesDuelistDuels: ChallengeState[]
  filterShowAllDuels: boolean
  // duelist setters
  setFilterDuelistName: (value: string) => void
  setFilterDuelistActive: (value: boolean) => void
  setFilterDuelistSortColumn: (value: DuelistColumn) => void
  setFilterDuelistSortDirection: (value: SortDirection) => void
  setFilterDuelistSortSwitch: () => void
  // challenge setters
  setFilterChallengeSortColumn: (value: ChallengeColumn) => void
  setFilterChallengeSortDirection: (value: SortDirection) => void
  setFilterChallengeSortSwitch: () => void
  setFilterStatesLiveDuels: (value: ChallengeState[]) => void
  setFilterStatesPastDuels: (value: ChallengeState[]) => void
  setFilterStatesDuelistDuels: (value: ChallengeState[]) => void
  setFilterShowAllDuels: (value: boolean) => void
}

export const useQueryParams = create<State>((set) => ({
  // duelist filters
  filterDuelistName: '',
  filterDuelistActive: false,
  filterDuelistSortColumn: DuelistColumn.Honour,
  filterDuelistSortDirection: SortDirection.Descending,
  // challenge filters
  filterChallengeSortColumn: ChallengeColumn.Time,
  filterChallengeSortDirection: SortDirection.Descending,
  filterStatesLiveDuels: AllChallengeStates,
  filterStatesPastDuels: AllChallengeStates,
  filterStatesDuelistDuels: AllChallengeStates,
  filterShowAllDuels: false,
  // duelist setters
  setFilterDuelistName: (value: string) => set({ filterDuelistName: value }),
  setFilterDuelistActive: (value: boolean) => set({ filterDuelistActive: value }),
  setFilterDuelistSortColumn: (value: DuelistColumn) => set({ filterDuelistSortColumn: value }),
  setFilterDuelistSortDirection: (value: SortDirection) => set({ filterDuelistSortDirection: value }),
  setFilterDuelistSortSwitch: () => set((state: State) => ({ filterDuelistSortDirection: _switchDirection(state.filterDuelistSortDirection) })),
  // challenge setters
  setFilterChallengeSortColumn: (value: ChallengeColumn) => set({ filterChallengeSortColumn: value }),
  setFilterChallengeSortDirection: (value: SortDirection) => set({ filterChallengeSortDirection: value }),
  setFilterChallengeSortSwitch: () => set((state: State) => ({ filterChallengeSortDirection: _switchDirection(state.filterChallengeSortDirection) })),
  setFilterStatesLiveDuels: (value: ChallengeState[]) => set({ filterStatesLiveDuels: value }),
  setFilterStatesPastDuels: (value: ChallengeState[]) => set({ filterStatesPastDuels: value }),
  setFilterStatesDuelistDuels: (value: ChallengeState[]) => set({ filterStatesDuelistDuels: value }),
  setFilterShowAllDuels: (value: boolean) => set({ filterShowAllDuels: value }),
}))
