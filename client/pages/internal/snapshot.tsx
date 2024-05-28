import React from 'react'
import { Snapshots } from '@/pistols/components/Snapshots'
import AppPistols from '@/pistols/components/AppPistols'

export default function SnapshotPage() {
  return (
    <AppPistols headerData={{ title: 'Snapshot' }}>
      <Snapshots />
    </AppPistols>
  )
}
