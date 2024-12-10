import React from 'react'
import { usePlayer } from '@/pistols/stores/playerStore'
import { FameBalance } from '@/pistols/components/account/LordsBalance'
import { AddressShort } from '@/lib/ui/AddressShort'
import { BigNumberish } from 'starknet'

export function PlayerDescription({
  address,
  displayAddress = false,
  displayFameBalance = false,
}: {
  address: BigNumberish
  displayAddress?: boolean
  displayFameBalance?: boolean
}) {
  const { name } = usePlayer(address)
  return (
    <div className='FillParent' style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <h1>{name}</h1>
        {displayAddress && <AddressShort address={address} />}
        {displayFameBalance && <FameBalance address={address} big />}
      </div>
    </div>
  )
}
