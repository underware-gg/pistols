import React from 'react'
import { ConfigStoreSync } from '@/pistols/stores/configStore'
import { TokenConfigStoreSync } from '@/pistols/stores/tokenConfigStore'
import { TableStoreSync } from '@/pistols/stores/tableStore'
import { DuelistStoreSync } from '@/pistols/stores/duelistStore'
import { ChallengeStoreSync } from '@/pistols/stores/challengeStore'
import { PlayerDuelistTokensStoreSync, PlayerDuelistTokensStoreSyncQL } from '@/pistols/stores/duelistTokenStore'
import { PlayerActivityStoreSync } from '@/pistols/stores/playerActivityStore'

//
// Manages all store subscriptions
//

export default function StoreSync() {
  return (
    <>
      <ConfigStoreSync />
      <TokenConfigStoreSync />
      <TableStoreSync />
      <DuelistStoreSync />
      <ChallengeStoreSync />
      <PlayerDuelistTokensStoreSyncQL />
      <PlayerDuelistTokensStoreSync />
      <PlayerActivityStoreSync />
    </>
  )
}
