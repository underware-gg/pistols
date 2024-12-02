import React from 'react'
import { ConfigStoreSync } from '@/pistols/stores/configStore'
import { TokenConfigStoreSync } from '@/pistols/stores/tokenConfigStore'
import { TableStoreSync } from '@/pistols/stores/tableStore'
import { DuelistStoreSync } from '@/pistols/stores/duelistStore'
import { DuelistQueryStoreSync } from '@/pistols/stores/duelistQueryStore'
import { ChallengeStoreSync } from '@/pistols/stores/challengeStore'
import { ChallengeQueryStoreSync } from '@/pistols/stores/challengeQueryStore'
import { DuelistTokenStoreSync } from '@/pistols/stores/duelistTokenStore'

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
      <DuelistQueryStoreSync />
      <ChallengeStoreSync />
      <ChallengeQueryStoreSync />
      <DuelistTokenStoreSync />
    </>
  )
}
