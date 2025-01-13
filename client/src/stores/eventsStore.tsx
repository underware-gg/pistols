import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { PistolsEntity } from '@underware_gg/pistols-sdk/pistols'
import { bigintToDecimal, isPositiveBigint } from '@underware_gg/pistols-sdk/utils'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
interface DuelsByDuelist {
  [duelist_id: string]: bigint
}
interface State {
  requiredAction: DuelsByDuelist,
  setEvents: (events: PistolsEntity[]) => void;
  updateEvent: (event: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEvents = (state: State, events: PistolsEntity[]) => {
    events.forEach(e => {
      const requiredAction = e.models.pistols.PlayerRequiredAction
      if (requiredAction) {
        state.requiredAction[bigintToDecimal(requiredAction.duelist_id)] = BigInt(requiredAction.duel_id)
      }
    })
  }
  return create<State>()(immer((set) => ({
    requiredAction: {},
    setEvents: (events: PistolsEntity[]) => {
      console.log("setEvents() =>", events)
      set((state: State) => {
        _parseEvents(state, events)
      })
    },
    updateEvent: (e: PistolsEntity) => {
      console.log("updateEvent() =>", e)
      set((state: State) => {
        _parseEvents(state, [e])
      });
    },
  })))
}

export const useEventsStore = createStore();


//--------------------------------
// 'consumer' hooks
//
export function useRequiredActions(duelistIds: bigint[]) {
  const requiredAction = useEventsStore((state) => state.requiredAction)
  const duelsPerDuelist = useMemo(() => (
    duelistIds.reduce((acc, duelistId) => {
      const _id = bigintToDecimal(duelistId)
      if (isPositiveBigint(requiredAction[_id])) {
        acc[_id] = requiredAction[_id]
      }
      return acc
    }, {} as DuelsByDuelist)
  ), [duelistIds, requiredAction])
  return {
    duelsPerDuelist,
  }
}
