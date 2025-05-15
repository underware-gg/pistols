import React, { useEffect } from 'react'
import { EventsHistoricalStoreSync } from '/src/stores/sync/EventsHistoricalStoreSync'
import { EventsModelStoreSync } from './EventsModelStoreSync'
import { SeasonChallengeStoreSync, SeasonScoreboardStoreSync } from '/src/stores/sync/SeasonEntityStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { PlayerOnlineSync } from '/src/stores/sync/PlayerOnlineSync'
import { TokenStoreSync } from '/src/stores/sync/TokenStoreSync'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'

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
      <EntityStoreSync />
      <SeasonChallengeStoreSync />
      <SeasonScoreboardStoreSync />
      <TokenStoreSync />
      <EventsModelStoreSync />
      <EventsHistoricalStoreSync />

      {/* Controller */}
      <PlayerNameSync />

      {/* Other */}
      <PlayerOnlineSync />

    </>
  )
}
