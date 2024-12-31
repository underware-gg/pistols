import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { usePlayer, usePlayersOnline } from '/src/stores/playerStore'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useClientTimestamp, formatTimestampDeltaElapsed } from '@underware_gg/pistols-sdk/utils'
import { PlayerLink } from '/src/components/Links'
import { BookmarkIcon, OnlineStatusIcon } from '/src/components/ui/Icons'

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
  const { isAvailable } = usePlayer(address)
  const { publish } = usePlayerBookmarkSignedMessage(address, 0, !isBookmarked)
  const { result: time, isOnline, isAway } = useMemo(() => formatTimestampDeltaElapsed(timestamp, clientSeconds), [timestamp, clientSeconds])
  return (
    <>
      <BookmarkIcon isBookmarked={isBookmarked} onClick={publish} />
      <OnlineStatusIcon isOnline={isOnline} isAway={isAway} isAvailable={isAvailable} />
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

