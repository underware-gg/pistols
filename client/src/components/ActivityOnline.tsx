import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { usePlayer, usePlayersOnline } from '/src/stores/playerStore'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { formatTimestampDeltaElapsed } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { PlayerLink } from '/src/components/Links'
import { BookmarkIcon, OnlineStatusIcon } from '/src/components/ui/Icons'

export default function ActivityOnline() {
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


const ActivityItem = ({
  address,
  timestamp,
  clientSeconds,
  isBookmarked,
}: {
  address: BigNumberish
  timestamp: number
  clientSeconds: number
  isBookmarked: boolean
}) => {
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

