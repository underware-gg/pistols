import React from 'react'
import { HistoricalEventsStoreSync } from '@/pistols/stores/sync/HistoricalEventsStoreSync'
import { ChallengeStoreSync } from '@/pistols/stores/sync/ChallengeStoreSync'
import { EntityStoreSync } from '@/pistols/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '@/pistols/stores/sync/PlayerNameSync'
import { PlayerOnlineSync } from '@/pistols/stores/sync/PlayerOnlineSync'
// QL to be replaced...
import { FameCoinStoreSyncQL } from '@/pistols/stores/fameCoinStore'
import { PlayerDuelistTokensStoreSync, PlayerDuelistTokensStoreSyncQL } from '@/pistols/stores/duelistTokenStore'

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
