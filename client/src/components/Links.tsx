import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { usePlayer, usePlayerDisplayName } from '/src/stores/playerStore'
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
  const name = usePlayerDisplayName(address)
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
  return useName
    ? <DuelistLinkWithName duelistId={duelistId} />
    : <DuelistLinkWithoutName duelistId={duelistId} />
}

const DuelistLinkBase = ({
  duelistId,
  label,
}: {
  duelistId: BigNumberish
  label: string
}) => {
  const { dispatchSelectDuelistId } = usePistolsContext()
  return (
    <span
      className='AnchorLink'
      onClick={(e) => {
        e.stopPropagation()
        dispatchSelectDuelistId(duelistId)
      }}
    >
      {label}
    </span>
  )
}

const DuelistLinkWithName = ({ duelistId }: { duelistId: BigNumberish }) => {
  const { nameAndId } = useDuelist(duelistId)
  return <DuelistLinkBase duelistId={duelistId} label={nameAndId} />
}

const DuelistLinkWithoutName = ({ duelistId }: { duelistId: BigNumberish }) => {
  const label = useMemo(() => `Duelist #${bigintToDecimal(duelistId)}`, [duelistId])
  return <DuelistLinkBase duelistId={duelistId} label={label} />
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
