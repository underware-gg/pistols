import { BigNumberish } from 'starknet'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { constants, PistolsEntity } from '@underware_gg/pistols-sdk/pistols'
import { arrayClean, bigintToHex, bigintToNumber } from '@underware_gg/pistols-sdk/utils'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
export interface ActivityState {
  address: BigNumberish
  timestamp: number
  activity: constants.Activity
  identifier: bigint
  is_public: boolean
}
interface State {
  playerActivity: ActivityState[],
  setEvents: (events: PistolsEntity[]) => void;
  updateEvent: (event: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEvent = (e: PistolsEntity): ActivityState => {
    let event = e.models.pistols.PlayerActivity
    return event ? {
      address: bigintToHex(event.address),
      timestamp: bigintToNumber(event.timestamp),
      activity: event.activity as unknown as constants.Activity,
      identifier: BigInt(event.identifier),
      is_public: event.is_public,
    } : undefined
  }
  return create<State>()(immer((set) => ({
    playerActivity: [],
    setEvents: (events: PistolsEntity[]) => {
      console.log("setHistoricalEvents() =>", events)
      set((state: State) => {
        state.playerActivity = arrayClean(events.map(e => _parseEvent(e))).sort((a, b) => (a.timestamp - b.timestamp))
      })
    },
    updateEvent: (e: PistolsEntity) => {
      console.log("updateHistoricalEvent() =>", e)
      set((state: State) => {
        const activity = _parseEvent(e)
        if (activity) state.playerActivity.push(activity)
      });
    },
  })))
}

export const useHistoricalEventsStore = createStore();


//--------------------------------
// 'consumer' hooks
//
export function useAllPlayersActivityFeed() {
  const allPlayersActivity = useHistoricalEventsStore((state) => state.playerActivity)
  return {
    allPlayersActivity,
  }
}
