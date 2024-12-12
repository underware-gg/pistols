import React from 'react'
import { HistoricalEventsStoreSync } from '@/pistols/stores/sync/HistoricalEventsStoreSync'
import { SeasonStoreSync } from '@/pistols/stores/sync/SeasonStoreSync'
import { EntityStoreSync } from '@/pistols/stores/sync/EntityStoreSync'
// QL to be replaced...
import { FameCoinStoreSyncQL } from '@/pistols/stores/fameCoinStore'
import { PlayerDuelistTokensStoreSync, PlayerDuelistTokensStoreSyncQL } from '@/pistols/stores/duelistTokenStore'

//
// Manages all store subscriptions
//

export default function StoreSync() {
  return (
    <>
      <HistoricalEventsStoreSync />
      <SeasonStoreSync />
      <EntityStoreSync />
      
      {/* QL to be replaced... */}
      <FameCoinStoreSyncQL />
      <PlayerDuelistTokensStoreSyncQL />
      <PlayerDuelistTokensStoreSync />
    </>
  )
}
