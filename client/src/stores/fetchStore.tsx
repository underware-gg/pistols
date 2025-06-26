import { isPositiveBigint } from '@underware/pistols-sdk/utils';
import { BigNumberish } from 'starknet';
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'


//------------------------------------------
// keep track of data fetched per id/address
// (avoid fetching twice)
//

interface ChallengeFetchState {
  ids: bigint[],
  addresses: bigint[],
  resetStore: () => void;
  setFetchedIds: (ids: bigint[]) => void;
  setFetchedAddresses: (addresses: bigint[]) => void;
  getNewIds: (candidateIds: BigNumberish[]) => bigint[];
  getNewAddresses: (candidateAddresses: BigNumberish[]) => bigint[];
}
const createStore = () => {
  return create<ChallengeFetchState>()(immer((set, get) => ({
    ids: [],
    addresses: [],
    resetStore: () => {
      // console.warn("QUERY_STORE: resetStore()")
      set((state: ChallengeFetchState) => {
        state.ids = []
        state.addresses = []
      })
    },
    setFetchedIds: (ids: bigint[]) => {
      set((state: ChallengeFetchState) => {
        state.ids = [
          ...new Set([
            ...state.ids,
            ...ids
          ])
        ]
      })
    },
    setFetchedAddresses: (addresses: bigint[]) => {
      set((state: ChallengeFetchState) => {
        state.addresses = [
          ...new Set([
            ...state.addresses,
            ...addresses
          ])
        ]
      })
    },
    getNewIds: (candidateIds: BigNumberish[]) => {
      return candidateIds
        .filter(isPositiveBigint)
        .map(BigInt)
        .filter(id => !get().ids.includes(id))
    },
    getNewAddresses: (candidateAddresses: BigNumberish[]) => {
      return candidateAddresses
        .filter(isPositiveBigint)
        .map(BigInt)
        .filter(id => !get().addresses.includes(id))
    },
  })))
}


export const useChallengeFetchStore = createStore();
export const useChallengeRewardsFetchStore = createStore();
export const useDuelistFetchStore = createStore();
export const useDuelistStackFetchStore = createStore();
export const useScoreboardFetchStore = createStore();
