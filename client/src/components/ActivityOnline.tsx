import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { usePlayer, usePlayersOnline } from '/src/stores/playerStore'
import { formatTimestampDeltaElapsed } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { PlayerLink } from '/src/components/Links'
import { BookmarkIcon, OnlineStatusIcon } from '/src/components/ui/Icons'
import { useExecuteEmitPlayerBookmark } from '/src/hooks/usePistolsSystemCalls'

export default function ActivityOnline() {
  const { address } = useAccount()
  const { bookmarkedPlayers } = usePlayer(address)
  const { playersOnline } = usePlayersOnline()
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 60)

  const items = useMemo(() => (Object.keys(playersOnline).map((addr) =>
    <ActivityItem
      key={addr}
      playerAddress={addr}
      timestamp={playersOnline[addr]}
      clientSeconds={clientSeconds}
      isBookmarked={bookmarkedPlayers.includes(BigInt(addr))}
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
  playerAddress,
  timestamp,
  clientSeconds,
  isBookmarked,
}: {
  playerAddress: BigNumberish
  timestamp: number
  clientSeconds: number
  isBookmarked: boolean
}) => {
  const { emit_player_bookmark, isDisabled: emitIsDisabled } = useExecuteEmitPlayerBookmark(playerAddress, 0, !isBookmarked)

  const { isAvailable } = usePlayer(playerAddress)
  const { result: time, isOnline, isAway } = useMemo(() => formatTimestampDeltaElapsed(timestamp, clientSeconds), [timestamp, clientSeconds])
  return (
    <>
      <BookmarkIcon isBookmarked={isBookmarked} disabled={emitIsDisabled} onClick={emit_player_bookmark} />
      <OnlineStatusIcon isOnline={isOnline} isAway={isAway} isAvailable={isAvailable} />
      <PlayerLink address={playerAddress} />
      {' '}
      {isOnline
        ? <span className='Brightest'>is online</span>
        : <>last seen <span className='Brightest'>{time}</span> ago</>
      }
      <br />
    </>
  )
}
