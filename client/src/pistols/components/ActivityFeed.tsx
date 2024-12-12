import React, { useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useAllPlayersActivityFeed, ActivityState } from '@/pistols/stores/eventsStore'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { usePlayer } from '@/pistols/stores/playerStore'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { formatTimestampDeltaElapsed } from '@/lib/utils/timestamp'
import { bigintToNumber } from '@/lib/utils/types'
import { IconClick } from '@/lib/ui/Icons'
import { Activity } from '@/games/pistols/generated/constants'

export const ActivityFeed = () => {
  const [collapsed, setCollapsed] = useState(false)
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
  
  const { atGate, atDoor, atDuel } = usePistolsScene()
  if (atGate || atDoor || atDuel) {
    return <></>
  }

  return (
    <div className={`${collapsed ? 'ActivityFeedCollapsed' : 'ActivityFeed'} Relative`}>
      <h3 className='TitleCase'>Activity Log</h3>
      <IconClick className='ActivityFeedIcon'
        name={collapsed ? 'chevron left' : 'chevron down'}
        onClick={() => setCollapsed(!collapsed)}
      />
      {!collapsed && items}
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
  const { name } = usePlayer(activity.address)
  const playerLink = usePlayerLink(activity.address, name)
  const duelistLink = useDuelistLink(activity.identifier)
  const timestamp = useTimestampDelta(activity.timestamp, clientSeconds)
  return <>{playerLink} opened {duelistLink} {timestamp}<br /></>
}

const ActivityItemCreatedChallenge = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  const { name } = usePlayer(activity.address)
  const playerLink = usePlayerLink(activity.address, name)
  const challengeLink = useChallengeLink(activity.identifier)
  const timestamp = useTimestampDelta(activity.timestamp, clientSeconds)
  return <>{playerLink} challenged ??? in {challengeLink} {timestamp}<br /></>
}

const ActivityItemRepliedChallenge = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  const { name } = usePlayer(activity.address)
  const playerLink = usePlayerLink(activity.address, name)
  const challengeLink = useChallengeLink(activity.identifier)
  const timestamp = useTimestampDelta(activity.timestamp, clientSeconds)
  return <>{playerLink} replied ??? in {challengeLink} {timestamp}<br /></>
}

const ActivityItemCommittedMoves = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  const { name } = usePlayer(activity.address)
  const playerLink = usePlayerLink(activity.address, name)
  const challengeLink = useChallengeLink(activity.identifier)
  const timestamp = useTimestampDelta(activity.timestamp, clientSeconds)
  return <>{playerLink} moved in {challengeLink} {timestamp}<br /></>
}

const ActivityItemRevealedMoves = ({
  activity,
  clientSeconds,
}: ActivityItemProps) => {
  const { name } = usePlayer(activity.address)
  const playerLink = usePlayerLink(activity.address, name)
  const challengeLink = useChallengeLink(activity.identifier)
  const timestamp = useTimestampDelta(activity.timestamp, clientSeconds)
  return <>{playerLink} revealed in {challengeLink} {timestamp}<br /></>
}


//
// activity links
//

const usePlayerLink = (address: BigNumberish, name: string) => {
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  const result = useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectPlayerAddress(address)}>{name}</span>
  ), [address, name])
  return result
}

const useDuelistLink = (duelistId: BigNumberish) => {
  const { dispatchSelectDuelistId } = usePistolsContext()
  const result = useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectDuelistId(duelistId)}>duelist #{bigintToNumber(duelistId)}</span>
  ), [duelistId])
  return result
}

const useChallengeLink = (duelId: BigNumberish) => {
  const { dispatchSelectDuel } = usePistolsContext()
  const result = useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectDuel(duelId)}>duel #{bigintToNumber(duelId)}</span>
  ), [duelId])
  return result
}

const useTimestampDelta = (timestamp: number, clientSeconds: number) => {
  const result = useMemo(() => (
    <span className='Inactive' >{formatTimestampDeltaElapsed(timestamp, clientSeconds)}</span>
  ), [timestamp, clientSeconds])
  return result
}
