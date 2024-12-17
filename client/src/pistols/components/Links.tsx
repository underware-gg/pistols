import React from 'react'
import { BigNumberish } from 'starknet'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { usePlayer } from '@/pistols/stores/playerStore'
import { formatTimestampDeltaElapsed } from '@/lib/utils/timestamp'
import { bigintToNumber } from '@/lib/utils/types'

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
}: {
  duelistId: BigNumberish
}) => {
  const { dispatchSelectDuelistId } = usePistolsContext()
  return (
    <span className='AnchorLink' onClick={() => dispatchSelectDuelistId(duelistId)}>
      duelist #{bigintToNumber(duelistId)}
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
      duel #{bigintToNumber(duelId)}
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
