import { useEffect } from 'react'
import { useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useHistoricalEventsStore } from '/src/stores/eventsHistoricalStore'
import { PistolsHistoricalQueryBuilder } from '@underware/pistols-sdk/pistols/sdk'

const query: PistolsHistoricalQueryBuilder = new PistolsHistoricalQueryBuilder()
  .withEntityModels([
    'pistols-PlayerActivityEvent',
  ])
  .withDirection('Backward')
  .withLimit(100)

// Sync entities: Add only once to a top level component
export function EventsHistoricalStoreSync() {
  const historicalEventsState = useHistoricalEventsStore((state) => state)

  const mounted = useMounted()

  useSdkEventsSub({
    query,
    enabled: mounted,
    setEntities: historicalEventsState.setEvents,
    updateEntity: historicalEventsState.updateEvent,
  })

  useEffect(() => console.log('EventsHistoricalStoreSync() =>', historicalEventsState.playerActivity), [historicalEventsState.playerActivity])

  return (<></>)
}
