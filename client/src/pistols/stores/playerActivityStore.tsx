import { useMemo, useEffect } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { create } from 'zustand'
import { useSdkEntities, PistolsEntity, PistolsSubQuery } from '@/lib/dojo/hooks/useSdkEntities'
import { DuelistColumn, SortDirection } from '@/pistols/stores/queryParamsStore'
import { bigintToNumber } from '@/lib/utils/types'
import * as models from '@/games/pistols/generated/typescript/models.gen'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
interface ActivityState {
  timestamp: number
  activity: models.Activity
  identifier: BigNumberish
}
interface ActivityPerAddressState {
  [address: string]: ActivityState,
}
interface State {
  activityPerAddress: ActivityPerAddressState,
  setEvents: (events: PistolsEntity[]) => void;
  updateEvent: (event: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEvent = (e: PistolsEntity) => {
    let event = e.models.pistols.PlayerActivity
    return {
      timestamp: bigintToNumber(event.timestamp),
      activity: event.activity,
      identifier: BigInt(event.identifier),
    }
  }
  return create<State>()((set) => ({
    activityPerAddress: {},
    setEvents: (events: PistolsEntity[]) => {
      console.log("setEvents() =>", events)
      set((state: State) => ({
        activityPerAddress: events.reduce((acc, e) => {
          acc[e.entityId] = _parseEvent(e)
          return acc
        }, {} as ActivityPerAddressState)
      }))
    },
    updateEvent: (e: PistolsEntity) => {
      set((state: State) => {
        state.activityPerAddress[e.entityId] = _parseEvent(e)
        return state
      });
    },
  }))
}

const useStore = createStore();


//----------------------------------------
// Sync all activity events
// Add only once to a top level component
//
const query_sub: PistolsSubQuery  = {
  pistols: {
    PlayerActivity: []
    // { $: {} },
    // { $: { where: { address: { $is: addAddressPadding('0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7') } } } },
  },
}
export function PlayerActivityStoreSync() {
  const state = useStore((state) => state)

  useSdkEntities({
    events: true,
    query_get: query_sub,
    query_sub,
    setEntities: state.setEvents,
    updateEntity: state.updateEvent,
  })

  useEffect(() => console.log("PlayerActivityStoreSync() =>", state.activityPerAddress), [state.activityPerAddress])

  return (<></>)
}


//--------------------------------
// 'consumer' hooks
// will filter and sort all duelists for each view
//
