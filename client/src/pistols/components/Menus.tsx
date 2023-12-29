import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Menu, Label } from 'semantic-ui-react'
import { MenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useChallengeIdsByState, useChallengesByDuelist } from '@/pistols/hooks/useChallenge'
import { useDojoAccount } from '@/dojo/DojoContext'
import { ChallengeState } from '@/pistols/utils/pistols'
import AccountHeader from '@/pistols/components/account/AccountHeader'
import { SPRITESHEETS } from '../data/assets'
import { useGameplayContext } from '../hooks/GameplayContext'

const Row = Grid.Row
const Col = Grid.Column

const _makeBubble = (awaitingCount, inProgressCount) => {
  const count = awaitingCount + inProgressCount
  if (count > 0) {
    return (
      <Label color={inProgressCount > 0 ? 'green' : 'orange'} floating>
        {count}
      </Label>
    )
  }
  return null
}

export function MenuTavern({
}) {
  const { account } = useDojoAccount()
  const { menuKey, tavernMenuItems, dispatchSetMenu } = usePistolsContext()

  const { awaitingCount, inProgressCount } = useChallengesByDuelist(BigInt(account.address))
  const { challengeIds: awaitingChallengeIds } = useChallengeIdsByState(ChallengeState.Awaiting)
  const { challengeIds: inProgressChallengeIds } = useChallengeIdsByState(ChallengeState.InProgress)

  const yourDuelsBubble = useMemo(() => _makeBubble(awaitingCount, inProgressCount), [awaitingCount, inProgressCount])
  const liveDuelsBubble = useMemo(() => _makeBubble(awaitingChallengeIds.length, inProgressChallengeIds.length), [awaitingChallengeIds, inProgressChallengeIds])

  const items = useMemo(() => {
    let result = []
    Object.keys(tavernMenuItems).forEach(k => {
      const key = parseInt(k)
      const label = tavernMenuItems[key]
      const bubble = (key == MenuKey.YourDuels) ? yourDuelsBubble : (key == MenuKey.LiveDuels) ? liveDuelsBubble : null
      result.push(
        <Menu.Item
          key={key}
          active={menuKey === key}
          onClick={() => dispatchSetMenu(key)}
        >
          {label}
          {bubble}
        </Menu.Item>

      )
    })
    return result
  }, [menuKey, yourDuelsBubble, liveDuelsBubble])

  return (
    <Menu secondary className='MenuTavern' size='huge'>
      {items}

      <Menu.Menu position='right'>
        <AccountHeader />
      </Menu.Menu>

    </Menu>
  )
}

export function MenuDuel({
}) {
  const router = useRouter()
  return (
    <div className='MenuDuel AlignCenter NoMouse'>
      <Menu secondary compact className='YesMouse' size='huge'>
        <Menu.Item onClick={() => router.push('/tavern')}>
          Back to Tavern
        </Menu.Item>
      </Menu>
    </div>
  )
}



export function MenuDebugActors({
  actorId
}) {
  const { gameImpl } = useGameplayContext()
  
  const _play = (key) => {
    gameImpl?.playActorAnimation(actorId, key)
  }

  const items = useMemo(() => {
    if (!gameImpl) return
    let result = []
    Object.keys(SPRITESHEETS.FEMALE).forEach(key => {
      result.push(
        <Menu.Item key={key} onClick={() => _play(key)}>
          {actorId}:{key}
        </Menu.Item>
      )
    })
    return result
  }, [gameImpl])

  return (
    <div className='MenuDuel AlignCenter' style={{ bottom: actorId == 'B' ? '50px' : '80px' }}>
      <Menu secondary compact size='small'>
        {items}
      </Menu>
    </div>
  )
}