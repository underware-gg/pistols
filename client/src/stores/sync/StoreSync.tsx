import React, { useEffect } from 'react'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { EventsHistoricalStoreSync } from '/src/stores/sync/EventsHistoricalStoreSync'
import { EventsModelStoreSync } from './EventsModelStoreSync'
import { SeasonScoreboardStoreSync } from '/src/stores/sync/SeasonEntityStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { PlayerOnlineSync } from '/src/stores/sync/PlayerOnlineSync'
import { TokenStoreSync } from '/src/stores/sync/TokenStoreSync'
import { PlayerSync } from '/src/stores/sync/PlayerSync'
import { StoreProgressBar } from '/src/stores/sync/StoreProgressBar'

//
// Manages all store subscriptions
//

export default function StoreSync() {
  const mounted = useMounted()
  useEffect(() => {
    if (mounted) console.log('<StoreSync> mounted...')
  }, [mounted])
  if (!mounted) return <></>
  return (
    <>
      {/* Torii */}
      <TokenStoreSync />
      <PlayerSync />
      <EntityStoreSync />
      <SeasonScoreboardStoreSync />
      <EventsModelStoreSync />
      <EventsHistoricalStoreSync />

      {/* Controller */}
      <PlayerNameSync />

      {/* Other */}
      <PlayerOnlineSync />

      <StoreProgressBar />
    </>
  )
}
