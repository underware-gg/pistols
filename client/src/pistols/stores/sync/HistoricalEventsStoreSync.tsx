import { useEffect } from 'react'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { useHistoricalEventsStore } from '@/pistols/stores/eventsStore'
import { useMounted } from '@underware_gg/pistols-sdk/hooks'
import { useSdkEntities } from '@/lib/dojo/hooks/useSdkEntities'
import { PistolsGetQuery, PistolsSubQuery } from '@/lib/dojo/hooks/useSdkTypes'
import * as torii from '@dojoengine/torii-client'

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
  const historicalEventsState = useHistoricalEventsStore((state) => state)
  
  const mounted = useMounted()

  useSdkEntities({
    query_get,
    query_sub,
    enabled: mounted,
    setEntities: historicalEventsState.setEvents,
    updateEntity: historicalEventsState.updateEvent,
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

  useEffect(() => console.log("HistoricalEventsStoreSync() =>", historicalEventsState.playerActivity), [historicalEventsState.playerActivity])

  return (<></>)
}
