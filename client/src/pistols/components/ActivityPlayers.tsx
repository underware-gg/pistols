import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { usePlayersOnline } from '@/pistols/stores/playerStore'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { formatTimestampDeltaElapsed } from '@/lib/utils/timestamp'
import { PlayerLink } from '@/pistols/components/Links'
import { Icon } from '@/lib/ui/Icons'

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
  const { result: time, minutes } = useMemo(() => formatTimestampDeltaElapsed(timestamp, clientSeconds), [timestamp, clientSeconds])
  const isOnline = useMemo(() => (time === 'now'), [time])
  const isAway = useMemo(() => (!isOnline && minutes <= 15), [isOnline, minutes])
  const isOffline = useMemo(() => (!isOnline && !isAway), [isOnline, isAway])
  return (
    <>
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

