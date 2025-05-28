import React, { useCallback, useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { usePlayer, usePlayersOnline } from '/src/stores/playerStore'
import { formatTimestampDeltaElapsed } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { PlayerLink } from '/src/components/Links'
import { BookmarkIcon, OnlineStatusIcon } from '/src/components/ui/Icons'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'

export default function ActivityOnline() {
  const { address, isConnected } = useAccount()
  const { bookmarkedPlayers } = usePlayer(address)
  const { playersOnline } = usePlayersOnline()
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 60)

  const items = useMemo(() => (Object.keys(playersOnline).map((addr) =>
    <ActivityItem
      key={addr}
      address={addr}
      timestamp={playersOnline[addr]}
      clientSeconds={clientSeconds}
      isBookmarked={bookmarkedPlayers.includes(BigInt(addr))}
      isConnected={isConnected}
    />)
  ), [playersOnline, clientSeconds, bookmarkedPlayers])

  useEffect(() => {
    updateTimestamp()
  }, [playersOnline])

  return (
    <div className='FillParent'>
      {items}
      {items.length == 0 && <div className='Brightest'>Loading...</div>}
    </div>
  );
}


const ActivityItem = ({
  address,
  timestamp,
  clientSeconds,
  isBookmarked,
  isConnected,
}: {
  address: BigNumberish
  timestamp: number
  clientSeconds: number
  isBookmarked: boolean
  isConnected: boolean
}) => {
  const { account } = useAccount()
  const { game } = useDojoSystemCalls();
  const _publish = useCallback(() => {
    game.emit_player_bookmark(account, address, 0, !isBookmarked)
  }, [address, isBookmarked])
  
  const { isAvailable } = usePlayer(address)
  const { result: time, isOnline, isAway } = useMemo(() => formatTimestampDeltaElapsed(timestamp, clientSeconds), [timestamp, clientSeconds])
  return (
    <>
      <BookmarkIcon isBookmarked={isBookmarked} disabled={!isConnected} onClick={_publish} />
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

