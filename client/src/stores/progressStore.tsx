import { BigNumberish } from 'starknet'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { constants as C } from '@underware/pistols-sdk/pistols/gen'
import { arrayClean, bigintToHex, bigintToNumber } from '@underware/pistols-sdk/utils'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { debug } from '@underware/pistols-sdk/pistols'
import { useMemo } from 'react'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
interface LoaderState {
  [key: string]: number
}
interface State {
  loaders: LoaderState,
  updateProgress: (key: string, currentPage: number, finished?: boolean) => void;
  getProgress: () => number;
  finished: () => boolean;
}

const createStore = () => {
  const _calcProgress = (loaders: LoaderState): number => {
    const _loaderCount = Object.keys(loaders).length;
    return _loaderCount == 0 ? 0 : Object.values(loaders).reduce((acc, curr) => (acc + curr), 0) / _loaderCount;
  }
  return create<State>()(immer((set, get) => ({
    loaders: {},
    updateProgress: (key: string, currentPage: number, finished?: boolean) => {
      set((state: State) => {
        const _progress = finished === true ? 1 : (currentPage / (currentPage + 1));
        state.loaders[key] = _progress;
        debug.log(`PROGRESS(${key})[${currentPage}/]: ${_progress} / total(${Object.keys(state.loaders).length}): ${_calcProgress(state.loaders)}`)
      })
    },
    getProgress: (): number => {
      return _calcProgress(get().loaders);
    },
    finished: (): boolean => {
      return _calcProgress(get().loaders) >= 1;
    },
  })))
}

export const useProgressStore = createStore();


//--------------------------------
// 'consumer' hooks
//
export function useStoreLoadingProgress() {
  const state = useProgressStore((state) => state)
  const progress = useMemo(() => state.getProgress(), [state.loaders])
  const finished = useMemo(() => state.finished(), [state.loaders])
  return {
    progress,
    finished,
  }
}
