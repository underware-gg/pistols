import React from 'react'
import { AccountShort } from '@/pistols/components/ui/Account'
import { useDuelist } from '@/pistols/hooks/useDuelist'

export function ProfileDescription({
  address,
  preName = null,
  postName = null,
  displayStats = false
}) {
  const { name, total_wins, total_losses, total_draws, total_duels, total_honour, honourDisplay } = useDuelist(address)
  return (
    <div className='FillWidth Relative'>
      <h1>{preName} {name} {postName}</h1>
      <AccountShort address={address} />
      <h3 className='Important'>Honour: {honourDisplay}</h3>
      {displayStats &&
        <div className='AbsoluteRight AlignRight PaddedRight'>
          Total Duels: <span className='Bold'>{total_duels}</span>
          <br />
          Total Wins: <span className='Bold'>{total_wins}</span>
          <br />
          Total Losses: <span className='Bold'>{total_losses}</span>
          <br />
          Total Draws: <span className='Bold'>{total_draws}</span>
          <br />
          Total Honour: <span className='Bold'>{total_honour}</span>
        </div>
      }
    </div>
  )
}
