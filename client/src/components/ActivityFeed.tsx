import React, { useEffect, useMemo } from 'react'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { useAllPlayersActivityFeed, ActivityState } from '/src/stores/eventsHistoricalStore'
import { useCallToChallenges } from '/src/stores/eventsModelStore'
import { useChallenge, useFetchChallengeIds } from '/src/stores/challengeStore'
import { useFetchDuelistsByIds } from '/src/stores/duelistStore'
import { ChallengeLink, DuelistLink, PlayerLink, TimestampDeltaElapsed } from '/src/components/Links'
import { ChallengeStateReplyVerbs } from '/src/utils/pistols'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'

const activityIdentifiers: Record<constants.Activity, 'pack_id' | 'duelist_id' | 'duel_id' | 'ring_id' | null> = {
  [constants.Activity.Undefined]: null,
  [constants.Activity.TutorialFinished]: 'pack_id',
  [constants.Activity.PackStarter]: 'pack_id',
  [constants.Activity.PackPurchased]: 'pack_id',
  [constants.Activity.PackOpened]: 'pack_id',
  [constants.Activity.DuelistSpawned]: 'duelist_id',
  [constants.Activity.DuelistDied]: 'duelist_id',
  [constants.Activity.ChallengeCreated]: 'duel_id',
  [constants.Activity.ChallengeCanceled]: 'duel_id',
  [constants.Activity.ChallengeReplied]: 'duel_id',
  [constants.Activity.MovesCommitted]: 'duel_id',
  [constants.Activity.MovesRevealed]: 'duel_id',
  [constants.Activity.PlayerTimedOut]: 'duel_id',
  [constants.Activity.ChallengeResolved]: 'duel_id',
  [constants.Activity.ChallengeDraw]: 'duel_id',
  [constants.Activity.ClaimedGift]: 'pack_id',
  [constants.Activity.AirdroppedPack]: 'pack_id',
  [constants.Activity.ClaimedRing]: 'ring_id',
  [constants.Activity.EnlistedRankedDuelist]: 'duelist_id',
  [constants.Activity.DuelistMatchingRanked]: 'duelist_id',
  [constants.Activity.DuelistMatchingUnranked]: 'duelist_id',
}

const _queueName = (queueId: constants.QueueId): string => {
  return queueId == constants.QueueId.Ranked ? 'Ranked' : 'Casual'
}

export default function ActivityFeed() {
  const { allPlayersActivity } = useAllPlayersActivityFeed()
  const { requiredDuelIds } = useCallToChallenges()
  const { clientSeconds, updateTimestamp } = useClientTimestamp({ autoUpdate: true, updateSeconds: 60 })
  useEffect(() => {
    updateTimestamp()
  }, [allPlayersActivity])

  // console.log(`ActivityFeed() =>`, allPlayersActivity.map((a) => a.activity))

  const items = useMemo(() => (
    [...allPlayersActivity]
      .reverse()
      .map((a, index) => {
        const item = (<ActivityItem
          key={`${a.activity}-${a.identifier.toString()}-${a.timestamp}-${index}`}
          activity={a}
          isRequired={requiredDuelIds.includes(a.identifier)}
        />)
        if (!item) return null;
        return (
          <>
            {item}
            {' '}
            <TimestampDeltaElapsed timestamp={a.timestamp} clientSeconds={clientSeconds} avoidLargeDelta={true} />
            <br />
          </>
        )
      })
      .filter(Boolean)
  ), [allPlayersActivity, clientSeconds, requiredDuelIds])

  // prefetch duels to show them in the activity feed
  const { currentDuelIds, currentDuelistIds } = useMemo(() => {
    const currentDuelIds = new Set<bigint>();
    const currentDuelistIds = new Set<bigint>();
    allPlayersActivity.forEach((activity) => {
      if (activityIdentifiers[activity.activity] == 'duel_id') {
        currentDuelIds.add(activity.identifier)
      }
      if (activityIdentifiers[activity.activity] == 'duelist_id') {
        currentDuelistIds.add(activity.identifier)
      }
    });
    return {
      currentDuelIds: Array.from(currentDuelIds),
      currentDuelistIds: Array.from(currentDuelistIds),
    }
  }, [allPlayersActivity])
  useFetchChallengeIds(currentDuelIds);
  useFetchDuelistsByIds(currentDuelistIds);

  return (
    <div className='FillParent'>
      {items}
      {items.length == 0 && <div className='Brightest'>Loading...</div>}
    </div>
  );
}

interface ActivityItemProps {
  activity: ActivityState
  queueId?: constants.QueueId
  isRequired?: boolean
}

const ActivityItem = ({
  activity,
  isRequired,
}: ActivityItemProps): JSX.Element | null => {
  if (!activity.is_public) {
    return null
  }
  if (activity.activity === constants.Activity.PackStarter) {
    return <ActivityItemPackStarter activity={activity} />
  }
  if (activity.activity === constants.Activity.DuelistSpawned) {
    return <ActivityItemDuelistSpawned activity={activity} />
  }
  if (activity.activity === constants.Activity.DuelistDied) {
    return <ActivityItemDuelistDied activity={activity} />
  }
  if (activity.activity === constants.Activity.EnlistedRankedDuelist) {
    return <ActivityItemEnlistedRankedDuelist activity={activity} />
  }
  if (activity.activity === constants.Activity.DuelistMatchingRanked) {
    return <ActivityItemDuelistMatched activity={activity} queueId={constants.QueueId.Ranked} />
  }
  if (activity.activity === constants.Activity.DuelistMatchingUnranked) {
    return <ActivityItemDuelistMatched activity={activity} queueId={constants.QueueId.Unranked} />
  }
  if (activity.activity === constants.Activity.ChallengeCreated) {
    return <ActivityItemChallengeCreated activity={activity} />
  }
  if (activity.activity === constants.Activity.ChallengeReplied) {
    return <ActivityItemChallengeReplied activity={activity} />
  }
  if (activity.activity === constants.Activity.MovesCommitted) {
    return <ActivityItemMovesCommitted activity={activity} />
  }
  if (activity.activity === constants.Activity.MovesRevealed) {
    return <ActivityItemMovesRevealed activity={activity} />
  }
  if (activity.activity === constants.Activity.ChallengeResolved) {
    return (isRequired
      ? <ActivityItemChallengeEnded activity={activity} />
      : <ActivityItemChallengeResolved activity={activity} />
    )
  }
  if (activity.activity === constants.Activity.ChallengeDraw) {
    return (isRequired
      ? <ActivityItemChallengeEnded activity={activity} />
      : <ActivityItemChallengeDraw activity={activity} />
    )
  }
  if (activity.activity === constants.Activity.ChallengeCanceled) {
    return <ActivityItemChallengeCanceled activity={activity} />
  }
  if (activity.activity === constants.Activity.PlayerTimedOut) {
    return <ActivityItemPlayerTimedOut activity={activity} />
  }
  return null
}

const ActivityItemPackStarter = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' entered the game!'}
    </>
  )
}

const ActivityItemDuelistSpawned = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' spawned '}
      <DuelistLink duelistId={activity.identifier} />
    </>
  )
}

const ActivityItemDuelistDied = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <DuelistLink duelistId={activity.identifier} />
      {' is dead!'}
    </>
  )
}

const ActivityItemEnlistedRankedDuelist = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' enlisted '}
      <DuelistLink duelistId={activity.identifier} />
      {' in Ranked'}
    </>
  )
}

const ActivityItemDuelistMatched = ({
  activity,
  queueId,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' queued '}
      <DuelistLink duelistId={activity.identifier} />
      {' in '}
      {_queueName(queueId)}
    </>
  )
}

const ActivityItemChallengeCreated = ({
  activity,
}: ActivityItemProps) => {
  const { duelType, duelistIdA, duelistAddressB } = useChallenge(activity.identifier)
  if (duelType === constants.DuelType.Ranked || duelType === constants.DuelType.Unranked) {
    if (!isPositiveBigint(duelistAddressB)) {
      return (
        <>
          <PlayerLink address={activity.player_address} />
          {' matching '}
          <ChallengeLink duelId={activity.identifier} />
          {' in '}
          {_queueName(duelType === constants.DuelType.Ranked ? constants.QueueId.Ranked : constants.QueueId.Unranked)}
        </>
      )
    }
    return (
      <>
        <PlayerLink address={activity.player_address} />
        {' matched with '}
        <PlayerLink address={duelistAddressB} />
        {' on '}
        <ChallengeLink duelId={activity.identifier} />
      </>
    )
  }
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' challenged '}
      <PlayerLink address={duelistAddressB} />
      {' for '}
      <ChallengeLink duelId={activity.identifier} />
    </>
  )
}

const ActivityItemChallengeReplied = ({
  activity,
}: ActivityItemProps) => {
  const { state } = useChallenge(activity.identifier)
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' '}
      {ChallengeStateReplyVerbs[state]}
      {' '}
      <ChallengeLink duelId={activity.identifier} />
    </>
  )
}

const ActivityItemMovesCommitted = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' moved in '}
      <ChallengeLink duelId={activity.identifier} />
    </>
  )
}

const ActivityItemMovesRevealed = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' revealed in '}
      <ChallengeLink duelId={activity.identifier} />
    </>
  )
}

const ActivityItemChallengeEnded = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <ChallengeLink duelId={activity.identifier} />
      {' has ended...'}
    </>
  )
}

const ActivityItemChallengeResolved = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' won '}
      <ChallengeLink duelId={activity.identifier} />
      {'!'}
    </>
  )
}

const ActivityItemChallengeDraw = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <ChallengeLink duelId={activity.identifier} />
      {' ended in a draw!'}
    </>
  )
}

const ActivityItemChallengeCanceled = ({
  activity,
}: ActivityItemProps) => {
  const { state } = useChallenge(activity.identifier)
  return (
    <>
      <ChallengeLink duelId={activity.identifier} />
      {
        state == constants.ChallengeState.Expired ? ' expired'
          : state == constants.ChallengeState.Withdrawn ? ' withdrawn'
            : state == constants.ChallengeState.Refused ? ' refused'
              : ' canceled'
      }
    </>
  )
}

const ActivityItemPlayerTimedOut = ({
  activity,
}: ActivityItemProps) => {
  return (
    <>
      <PlayerLink address={activity.player_address} />
      {' abandoned '}
      <ChallengeLink duelId={activity.identifier} />
    </>
  )
}
