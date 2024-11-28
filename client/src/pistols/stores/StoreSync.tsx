import React from 'react'
import { DuelistStoreSync } from '@/pistols/stores/duelistStore'
import { DuelistQueryStoreSync } from '@/pistols/stores/duelistQueryStore'
import { ChallengeStoreSync } from '@/pistols/stores/challengeStore'
import { ChallengeQueryStoreSync } from '@/pistols/stores/challengeQueryStore'

//
// Manages all store sunscriptions
//

export default function StoreSync() {
  return (
    <>
      <DuelistStoreSync />
      <DuelistQueryStoreSync />
      <ChallengeStoreSync />
      <ChallengeQueryStoreSync />
    </>
  )
}
