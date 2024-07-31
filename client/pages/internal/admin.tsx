import React from 'react'
import AppPistols from '@/pistols/components/AppPistols'
import { AdminPanel } from '@/pistols/components/admin/AdminPanel'

export default function SnapshotPage() {
  return (
    <AppPistols headerData={{ title: 'Admin Panel' }}>
      <AdminPanel />
    </AppPistols>
  )
}
