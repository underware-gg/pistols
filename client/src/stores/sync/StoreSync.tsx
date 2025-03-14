import React from 'react'
import { EventsHistoricalStoreSync } from '/src/stores/sync/EventsHistoricalStoreSync'
import { EventsModelStoreSync } from './EventsModelStoreSync'
import { ChallengeStoreSync } from '/src/stores/sync/ChallengeStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { PlayerOnlineSync } from '/src/stores/sync/PlayerOnlineSync'
import { TokenStoreSync } from '/src/stores/sync/TokenStoreSync'

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
      <TokenStoreSync />

      {/* Controller */}
      <PlayerNameSync />

      {/* Other */}
      <PlayerOnlineSync />

    </>
  )
}
