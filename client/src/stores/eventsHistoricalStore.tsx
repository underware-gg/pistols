import { BigNumberish } from 'starknet'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { constants as C } from '@underware/pistols-sdk/pistols/gen'
import { arrayClean, bigintToHex, bigintToNumber } from '@underware/pistols-sdk/utils'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { debug } from '@underware/pistols-sdk/pistols'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
export interface ActivityState {
  player_address: BigNumberish
  timestamp: number
  activity: C.Activity
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
    const event = e.models.pistols.PlayerActivityEvent
    return event ? {
      player_address: bigintToHex(event.player_address),
      timestamp: bigintToNumber(event.timestamp),
      activity: parseEnumVariant<C.Activity>(event.activity),
      identifier: BigInt(event.identifier),
      is_public: event.is_public,
      index: index ?? 0,
    } : undefined
  }
  const _pushEvent = (state: State, activity: ActivityState) => {
    if (activity) {
      state.playerActivity = [
        ...state.playerActivity
          // remove older events of new activity
          .filter((a) => !(
            (
              [C.Activity.MovesRevealed, C.Activity.MovesCommitted, C.Activity.ChallengeResolved, C.Activity.ChallengeDraw].includes(activity.activity)
              && [C.Activity.MovesRevealed, C.Activity.MovesCommitted].includes(a.activity)
            )
            && a.identifier === activity.identifier
            // && a.player_address === activity.player_address
          )),
        // add new event
        activity,
      ]
    }
  }
  return create<State>()(immer((set) => ({
    playerActivity: [],
    setEvents: (events: PistolsEntity[]) => {
      // debug.log("historicalEventsStore() => SET:", events)
      set((state: State) => {
        const activities = arrayClean(events.map((e, i) => _parseEvent(e, i)))
          // .sort((a, b) => (a.timestamp - b.timestamp))
          // .sort((a, b) => ((a.timestamp != b.timestamp) ? (a.timestamp - b.timestamp) : (a.index - b.index)))
          .sort((a, b) => (b.index - a.index))
        state.playerActivity = [];
        activities.forEach(a => _pushEvent(state, a))
      })
    },
    updateEvent: (e: PistolsEntity) => {
      // debug.log("historicalEventsStore() => UPDATE:", e)
      set((state: State) => {
        _pushEvent(state, _parseEvent(e))
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
