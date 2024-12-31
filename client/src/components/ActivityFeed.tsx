import React, { useEffect, useMemo } from 'react'
import { useAllPlayersActivityFeed, ActivityState } from '/src/stores/eventsStore'
import { useClientTimestamp } from '@underware_gg/pistols-sdk/utils'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { ChallengeLink, DuelistLink, PlayerLink, TimestampDeltaElapsed } from '/src/components/Links'

export const ActivityFeed = () => {
  const { allPlayersActivity } = useAllPlayersActivityFeed()

  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 60)
  useEffect(() => {
    updateTimestamp()
  }, [allPlayersActivity])

  const items = useMemo(() => ([...allPlayersActivity].reverse().map((a) =>
    <ActivityItem
      key={`${a.address}-${a.timestamp}-${a.activity}-${a.identifier.toString()}`}
      clientSeconds={clientSeconds}
      activity={a}
    />)
  ), [allPlayersActivity, clientSeconds])


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
  if (activity.activity === constants.Activity.CreatedDuelist) {
    return <ActivityItemCreatedDuelist activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.CreatedChallenge) {
    return <ActivityItemCreatedChallenge activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.RepliedChallenge) {
    return <ActivityItemRepliedChallenge activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.CommittedMoves) {
    return <ActivityItemCommittedMoves activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.RevealedMoves) {
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}
