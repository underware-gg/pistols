import React, { useMemo, useState } from 'react'
import { useAllPlayersActivityFeed, ActivityState } from '@/pistols/stores/eventsStore'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { AddressShort } from '@/lib/ui/AddressShort'
import { Activity } from '@/games/pistols/generated/constants'
import { bigintToNumber } from '@/lib/utils/types'
import { IconClick } from '@/lib/ui/Icons'
import { usePlayer } from '../stores/playerStore'

export const ActivityFeed = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { allPlayersActivity } = useAllPlayersActivityFeed()

  const items = useMemo(() => (allPlayersActivity.reverse().map((a) =>
    <ActivityItem key={`${a.address}-${a.timestamp}-${a.activity}-${a.identifier.toString()}`} activity={a} />)
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
}: {
  activity: ActivityState
}) => {
  const { dispatchSelectPlayerAddress, dispatchSelectDuelistId, dispatchSelectDuel } = usePistolsContext()
  const { name } = usePlayer(activity.address)

  const _playerLink = () => useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectPlayerAddress(activity.address)}>{name}</span>
  ), [activity.address, name])

  const _duelistLink = () => useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectDuelistId(activity.identifier)}>duelist #{bigintToNumber(activity.identifier)}</span>
  ), [activity.identifier])

  const _challengeLink = () => useMemo(() => (
    <span className='Anchor Important' onClick={() => dispatchSelectDuel(activity.identifier)}>duel #{bigintToNumber(activity.identifier)}</span>
  ), [activity.identifier])

  const formatActivityMessage = (a: ActivityState) => {
    if (a.activity === Activity.CreatedDuelist) {
      return <>{_playerLink()} created {_duelistLink()}</>
    }
    if (a.activity === Activity.CreatedChallenge) {
      return <>{_playerLink()} challenged ??? in {_challengeLink()}</>
    }
    if (a.activity === Activity.RepliedChallenge) {
      return <>{_playerLink()} replied ??? in {_challengeLink()}</>
    }
    if (a.activity === Activity.CommittedMoves) {
      return <>{_playerLink()} moved in {_challengeLink()}</>
    }
    if (a.activity === Activity.RevealedMoves) {
      return <>{_playerLink()} revealed in {_challengeLink()}</>
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
