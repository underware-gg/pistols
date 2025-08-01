import React, { useEffect, useMemo } from 'react'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { useAllPlayersActivityFeed, ActivityState } from '/src/stores/eventsHistoricalStore'
import { useCallToChallenges } from '/src/stores/eventsModelStore'
import { useChallenge } from '/src/stores/challengeStore'
import { ChallengeLink, DuelistLink, PlayerLink, TimestampDeltaElapsed } from '/src/components/Links'
import { ChallengeStateReplyVerbs } from '/src/utils/pistols'
import { constants } from '@underware/pistols-sdk/pistols/gen'

export default function ActivityFeed() {
  const { allPlayersActivity } = useAllPlayersActivityFeed()
  const { requiredDuelIds } = useCallToChallenges()
  const { clientSeconds, updateTimestamp } = useClientTimestamp({ autoUpdate: true, updateSeconds: 60 })
  useEffect(() => {
    updateTimestamp()
  }, [allPlayersActivity])

  const items = useMemo(() => ([...allPlayersActivity].reverse().map((a, index) =>
    <ActivityItem
      key={`${a.activity}-${a.identifier.toString()}-${a.timestamp}-${index}`}
      clientSeconds={clientSeconds}
      activity={a}
      isRequired={requiredDuelIds.includes(a.identifier)}
    />)
  ), [allPlayersActivity, clientSeconds, requiredDuelIds])

  return (
    <div className='FillParent'>
      {items}
      {items.length == 0 && <div className='Brightest'>Loading...</div>}
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
    return (isRequired
      ? <ActivityItemChallengeEnded activity={activity} clientSeconds={clientSeconds} />
      : <ActivityItemChallengeResolved activity={activity} clientSeconds={clientSeconds} />
    )
  }
  if (activity.activity === constants.Activity.ChallengeDraw) {
    return (isRequired
      ? <ActivityItemChallengeEnded activity={activity} clientSeconds={clientSeconds} />
      : <ActivityItemChallengeDraw activity={activity} clientSeconds={clientSeconds} />
    )
  }
  if (activity.activity === constants.Activity.ChallengeCanceled) {
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
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
      <TimestampDeltaElapsed timestamp={activity.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
      <br />
    </>
  )
}
