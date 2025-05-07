import React from 'react'
import { usePlayer } from '/src/stores/playerStore'
import { FameBalance } from '/src/components/account/LordsBalance'
import { Address } from '/src/components/ui/Address'
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
        {displayAddress && <Address address={address} />}
        {displayFameBalance && <FameBalance address={address} size='big' />}
      </div>
    </div>
  )
}
