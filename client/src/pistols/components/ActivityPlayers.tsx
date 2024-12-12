import React, { useEffect, useMemo } from 'react'
import { useAllPlayersActivityFeed, ActivityState } from '@/pistols/stores/eventsStore'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { PlayerLink, TimestampDelta } from '@/pistols/components/Links'

export const ActivityPlayers = () => {
  const { allPlayersActivity } = useAllPlayersActivityFeed()
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 60)

  const items = useMemo(() => ([...allPlayersActivity].reverse().map((a) =>
    <ActivityItem
      key={`${a.address}-${a.timestamp}-${a.activity}-${a.identifier.toString()}`}
      clientSeconds={clientSeconds}
      activity={a}
    />)
  ), [allPlayersActivity, clientSeconds])

  useEffect(() => {
    updateTimestamp()
  }, [allPlayersActivity])

  return (
    <div className='FillParent'>
      {items}
    </div>
  );
}

export default ActivityPlayers;


interface ActivityItemProps {
  activity: ActivityState
  clientSeconds: number
}

const ActivityItem = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.address} />
      {' last seen '}
      <TimestampDelta timestamp={activity.timestamp} clientSeconds={clientSeconds} className='Brightest' />
      {' ago'}
      <br />
    </>
  )
}

