import { useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useHistoricalEventsStore } from '/src/stores/eventsHistoricalStore'
import { PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'

const query: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withClause(
    new PistolsClauseBuilder().keys(
      ["pistols-PlayerActivityEvent"],
      [],
    ).build()
  )
  .withEntityModels([
    "pistols-PlayerActivityEvent",
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

  // useEffect(() => console.log("EventsHistoricalStoreSync() =>", historicalEventsState.playerActivity), [historicalEventsState.playerActivity])

  return (<></>)
}
