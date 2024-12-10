import { useEffect } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { create } from 'zustand'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { PistolsEntity, PistolsGetQuery, PistolsSubQuery, useSdkEntities } from '@/lib/dojo/hooks/useSdkEntities'
import { arrayClean, bigintToHex, bigintToNumber } from '@/lib/utils/types'
import { Activity } from '@/games/pistols/generated/constants'
import * as torii from '@dojoengine/torii-client'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
export interface ActivityState {
  address: BigNumberish
  timestamp: number
  activity: Activity
  identifier: bigint
}
interface State {
  playerActivity: ActivityState[],
  setEvents: (events: PistolsEntity[]) => void;
  updateEvent: (event: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEvent = (e: PistolsEntity) => {
    let event = e.models.pistols.PlayerActivity
    return event ? {
      address: bigintToHex(event.address),
      timestamp: bigintToNumber(event.timestamp),
      activity: event.activity as unknown as Activity,
      identifier: BigInt(event.identifier),
    } : undefined
  }
  return create<State>()((set) => ({
    playerActivity: [],
    setEvents: (events: PistolsEntity[]) => {
      console.log("setEvents() =>", events)
      set((state: State) => ({
        playerActivity: arrayClean(events.map(e => _parseEvent(e))).sort((a, b) => (a.timestamp - b.timestamp))
      }))
    },
    updateEvent: (e: PistolsEntity) => {
      console.log("updateEvent() =>", e)
      set((state: State) => {
        const activity = _parseEvent(e)
        if (activity) state.playerActivity.push(activity)
        return state
      });
    },
  }))
}

const useStore = createStore();

const query_get: PistolsGetQuery = {
  pistols: {
    PlayerActivity: []
  },
}
const query_sub: PistolsSubQuery = {
  pistols: {
    PlayerActivity: []
  },
}

// Sync entities: Add only once to a top level component
export function HistoricalEventsStoreSync() {
  const state = useStore((state) => state)

  useSdkEntities({
    query_get,
    query_sub,
    setEntities: state.setEvents,
    updateEntity: state.updateEvent,
    historical: true, // events
    limit: 100,
  })

  // // TESTING raw events from client
  // const { sdk } = useDojoSetup()
  // const clause: torii.Clause = {
  //   Keys: {
  //     // keys: ['0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7'],
  //     keys: [undefined],
  //     models: ["pistols-PlayerActivity"],
  //     pattern_matching: "FixedLen",
  //   },
  // }
  // useEffect(() => {
  //   // based on:
  //   // https://github.com/cartridge-gg/dopewars/blob/4e52b86c4788beb06d259533aebe5fe5c3b871e3/web/src/dojo/hooks/useGamesByPlayer.tsx#L74
  //   const _fetch = async () => {
  //     const events = await sdk.client.getEventMessages(
  //       {
  //         clause,
  //         limit: 100,
  //         offset: 0,
  //         dont_include_hashed_keys: true,
  //       },
  //       true, // historical
  //     );
  //     console.log("sdk.client.GET_EVENTS() =>", events)
  //   }
  //   if (sdk) _fetch()
  // }, [sdk])
  // useEffect(() => {
  //   // based on:
  //   // https://github.com/cartridge-gg/dopewars/blob/4e52b86c4788beb06d259533aebe5fe5c3b871e3/web/src/dojo/stores/game.tsx#L116
  //   const _subscribe = async () => {
  //     const subscription = await sdk.client.onEventMessageUpdated(
  //       [clause],
  //       true, // historical
  //       (entityId: string, entityData: any) => {
  //         console.log("sdk.client.SUB_EVENTS() =>", entityId, entityData)
  //       }
  //     );
  //     console.log("sdk.client.SUBSCRIPTION =>", subscription)
  //   }
  //   if (sdk) _subscribe()
  // }, [sdk])

  useEffect(() => console.log("HistoricalEventsStoreSync() =>", state.playerActivity), [state.playerActivity])

  return (<></>)
}



//--------------------------------
// 'consumer' hooks
//

export function useAllPlayersActivityFeed() {
  const allPlayersActivity = useStore((state) => state.playerActivity)
  return {
    allPlayersActivity,
  }
}
