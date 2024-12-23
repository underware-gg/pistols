import React from 'react'
import { Snapshots } from '@/components/Snapshots'
import AppPistols from '@/components/AppPistols'

export default function SnapshotPage() {
  return (
    <AppPistols headerData={{ title: 'Snapshot' }}>
      <Snapshots />
    </AppPistols>
  )
}
