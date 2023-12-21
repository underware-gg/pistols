import React from 'react'
import { AccountShort } from '@/pistols/components/ui/Account'
import { useDuelist } from '@/pistols/hooks/useDuelist'

export function ProfileDescription({
  address,
}) {
  const { name } = useDuelist(address)
  return (
    <div>
      <h1>{name}</h1>
      <AccountShort address={address} />
      <h3 className='Important'>Honor: 10.0</h3>
    </div>
  )
}
