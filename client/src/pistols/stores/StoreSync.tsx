import React from 'react'
import { DuelistStoreSync } from '@/pistols/stores/duelistStore'
import { DuelistQueryStoreSync } from '@/pistols/stores/duelistQueryStore'
import { ChallengeStoreSync } from '@/pistols/stores/challengeStore'
import { ChallengeQueryStoreSync } from '@/pistols/stores/challengeQueryStore'
import { TableStoreSync } from '@/pistols/stores/tableStore'

//
// Manages all store subscriptions
//

export default function StoreSync() {
  return (
    <>
      <DuelistStoreSync />
      <DuelistQueryStoreSync />
      <ChallengeStoreSync />
      <ChallengeQueryStoreSync />
      <TableStoreSync />
    </>
  )
}
