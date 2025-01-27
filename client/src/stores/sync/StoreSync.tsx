import React from 'react'
import { EventsHistoricalStoreSync } from '/src/stores/sync/EventsHistoricalStoreSync'
import { EventsModelStoreSync } from './EventsModelStoreSync'
import { ChallengeStoreSync } from '/src/stores/sync/ChallengeStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { PlayerOnlineSync } from '/src/stores/sync/PlayerOnlineSync'
// QL to be replaced...
import { FameCoinStoreSyncQL } from '/src/stores/fameCoinStore'
import { TokensOfPlayerStoreSync, TokensOfPlayerStoreSyncQL } from '/src/stores/sync/TokenStoreSync'

//
// Manages all store subscriptions
//

export default function StoreSync() {
  return (
    <>
      {/* Torii */}
      <EventsHistoricalStoreSync />
      <EventsModelStoreSync />
      <ChallengeStoreSync />
      <EntityStoreSync />
      {/* QL to be replaced... */}
      <FameCoinStoreSyncQL />
      <TokensOfPlayerStoreSyncQL />
      <TokensOfPlayerStoreSync />

      {/* Controller */}
      <PlayerNameSync />

      {/* Other */}
      <PlayerOnlineSync />

    </>
  )
}
