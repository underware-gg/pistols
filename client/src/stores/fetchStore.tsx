import { isPositiveBigint } from '@underware/pistols-sdk/utils';
import { BigNumberish } from 'starknet';
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'


//--------------------------------
// keep track of data fetched per duelist/players
// (avoid fetching twice)
//

interface ChallengeFetchState {
  duelistIds: bigint[],
  playerAddresses: bigint[],
  resetStore: () => void;
  setFetchedDuelistIds: (duelistIds: bigint[]) => void;
  setFetchedPlayerAddresses: (playerAddresses: bigint[]) => void;
  getNewDuelistIds: (candidateDuelistIds: BigNumberish[]) => bigint[];
  getNewPlayerAddresses: (candidatePlayerAddresses: BigNumberish[]) => bigint[];
}
const createStore = () => {
  return create<ChallengeFetchState>()(immer((set, get) => ({
    duelistIds: [],
    playerAddresses: [],
    resetStore: () => {
      // console.warn("QUERY_STORE: resetStore()")
      set((state: ChallengeFetchState) => {
        state.duelistIds = []
        state.playerAddresses = []
      })
    },
    setFetchedDuelistIds: (duelistIds: bigint[]) => {
      set((state: ChallengeFetchState) => {
        state.duelistIds = [
          ...new Set([
            ...state.duelistIds,
            ...duelistIds
          ])
        ]
      })
    },
    setFetchedPlayerAddresses: (playerAddresses: bigint[]) => {
      set((state: ChallengeFetchState) => {
        state.playerAddresses = [
          ...new Set([
            ...state.playerAddresses,
            ...playerAddresses
          ])
        ]
      })
    },
    getNewDuelistIds: (candidateDuelistIds: BigNumberish[]) => {
      return candidateDuelistIds
        .filter(isPositiveBigint)
        .map(BigInt)
        .filter(id => !get().duelistIds.includes(id))
    },
    getNewPlayerAddresses: (candidatePlayerAddresses: BigNumberish[]) => {
      return candidatePlayerAddresses
        .filter(isPositiveBigint)
        .map(BigInt)
        .filter(id => !get().playerAddresses.includes(id))
    },
  })))
}


export const useChallengeFetchStore = createStore();
export const useDuelistFetchStore = createStore();
