import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { usePlayer, usePlayersOnline } from '@/pistols/stores/playerStore'
import { usePlayerBookmarkSignedMessage } from '@/pistols/hooks/useSignedMessages'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { formatTimestampDeltaElapsed } from '@/lib/utils/timestamp'
import { PlayerLink } from '@/pistols/components/Links'
import { Icon, IconClick } from '@/lib/ui/Icons'

export const ActivityPlayers = () => {
  const { address } = useAccount()
  const { bookmarkedPlayers } = usePlayer(address)
  const { playersOnline } = usePlayersOnline()
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 60)

  const items = useMemo(() => (Object.keys(playersOnline).map((addr) =>
    <ActivityItem
      key={addr}
      address={addr}
      timestamp={playersOnline[addr]}
      clientSeconds={clientSeconds}
      isBookmarked={bookmarkedPlayers.includes(addr)}
    />)
  ), [playersOnline, clientSeconds])

  useEffect(() => {
    updateTimestamp()
  }, [playersOnline])

  return (
    <div className='FillParent'>
      {items}
    </div>
  );
}

export default ActivityPlayers;


interface ActivityItemProps {
  address: BigNumberish
  timestamp: number
  clientSeconds: number
  isBookmarked: boolean
}

const ActivityItem = ({
  address,
  timestamp,
  clientSeconds,
  isBookmarked,
}: ActivityItemProps) => {
  const { result: time, minutes } = useMemo(() => formatTimestampDeltaElapsed(timestamp, clientSeconds), [timestamp, clientSeconds])
  const isOnline = useMemo(() => (time === 'now'), [time])
  const isAway = useMemo(() => (!isOnline && minutes <= 15), [isOnline, minutes])
  // const isOffline = useMemo(() => (!isOnline && !isAway), [isOnline, isAway])

  const { publish, isPublishing } = usePlayerBookmarkSignedMessage(address, 0, !isBookmarked)

  return (
    <>
      <IconClick name={isBookmarked ? 'bookmark' : 'bookmark outline'} onClick={publish} />
      <Icon name='circle' className={isOnline ? 'Positive' : isAway ? 'Warning' : 'Canceled'} />
      <PlayerLink address={address} />
      {' '}
      {isOnline
        ? <span className='Brightest'>is online</span>
        : <>last seen <span className='Brightest'>{time}</span> ago</>
      }
      <br />
    </>
  )
}

