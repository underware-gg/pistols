import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Menu } from 'semantic-ui-react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { DuelStage } from '@/pistols/hooks/useDuel'
import { SPRITESHEETS } from '@/pistols/data/assets'
import { AnimationState } from '@/pistols/three/game'
import { IconClick } from '@/lib/ui/Icons'
import { makeTavernUrl } from '@/pistols/utils/pistols'

const Row = Grid.Row
const Col = Grid.Column

export function MenuDuel({
  duelStage,
  duelId,
  tableId,
}) {
  const router = useRouter()
  const { dispatchSetting, settings, SettingsActions } = useSettingsContext()
  const { dispatchSelectDuel } = usePistolsContext()

  const _backToTavern = () => {
    dispatchSelectDuel(0n)
    router.push(makeTavernUrl(tableId))
  }

  const _switchSfx = () => {
    dispatchSetting(SettingsActions.SFX_ENABLED, !settings.sfxEnabled)
  }

  const _skipAnimation = () => {
  }

  const canSkip = duelStage == DuelStage.Round1Animation || duelStage == DuelStage.Round2Animation
  return (
    <div className='MenuBottom AlignCenter NoMouse'>
      <Menu secondary compact className='YesMouse' size='huge'>
        <Menu.Item onClick={() => _backToTavern()}>
          Back to Tavern
        </Menu.Item>

        {/* <Menu.Item disabled={!canSkip} onClick={() => _skipAnimation()}>
          Skip animation
        </Menu.Item> */}

        {/* <SettingsMenuItem prefix='SFX' settingsKey={SettingsActions.SFX_ENABLED} currentValue={settings.sfxEnabled} /> */}

        <Menu.Item>
          <IconClick name='database' onClick={() => window?.open(`/dueldata/${duelId}`, '_blank')} />
        </Menu.Item>

        <Menu.Item  >
          <IconClick name={settings.sfxEnabled ? 'volume up' : 'volume off'} onClick={() => _switchSfx()} />
        </Menu.Item>

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
  const { gameImpl } = useThreeJsContext()

  const _paces = (pacesCountA, paceCountB, healthA, healthB) => {
    gameImpl?.animateDuel(AnimationState.Round1, pacesCountA, paceCountB, healthA, healthB, healthA, healthB)
  }

  const _blades = (bladeA, bladeB, healthA, healthB) => {
    gameImpl?.animateDuel(AnimationState.Round2, bladeA, bladeB, healthA, healthB, healthA, healthB)
  }

  const className = 'PaddedHalf Important ResetSize'

  return (
    <>
      <div className='MenuBottom AlignCenter' style={{ bottom: '120px' }}>
        <Menu secondary compact>
          <Menu.Item className={className} onClick={() => _paces(1, 1, 0, 0)}>
            1_1:DD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 5, 0, 0)}>
            5_5:DD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(10, 10, 0, 0)}>
            10_10:DD
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 4, 100, 100)}>
            44:AA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(4, 4, 50, 50)}>
            44:II
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 4, 50, 0)}>
            44:ID
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(4, 4, 0, 50)}>
            44:DI
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 50, 100)}>
            45:IA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 100, 50)}>
            54:AI
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 0, 100)}>
            45:DA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 100, 0)}>
            54:AD
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 100, 0)}>
            45:AD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 0, 100)}>
            54:DA
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 50, 50)}>
            45:II
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 50, 50)}>
            54:II
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 0, 50)}>
            45:DI
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 50, 0)}>
            54:ID
          </Menu.Item>


        </Menu>
      </div>

      <div className='MenuBottom AlignCenter' style={{ bottom: '150px' }}>
        <Menu secondary compact>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 100, 100)}>
            H_H:AA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 50, 50)}>
            H_H:II
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 0, 0)}>
            H_H:DD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 100, 50)}>
            H_H:AI
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 50, 100)}>
            H_H:IA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 100, 0)}>
            H_H:AD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 0, 100)}>
            H_H:DA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 50, 0)}>
            H_H:ID
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 0, 50)}>
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
  const { gameImpl } = useThreeJsContext()

  const _play = (key) => {
    gameImpl?.playActorAnimation(actorId, key)
  }

  const className = 'PaddedHalf Important Smaller'

  const items = useMemo(() => {
    if (!gameImpl) return
    let result = []
    Object.keys(SPRITESHEETS.FEMALE).forEach(key => {
      result.push(
        <Menu.Item key={key} className={className} onClick={() => _play(key)}>
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

