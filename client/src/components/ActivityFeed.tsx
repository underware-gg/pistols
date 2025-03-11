import React, { useEffect, useMemo } from 'react'
import { useAllPlayersActivityFeed, ActivityState } from '/src/stores/historicalEventsStore'
import { useClientTimestamp } from '@underware_gg/pistols-sdk/utils/hooks'
import { useChallenge } from '/src/stores/challengeStore'
import { useRequiredActions } from '/src/stores/eventsStore'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { ChallengeLink, DuelistLink, PlayerLink, TimestampDeltaElapsed } from '/src/components/Links'
import { ChallengeStateReplyVerbs } from '/src/utils/pistols'

export default function ActivityFeed() {
  const { allPlayersActivity } = useAllPlayersActivityFeed()
  const { requiredDuelIds } = useRequiredActions()

  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 60)
  useEffect(() => {
    updateTimestamp()
  }, [allPlayersActivity])

  const items = useMemo(() => ([...allPlayersActivity].reverse().map((a) =>
    
    <ActivityItem
      key={`${a.player_address}-${a.timestamp}-${a.activity}-${a.identifier.toString()}`}
      clientSeconds={clientSeconds}
      activity={a}
      isRequired={requiredDuelIds.includes(a.identifier)}
    />)
  ), [allPlayersActivity, clientSeconds, requiredDuelIds])


  return (
    <div className='FillParent'>
      {items}
    </div>
  );
}


interface ActivityItemProps {
  activity: ActivityState
  clientSeconds: number
  isRequired?: boolean
}

const ActivityItem = ({
  activity,
  clientSeconds,
  isRequired,
}: ActivityItemProps) => {
  if (!activity.is_public) {
    return <></>
  }
  if (activity.activity === constants.Activity.PackStarter) {
    return <ActivityItemPackStarter activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.DuelistSpawned) {
    return <ActivityItemDuelistSpawned activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.DuelistDied) {
    return <ActivityItemDuelistDied activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.ChallengeCreated) {
    return <ActivityItemChallengeCreated activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.ChallengeReplied) {
    return <ActivityItemChallengeReplied activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.MovesCommitted) {
    return <ActivityItemMovesCommitted activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.MovesRevealed) {
    return <ActivityItemMovesRevealed activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.ChallengeResolved) {
    return (isRequired ? <ActivityItemChallengeEnded activity={activity} clientSeconds={clientSeconds} />
      : <ActivityItemChallengeResolved activity={activity} clientSeconds={clientSeconds} />
    )
  }
  if (activity.activity === constants.Activity.ChallengeDraw) {
    return (isRequired ? <ActivityItemChallengeEnded activity={activity} clientSeconds={clientSeconds} />
      : <ActivityItemChallengeDraw activity={activity} clientSeconds={clientSeconds} />
    )
  }
  if (activity.activity === constants.Activity.ChallengeExpired) {
    return <ActivityItemChallengeCanceled activity={activity} clientSeconds={clientSeconds} />
  }
  if (activity.activity === constants.Activity.PlayerTimedOut) {
    return <ActivityItemPlayerTimedOut activity={activity} clientSeconds={clientSeconds} />
  }
  return <></>
}

const ActivityItemPackStarter = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' entered the game! '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemDuelistSpawned = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' spawned '}
      <DuelistLink duelistId={activity.identifier} />
      {' '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemDuelistDied = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <DuelistLink duelistId={activity.identifier} />
      {' is dead! '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemChallengeCreated = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  const { duelistAddressB } = useChallenge(activity.identifier)
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' challenged '}
      <PlayerLink address={duelistAddressB} />
      {' for '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemChallengeReplied = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  const { state } = useChallenge(activity.identifier)
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' '}
      {ChallengeStateReplyVerbs[state]}
      {' '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemMovesCommitted = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' moved in '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemMovesRevealed = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' revealed in '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemChallengeEnded = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <ChallengeLink duelId={activity.identifier} />
      {' has ended... '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemChallengeResolved = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' won '}
      <ChallengeLink duelId={activity.identifier} />
      {'! '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemChallengeDraw = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <ChallengeLink duelId={activity.identifier} />
      {' ended in a draw! '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemChallengeCanceled = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  const { state } = useChallenge(activity.identifier)
  return (
    <>
      <ChallengeLink duelId={activity.identifier} />
      {
        state == constants.ChallengeState.Expired ? ' expired '
          : state == constants.ChallengeState.Withdrawn ? ' withdrawn '
            : state == constants.ChallengeState.Refused ? ' refused '
              : ' canceled '
      }
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}

const ActivityItemPlayerTimedOut = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' abandoned '}
      <ChallengeLink duelId={activity.identifier} />
      {' '}
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} />
      <br />
    </>
  )
}
