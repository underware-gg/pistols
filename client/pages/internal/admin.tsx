import React from 'react'
import AppPistols from '@/components/AppPistols'
import { AdminPanel } from '@/components/admin/AdminPanel'

export default function SnapshotPage() {
  return (
    <AppPistols headerData={{ title: 'Admin Panel' }}>
      <AdminPanel />
    </AppPistols>
  )
}
