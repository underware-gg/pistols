import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { usePlayersOnline } from '@/pistols/stores/playerStore'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { formatTimestampDeltaElapsed } from '@/lib/utils/timestamp'
import { PlayerLink } from '@/pistols/components/Links'

export const ActivityPlayers = () => {
  const { playersOnline } = usePlayersOnline()
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 60)

  const items = useMemo(() => (Object.keys(playersOnline).map((address) =>
    <ActivityItem
      key={address}
      address={address}
      timestamp={playersOnline[address]}
      clientSeconds={clientSeconds}
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
}

const ActivityItem = ({
  address,
  timestamp,
  clientSeconds,
}: ActivityItemProps) => {
  const time = formatTimestampDeltaElapsed(timestamp, clientSeconds)
  return (
    <>
      <PlayerLink address={address} />
      {' '}
      {time === 'now'
        ? <span className='Brightest'>is online</span>
        : <>last seen <span className='Brightest'>{time}</span> ago</>
      }
      <br />
    </>
  )
}

