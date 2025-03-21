import { BigNumberish } from 'starknet'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { PistolsEntity } from '@underware/pistols-sdk/pistols'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { arrayClean, bigintToHex, bigintToNumber } from '@underware/pistols-sdk/utils'
import { parseEnumVariant } from '@underware/pistols-sdk/utils/starknet'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
export interface ActivityState {
  player_address: BigNumberish
  timestamp: number
  activity: constants.Activity
  identifier: bigint
  is_public: boolean
  index: number
}
interface State {
  playerActivity: ActivityState[],
  setEvents: (events: PistolsEntity[]) => void;
  updateEvent: (event: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEvent = (e: PistolsEntity, index?: number): ActivityState => {
    const event = e.models.pistols.PlayerActivity
    return event ? {
      player_address: bigintToHex(event.player_address),
      timestamp: bigintToNumber(event.timestamp),
      activity: parseEnumVariant<constants.Activity>(event.activity),
      identifier: BigInt(event.identifier),
      is_public: event.is_public,
      index: index ?? 0,
    } : undefined
  }
  return create<State>()(immer((set) => ({
    playerActivity: [],
    setEvents: (events: PistolsEntity[]) => {
      console.log("setHistoricalEvents() =>", events)
      set((state: State) => {
        state.playerActivity = arrayClean(events.map((e, i) => _parseEvent(e, i)))
          // .sort((a, b) => (a.timestamp - b.timestamp))
          .sort((a, b) => ((a.timestamp != b.timestamp) ? (a.timestamp - b.timestamp) : (b.index - a.index)))
      })
    },
    updateEvent: (e: PistolsEntity) => {
      // console.log("updateHistoricalEvent() =>", e)
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
