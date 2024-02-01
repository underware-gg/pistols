import React from 'react'
import { Snapshots } from '@/pistols/components/Snapshots';
import AppDojo from '@/pistols/components/AppDojo'

export default function SnapshotPage() {
  return (
    <AppDojo title={'Snapshot'}>
      <Snapshots />
    </AppDojo>
  );
}
