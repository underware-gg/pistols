import { useEffect } from 'react'
import { filterEntitiesByModel, getEntityModel, useDojoSetup, useSdkEntities } from '@underware_gg/pistols-sdk/dojo'
import { useEventsStore } from '/src/stores/eventsStore'
import { useMounted } from '@underware_gg/pistols-sdk/utils'
import { PistolsEntity, PistolsGetQuery, PistolsSubQuery } from '@underware_gg/pistols-sdk/pistols'
import * as torii from '@dojoengine/torii-client'

const query_get: PistolsGetQuery = {
  pistols: {
    PlayerRequiredAction: { $: { where: { duelist_id: { $neq: 0 } } } },
  },
}
const query_sub: PistolsSubQuery = {
  pistols: {
    PlayerRequiredAction: [],
  },
}

// Sync entities: Add only once to a top level component
export function EventsModelStoreSync() {
  const eventsState = useEventsStore((state) => state)

  const mounted = useMounted()

  useSdkEntities({
    query_get,
    query_sub,
    enabled: mounted,
    setEntities: (entities: PistolsEntity[]) => {
      // console.log("EventsModelStoreSync() SET =======> [PlayerRequiredAction]:", filterEntitiesByModel(entities, 'PlayerRequiredAction'))
      eventsState.setEvents(filterEntitiesByModel(entities, 'PlayerRequiredAction'))
    },
    updateEntity: (entity: PistolsEntity) => {
      // console.log("EventsModelStoreSync() UPDATE =======> [entity]:", entity)
      if (getEntityModel(entity, 'PlayerRequiredAction')) {
        eventsState.updateEvent(entity)
      }      
    },
    historical: false, // historical events
    limit: 100,
  })

  // // TESTING raw events from client
  // const { sdk } = useDojoSetup()
  // const clause_non_historical: torii.Clause = {
  //   Keys: {
  //     // keys: ['0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7'],
  //     keys: [undefined],
  //     models: ["pistols-PlayerRequiredAction"],
  //     pattern_matching: "FixedLen",
  //   },
  // }
  // useEffect(() => {
  //   // based on:
  //   // https://github.com/cartridge-gg/dopewars/blob/4e52b86c4788beb06d259533aebe5fe5c3b871e3/web/src/dojo/hooks/useGamesByPlayer.tsx#L74
  //   const _fetch = async () => {
  //     const events = await sdk.client.getEventMessages(
  //       {
  //         clause: clause_non_historical,
  //         limit: 100,
  //         offset: 0,
  //         dont_include_hashed_keys: true,
  //         order_by: [],
  //         entity_models: ["pistols-PlayerRequiredAction"],
  //         entity_updated_after: 0,
  //       },
  //       false, // historical
  //     );
  //     console.log("sdk.client.GET_EVENTS(false) =>", events)
  //   }
  //   if (sdk) _fetch()
  // }, [sdk])

  // useEffect(() => console.log("EventsModelStoreSync() =>", historicalEventsState.playerActivity), [historicalEventsState.playerActivity])

  return (<></>)
}
