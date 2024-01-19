import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Menu, Label } from 'semantic-ui-react'
import { MenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useChallengeIdsByState, useChallengesByDuelist } from '@/pistols/hooks/useChallenge'
import { useDojoAccount } from '@/dojo/DojoContext'
import { ChallengeState } from '@/pistols/utils/pistols'
import AccountHeader from '@/pistols/components/account/AccountHeader'
import { SPRITESHEETS } from '@/pistols/data/assets'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { SettingsMenuItem } from '@/pistols/components/ui/Buttons'

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
    <Menu secondary className='MenuTop' size='huge'>
      {items}

      <Menu.Menu position='right'>
        <AccountHeader />
      </Menu.Menu>

    </Menu>
  )
}

export function MenuSettings({
}) {
  const router = useRouter()
  const { settings, SettingsActions } = useSettingsContext()
  const { hasLoadedAudioAssets } = useGameplayContext()
  if (!hasLoadedAudioAssets) return <></>
  return (
    <div className='MenuBottom'>
      <Menu secondary compact className='YesMouse' size='huge'>
        <SettingsMenuItem prefix='Music' settingsKey={SettingsActions.MUSIC_ENABLED} currentValue={settings.musicEnabled} />
      </Menu>
    </div>
  )
}


export function MenuDuel({
}) {
  const router = useRouter()
  const { settings, SettingsActions } = useSettingsContext()
  return (
    <div className='MenuBottom AlignCenter NoMouse'>
      <Menu secondary compact className='YesMouse' size='huge'>
        <Menu.Item onClick={() => router.push('/tavern')}>
          Back to Tavern
        </Menu.Item>
        {/* <SettingsMenuItem prefix='Music' settingsKey={SettingsActions.MUSIC_ENABLED} currentValue={settings.musicEnabled} /> */}
        <SettingsMenuItem prefix='SFX' settingsKey={SettingsActions.SFX_ENABLED} currentValue={settings.sfxEnabled} />
      </Menu>
    </div>
  )
}


export function MenuDebugAnimations() {
  return (
    <div>
      <MenuDebugTriggers />
      <MenuDebugActors actorId='A' />
      <MenuDebugActors actorId='B' />
    </div>
  )
}

function MenuDebugTriggers() {
  const { gameImpl } = useGameplayContext()

  const _paces = (pacesCountA, paceCountB, healthA, healthB) => {
    gameImpl?.animateShootout(pacesCountA, paceCountB, healthA, healthB)
  }

  const _blades = (bladeA, bladeB, healthA, healthB) => {
    gameImpl?.animateBlades(bladeA, bladeB, healthA, healthB)
  }

  return (
    <>
      <div className='MenuBottom AlignCenter' style={{ bottom: '120px' }}>
        <Menu secondary compact>
          <Menu.Item className='NoPadding' onClick={() => _paces(1, 1, 0, 0)}>
            1_1:DD
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(5, 5, 0, 0)}>
            5_5:DD
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(10, 10, 0, 0)}>
            10_10:DD
          </Menu.Item>

          <Menu.Item className='NoPadding' onClick={() => _paces(4, 4, 100, 100)}>
            44:AA
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(4, 4, 50, 50)}>
            44:II
          </Menu.Item>

          <Menu.Item className='NoPadding' onClick={() => _paces(4, 4, 50, 0)}>
            44:ID
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(4, 4, 0, 50)}>
            44:DI
          </Menu.Item>

          <Menu.Item className='NoPadding' onClick={() => _paces(4, 5, 50, 100)}>
            45:IA
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(5, 4, 100, 50)}>
            54:AI
          </Menu.Item>

          <Menu.Item className='NoPadding' onClick={() => _paces(4, 5, 0, 100)}>
            45:DA
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(5, 4, 100, 0)}>
            54:AD
          </Menu.Item>

          <Menu.Item className='NoPadding' onClick={() => _paces(4, 5, 100, 0)}>
            45:AD
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(5, 4, 0, 100)}>
            54:DA
          </Menu.Item>

          <Menu.Item className='NoPadding' onClick={() => _paces(4, 5, 50, 50)}>
            45:II
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(5, 4, 50, 50)}>
            54:II
          </Menu.Item>

          <Menu.Item className='NoPadding' onClick={() => _paces(4, 5, 0, 50)}>
            45:DI
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _paces(5, 4, 50, 0)}>
            54:ID
          </Menu.Item>


        </Menu>
      </div>

      <div className='MenuBottom AlignCenter' style={{ bottom: '150px' }}>
        <Menu secondary compact>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 100, 100)}>
            H_H:AA
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 50, 50)}>
            H_H:II
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 0, 0)}>
            H_H:DD
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 100, 50)}>
            H_H:AI
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 50, 100)}>
            H_H:IA
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 100, 0)}>
            H_H:AD
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 0, 100)}>
            H_H:DA
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 50, 0)}>
            H_H:ID
          </Menu.Item>
          <Menu.Item className='NoPadding' onClick={() => _blades(1, 1, 0, 50)}>
            H_H:DI
          </Menu.Item>
        </Menu>
      </div>
    </>
  )
}

function MenuDebugActors({
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
        <Menu.Item key={key} className='NoPadding' onClick={() => _play(key)}>
          {actorId}:{key}
        </Menu.Item>
      )
    })
    return result
  }, [gameImpl])

  return (
    <div className='MenuBottom AlignCenter' style={{ bottom: actorId == 'B' ? '50px' : '80px' }}>
      <Menu secondary compact size='small'>
        {items}
      </Menu>
    </div>
  )
}

