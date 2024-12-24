import React from 'react'
import { HistoricalEventsStoreSync } from '/src/stores/sync/HistoricalEventsStoreSync'
import { ChallengeStoreSync } from '/src/stores/sync/ChallengeStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { PlayerOnlineSync } from '/src/stores/sync/PlayerOnlineSync'
// QL to be replaced...
import { FameCoinStoreSyncQL } from '/src/stores/fameCoinStore'
import { PlayerDuelistTokensStoreSync, PlayerDuelistTokensStoreSyncQL } from '/src/stores/duelistTokenStore'

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
