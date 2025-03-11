import { create } from 'zustand'
import { AllChallengeStates, LiveChallengeStates, PastChallengeStates } from '/src/utils/pistols'
import { constants } from '@underware/pistols-sdk/pistols/gen'

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
  filterDuelistBookmarked: boolean
  filterDuelistSortColumn: DuelistColumn
  filterDuelistSortDirection: SortDirection
  //challenge filters
  filterChallengeSortColumn: ChallengeColumn
  filterChallengeSortDirection: SortDirection
  filterStatesLiveDuels: constants.ChallengeState[]
  filterStatesPastDuels: constants.ChallengeState[]
  filterStatesDuelistDuels: constants.ChallengeState[]
  filterShowAllDuels: boolean
  filterShowBookmarkedDuels: boolean
  // duelist setters
  setFilterDuelistName: (value: string) => void
  setFilterDuelistActive: (value: boolean) => void
  setFilterDuelistBookmarked: (value: boolean) => void
  setFilterDuelistSortColumn: (value: DuelistColumn) => void
  setFilterDuelistSortDirection: (value: SortDirection) => void
  setFilterDuelistSortSwitch: () => void
  // challenge setters
  setFilterChallengeSortColumn: (value: ChallengeColumn) => void
  setFilterChallengeSortDirection: (value: SortDirection) => void
  setFilterChallengeSortSwitch: () => void
  setFilterStatesLiveDuels: (value: constants.ChallengeState[]) => void
  setFilterStatesPastDuels: (value: constants.ChallengeState[]) => void
  setFilterStatesDuelistDuels: (value: constants.ChallengeState[]) => void
  setFilterShowAllDuels: (value: boolean) => void
  setFilterShowBookmarkedDuels: (value: boolean) => void
}

export const useQueryParams = create<State>((set) => ({
  // duelist filters
  filterDuelistName: '',
  filterDuelistActive: false,
  filterDuelistBookmarked: false,
  filterDuelistSortColumn: DuelistColumn.Honour,
  filterDuelistSortDirection: SortDirection.Descending,
  // challenge filters
  filterChallengeSortColumn: ChallengeColumn.Time,
  filterChallengeSortDirection: SortDirection.Descending,
  filterStatesLiveDuels: LiveChallengeStates,
  filterStatesPastDuels: PastChallengeStates,
  filterStatesDuelistDuels: AllChallengeStates,
  filterShowAllDuels: false,
  filterShowBookmarkedDuels: false,
  // duelist setters
  setFilterDuelistName: (value: string) => set({ filterDuelistName: value.toLowerCase() }),
  setFilterDuelistActive: (value: boolean) => set({ filterDuelistActive: value }),
  setFilterDuelistBookmarked: (value: boolean) => set({ filterDuelistBookmarked: value }),
  setFilterDuelistSortColumn: (value: DuelistColumn) => set({ filterDuelistSortColumn: value }),
  setFilterDuelistSortDirection: (value: SortDirection) => set({ filterDuelistSortDirection: value }),
  setFilterDuelistSortSwitch: () => set((state: State) => ({ filterDuelistSortDirection: _switchDirection(state.filterDuelistSortDirection) })),
  // challenge setters
  setFilterChallengeSortColumn: (value: ChallengeColumn) => set({ filterChallengeSortColumn: value }),
  setFilterChallengeSortDirection: (value: SortDirection) => set({ filterChallengeSortDirection: value }),
  setFilterChallengeSortSwitch: () => set((state: State) => ({ filterChallengeSortDirection: _switchDirection(state.filterChallengeSortDirection) })),
  setFilterStatesLiveDuels: (value: constants.ChallengeState[]) => set({ filterStatesLiveDuels: value.filter(state => LiveChallengeStates.includes(state)) }),
  setFilterStatesPastDuels: (value: constants.ChallengeState[]) => set({ filterStatesPastDuels: value.filter(state => PastChallengeStates.includes(state)) }),
  setFilterStatesDuelistDuels: (value: constants.ChallengeState[]) => set({ filterStatesDuelistDuels: value.filter(state => AllChallengeStates.includes(state)) }),
  setFilterShowAllDuels: (value: boolean) => set({ filterShowAllDuels: value }),
  setFilterShowBookmarkedDuels: (value: boolean) => set({ filterShowBookmarkedDuels: value }),
}))
