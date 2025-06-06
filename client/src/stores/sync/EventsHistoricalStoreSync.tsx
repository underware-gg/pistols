import { useEffect } from 'react'
import { useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useHistoricalEventsStore } from '/src/stores/eventsHistoricalStore'
import { PistolsClauseBuilder, PistolsHistoricalQueryBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { useProgressStore } from '/src/stores/progressStore'
import { debug } from '@underware/pistols-sdk/pistols'

const query: PistolsHistoricalQueryBuilder = new PistolsHistoricalQueryBuilder()
  .withClause(
    new PistolsClauseBuilder().keys(
      ['pistols-PlayerActivityEvent'],
      [],
      "VariableLen"
    ).build()
  )
  .withEntityModels([
    'pistols-PlayerActivityEvent',
  ])
  .withDirection('Backward')
  .withLimit(100)

// Sync entities: Add only once to a top level component
export function EventsHistoricalStoreSync() {
  const historicalEventsState = useHistoricalEventsStore((state) => state)
  const updateProgress = useProgressStore((state) => state.updateProgress)
  const mounted = useMounted()

  useSdkEventsSub({
    query,
    enabled: mounted,
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('historical_events_sub', currentPage, finished)
    },
    setEntities: historicalEventsState.setEvents,
    updateEntity: historicalEventsState.updateEvent,
  })

  // useEffect(() => debug.log('EventsHistoricalStoreSync() =>', historicalEventsState.playerActivity), [historicalEventsState.playerActivity])

  return (<></>)
}
