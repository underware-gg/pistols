import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { usePlayer, usePlayersOnline } from '@/pistols/stores/playerStore'
import { usePlayerBookmarkSignedMessage } from '@/pistols/hooks/useSignedMessages'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { formatTimestampDeltaElapsed } from '@/lib/utils/timestamp'
import { PlayerLink } from '@/pistols/components/Links'
import { BookmarkIcon, OnlineStatusIcon } from '@/lib/ui/Icons'

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
  ), [playersOnline, clientSeconds, bookmarkedPlayers])

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
  const { result: time, isOnline, isAway } = useMemo(() => formatTimestampDeltaElapsed(timestamp, clientSeconds), [timestamp, clientSeconds])
  const { publish } = usePlayerBookmarkSignedMessage(address, 0, !isBookmarked)
  return (
    <>
      <BookmarkIcon isBookmarked={isBookmarked} onClick={publish} />
      <OnlineStatusIcon isOnline={isOnline} isAway={isAway} />
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

