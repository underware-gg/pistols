import React, { useEffect, useMemo } from 'react'
import { useAllPlayersActivityFeed, ActivityState } from '@/pistols/stores/eventsStore'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { Activity } from '@/games/pistols/generated/constants'
import { ChallengeLink, DuelistLink, PlayerLink, TimestampDelta } from '@/pistols/components/Links'

export const ActivityFeed = () => {
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

export default ActivityFeed;


interface ActivityItemProps {
  activity: ActivityState
  clientSeconds: number
}

const ActivityItem = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  if (activity.activity === Activity.CreatedDuelist) {
    return <ActivityItemCreatedDuelist activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === Activity.CreatedChallenge) {
    return <ActivityItemCreatedChallenge activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === Activity.RepliedChallenge) {
    return <ActivityItemRepliedChallenge activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === Activity.CommittedMoves) {
    return <ActivityItemCommittedMoves activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === Activity.RevealedMoves) {
    return <ActivityItemRevealedMoves activity={activity} clientSeconds={clientSeconds} />
  }
  return <></>
}

const ActivityItemCreatedDuelist = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.address} />
      {' spawned '}
      <DuelistLink duelistId={activity.identifier} />
      {' '}
      <TimestampDelta timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemCreatedChallenge = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.address} />
      {' challenged ??? for '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDelta timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemRepliedChallenge = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.address} />
      {' replied ??? to '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDelta timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemCommittedMoves = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.address} />
      {' moved in '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDelta timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemRevealedMoves = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.address} />
      {' revealed in '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDelta timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}
