import React from 'react'
import { BigNumberish } from 'starknet'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { usePlayer } from '/src/stores/playerStore'
import { formatTimestampDeltaElapsed, bigintToDecimal } from '@underware/pistols-sdk/utils'
import { useDuelist } from '/src/stores/duelistStore'

export const PlayerLink = ({
  address,
}: {
  address: BigNumberish
}) => {
  const { name } = usePlayer(address)
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  return (
    <span className='AnchorLink' onClick={() => dispatchSelectPlayerAddress(address)}>
      {name}
    </span>
  )
}

export const DuelistLink = ({
  duelistId,
  useName = false,
}: {
  duelistId: BigNumberish
  useName?: boolean
}) => {
  const { nameAndId } = useDuelist(useName ? duelistId : 0)
  const { dispatchSelectDuelistId } = usePistolsContext()
  return (
    <span className='AnchorLink' onClick={() => dispatchSelectDuelistId(duelistId)}>
      {useName ? nameAndId : `Duelist #${bigintToDecimal(duelistId)}`}
    </span>
  )
}

export const ChallengeLink = ({
  duelId,
}: {
  duelId: BigNumberish
}) => {
  const { dispatchSelectDuel } = usePistolsContext()
  return (
    <span className='AnchorLink' onClick={() => dispatchSelectDuel(duelId)}>
      Duel #{bigintToDecimal(duelId)}
    </span>
  )
}

export const TimestampDeltaElapsed = ({
  timestamp,
  clientSeconds,
  className = 'Inactive',
}: {
  timestamp: number
  clientSeconds: number
  className?: string
}) => {
  return (
    <span className={className}>
      {formatTimestampDeltaElapsed(timestamp, clientSeconds).result}
    </span>
  )
}
