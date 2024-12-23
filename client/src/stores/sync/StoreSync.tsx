import React from 'react'
import { HistoricalEventsStoreSync } from '@/stores/sync/HistoricalEventsStoreSync'
import { ChallengeStoreSync } from '@/stores/sync/ChallengeStoreSync'
import { EntityStoreSync } from '@/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '@/stores/sync/PlayerNameSync'
import { PlayerOnlineSync } from '@/stores/sync/PlayerOnlineSync'
// QL to be replaced...
import { FameCoinStoreSyncQL } from '@/stores/fameCoinStore'
import { PlayerDuelistTokensStoreSync, PlayerDuelistTokensStoreSyncQL } from '@/stores/duelistTokenStore'

//
// Manages all store subscriptions
//

export default function StoreSync() {
  return (
    <>
      {/* Torii */}
      <HistoricalEventsStoreSync />
      <ChallengeStoreSync />
      <EntityStoreSync />
      {/* QL to be replaced... */}
      <FameCoinStoreSyncQL />
      <PlayerDuelistTokensStoreSyncQL />
      <PlayerDuelistTokensStoreSync />

      {/* Controller */}
      <PlayerNameSync />

      {/* Other */}
      <PlayerOnlineSync />

    </>
  )
}
