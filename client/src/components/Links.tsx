import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { usePlayer } from '/src/stores/playerStore'
import { formatTimestampDeltaElapsed, bigintToDecimal, shortAddress, bigintEquals } from '@underware/pistols-sdk/utils'
import { useDuelist } from '/src/stores/duelistStore'
import { useOwnerOfDuelist } from '../hooks/useTokenDuelists'
import { useChallenge } from '../stores/challengeStore'
import { useAccount } from '@starknet-react/core'

export const PlayerLink = ({
  address,
}: {
  address: BigNumberish
}) => {
  const { name } = usePlayer(address)
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  return (
    <span 
      className='AnchorLink' 
      onClick={(e) => {
        e.stopPropagation()
        dispatchSelectPlayerAddress(address)
      }}
    >
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
    <span
      className='AnchorLink'
      onClick={(e) => {
        e.stopPropagation()
        dispatchSelectDuelistId(duelistId)
      }}
    >
      {useName ? nameAndId : `Duelist #${bigintToDecimal(duelistId)}`}
    </span>
  )
}

export const DuelistOwnerLink = ({
  duelistId,
}: {
  duelistId: BigNumberish
}) => {
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  const { owner } = useOwnerOfDuelist(duelistId)
  const { username } = usePlayer(owner)
  return (
    <span
      className='AnchorLink'
      onClick={(e) => {
        e.stopPropagation()
        dispatchSelectPlayerAddress(duelistId)
      }}
    >
      {username || shortAddress(owner)}
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
    <span
      className='AnchorLink'
      onClick={(e) => {
        e.stopPropagation()
        dispatchSelectDuel(duelId)
      }}
    >
      Duel #{bigintToDecimal(duelId)}
    </span>
  )
}

export const DuelOpponentNameLink = ({
  duelId,
}: {
  duelId: BigNumberish
}) => {
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  const { address } = useAccount()
  const { duelistAddressA, duelistAddressB } = useChallenge(duelId);
  const challengedAddress = useMemo(() => (
    bigintEquals(address, duelistAddressB) ? duelistAddressA : duelistAddressB
  ), [address, duelistAddressA, duelistAddressB]);
  const { username } = usePlayer(challengedAddress)
  if (!username && !challengedAddress) return <></>
  return (
    <span
      className='AnchorLink'
      onClick={(e) => {
        e.stopPropagation()
        dispatchSelectPlayerAddress(challengedAddress)
      }}
    >
      {username || shortAddress(challengedAddress)}
    </span>
  )
}

export const TimestampDeltaElapsed = ({
  timestamp,
  clientSeconds,
  className = 'Inactive',
  avoidLargeDelta,
}: {
  timestamp: number
  clientSeconds: number
  className?: string
  avoidLargeDelta?: boolean
}) => {
  const formatted = useMemo(() => {
    const result = formatTimestampDeltaElapsed(timestamp, clientSeconds).result;
    return (avoidLargeDelta && result.endsWith('years')) ? '...' : result;
  }, [timestamp, clientSeconds])

  return (
    <span className={className}>
      {formatted}
    </span>
  )
}
