import React, { useMemo, useState } from 'react'
import { useAllPlayersActivityFeed, ActivityState } from '@/pistols/stores/eventsStore'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { usePlayer } from '@/pistols/stores/playerStore'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { Activity } from '@/games/pistols/generated/constants'
import { bigintToNumber } from '@/lib/utils/types'
import { IconClick } from '@/lib/ui/Icons'
import { formatTimestampDelta } from '@/lib/utils/timestamp'

export const ActivityFeed = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { allPlayersActivity } = useAllPlayersActivityFeed()
  const { clientTimestamp } = useClientTimestamp(true)

  const items = useMemo(() => (allPlayersActivity.reverse().map((a) =>
    <ActivityItem
      key={`${a.address}-${a.timestamp}-${a.activity}-${a.identifier.toString()}`}
      clientTimestamp={clientTimestamp}
      activity={a}
    />)
  ), [allPlayersActivity])

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

const ActivityItem = ({
  activity,
  clientTimestamp,
}: {
  activity: ActivityState
  clientTimestamp: number
}) => {
  const { dispatchSelectPlayerAddress, dispatchSelectDuelistId, dispatchSelectDuel } = usePistolsContext()
  const { name } = usePlayer(activity.address)

  const _playerLink = useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectPlayerAddress(activity.address)}>{name}</span>
  ), [activity.address, name])

  const _duelistLink = useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectDuelistId(activity.identifier)}>duelist #{bigintToNumber(activity.identifier)}</span>
  ), [activity.identifier])

  const _challengeLink = useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectDuel(activity.identifier)}>duel #{bigintToNumber(activity.identifier)}</span>
  ), [activity.identifier])

  const _timestamp = useMemo(() => (
    <span className='Inactive' >{formatTimestampDelta(activity.timestamp, clientTimestamp)}</span>
  ), [activity.timestamp, clientTimestamp])

  const formatActivityMessage = (a: ActivityState) => {
    if (a.activity === Activity.CreatedDuelist) {
      return <>{_playerLink} created {_duelistLink} {_timestamp}</>
    }
    if (a.activity === Activity.CreatedChallenge) {
      return <>{_playerLink} challenged ??? in {_challengeLink} {_timestamp}</>
    }
    if (a.activity === Activity.RepliedChallenge) {
      return <>{_playerLink} replied ??? in {_challengeLink} {_timestamp}</>
    }
    if (a.activity === Activity.CommittedMoves) {
      return <>{_playerLink} moved in {_challengeLink} {_timestamp}</>
    }
    if (a.activity === Activity.RevealedMoves) {
      return <>{_playerLink} revealed in {_challengeLink} {_timestamp}</>
    }
    return <></>
  }

  return (
    <div>
      {formatActivityMessage(activity)}
    </div>
  )
}

export default ActivityFeed;
