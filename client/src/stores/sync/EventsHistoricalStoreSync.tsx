import { useEffect } from 'react'
import { useDojoSetup, useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useHistoricalEventsStore } from '/src/stores/historicalEventsStore'
import { PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import * as torii from '@dojoengine/torii-client'

// const query: PistolsQueryBuilder = {
//   pistols: {
//     PlayerActivity: [],
//   },
//   limit: 20,
// }
const query: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withClause(
    new PistolsClauseBuilder().keys(
      ["pistols-PlayerActivity"],
      [],
    ).build()
  )
  .withEntityModels([
    "pistols-PlayerActivity",
  ])
  .withLimit(100)
  // .includeHashedKeys() // historical events are sequential

// Sync entities: Add only once to a top level component
export function EventsHistoricalStoreSync() {
  const historicalEventsState = useHistoricalEventsStore((state) => state)
  
  const mounted = useMounted()

  useSdkEventsSub({
    query,
    historical: true,
    enabled: mounted,
    setEntities: historicalEventsState.setEvents,
    updateEntity: historicalEventsState.updateEvent,
  })

  // // TESTING raw events from client
  // const { sdk } = useDojoSetup()
  // const clause: torii.Clause = {
  //   Keys: {
  //     // keys: ['0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7'],
  //     keys: [undefined, undefined],
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
  //         order_by: [],
  //         entity_models: ["pistols-PlayerActivity"],
  //         entity_updated_after: 0,
  //       },
  //       true, // historical
  //     );
  //     console.log("sdk.client.GET_EVENTS(true) =>", events)
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
  //         console.log("sdk.client.SUB_EVENTS(true) =>", entityId, entityData)
  //       }
  //     );
  //   }
  //   if (sdk) _subscribe()
  // }, [sdk])

  // useEffect(() => console.log("EventsHistoricalStoreSync() =>", historicalEventsState.playerActivity), [historicalEventsState.playerActivity])

  return (<></>)
}
