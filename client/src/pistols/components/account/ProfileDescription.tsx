import React, { useMemo } from 'react'
import { AccountShort } from '@/pistols/components/ui/Account'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { EMOJI } from '@/pistols/data/messages'

export function ProfileName({
  address,
  badges = true,
}) {
  const { name, honour } = useDuelist(address)
  const _badges = useMemo(() => (badges && honour > 9.0 ? ` ${EMOJI.LORD}` : null), [honour])
  return (
    <span>{name}{_badges}</span>
  )
}

export function ProfileDescription({
  address,
  displayStats = false
}) {
  const { total_wins, total_losses, total_draws, total_duels, total_honour, honourAndTotal } = useDuelist(address)
  return (
    <div className='FillWidth Relative'>
      <h1><ProfileName address={address} /></h1>
      <AccountShort address={address} />
      <h3 className='Important'>Honour: {honourAndTotal}</h3>

      {displayStats && total_duels > 0 &&
        <div className='ProfileStats AbsoluteRight AlignRight PaddedRight TitleCase'>
          Duels: <span className='Bold'>{total_duels}</span>
          <br />
          Wins: <span className='Bold'>{total_wins}</span>
          <br />
          Losses: <span className='Bold'>{total_losses}</span>
          <br />
          Draws: <span className='Bold'>{total_draws}</span>
          <br />
          Honour: <span className='Bold'>{total_honour}</span>
        </div>
      }
    </div>
  )
}
