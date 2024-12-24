import React, { useMemo } from 'react'
import { Grid, Menu } from 'semantic-ui-react'
import { usePistolsScene, usePistolsContext } from '/src/hooks/PistolsContext'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useSettings } from '/src/hooks/SettingsContext'
import { DuelStage } from '/src/hooks/useDuel'
import { SPRITESHEETS } from '/src/data/assets'
import { AnimationState } from '/src/three/game'
import { IconClick } from '/src/components/ui/Icons'
import { makeDuelDataUrl } from '/src/utils/pistols'
import { SceneName } from '/src/data/assets'

const Row = Grid.Row
const Col = Grid.Column

export function MenuDuel({
  duelStage,
  duelId,
  tableId,
} : {
  duelStage: DuelStage
  duelId: bigint
  tableId: string
}) {
  const { dispatchSetting, settings, SettingsActions } = useSettings()
  const { dispatchSelectDuel } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const _backToTavern = () => {
    dispatchSelectDuel(0n)
    dispatchSetScene(SceneName.Tavern)
  }

  const _switchSfx = () => {
    dispatchSetting(SettingsActions.SFX_ENABLED, !settings.sfxEnabled)
  }

  const _skipAnimation = () => {
  }

  return (
    <div className='MenuBottomDuel AlignCenter NoMouse'>
      <div className='MenuBottomBackground NoDrag NoMouse'>
        <img className='MenuBackgroundImage' src='/images/ui/duel/bottom_nav.png'/>
      </div>
      <Menu secondary compact className='YesMouse' size='huge' style={{ minHeight: '0' }}>
        <Menu.Item className='button_duel' type='tavern' onClick={() => _backToTavern()}>
          Back to Tavern
        </Menu.Item>

        {/* <Menu.Item disabled={!canSkip} onClick={() => _skipAnimation()}>
          Skip animation
        </Menu.Item> */}

        {/* <SettingsMenuItem prefix='SFX' settingsKey={SettingsActions.SFX_ENABLED} currentValue={settings.sfxEnabled} /> */}

        <Menu.Item className='button_duel' type='icon'>
          <IconClick name='database' onClick={() => window?.open(makeDuelDataUrl(duelId), '_blank')} className='icon-control' />
        </Menu.Item>

        <Menu.Item className='button_duel' type='icon'>
          <IconClick name={settings.sfxEnabled ? 'volume up' : 'volume off'} onClick={() => _switchSfx()} className='icon-control'  />
        </Menu.Item>

      </Menu>
    </div>
  )
}

export function MenuDuelControl({
  clickPlay,
  clickStep,
  clickReset,
  isPlaying
}) {
  const { dispatchSetting, settings, SettingsActions } = useSettings()

  const _switchSpeedFactor = () => {
    const newSpeed = settings.duelSpeedFactor + 0.5
    dispatchSetting(SettingsActions.DUEL_SPEED_FACTOR, newSpeed > 2.0 ? 0.5 : newSpeed)
  }

  return (
    <div className='MenuRightDuel NoMouse'>
      <div className='MenuRightBackground NoDrag NoMouse'>
        <img className='MenuBackgroundImageFliped' src='/images/ui/duel/side_nav.png'/>
      </div>
      <Menu secondary compact vertical className='YesMouse' size='huge' style={{ minHeight: '0' }}>

        <Menu.Item className='button_duel' type='icon-vertical'>
          <IconClick name='angle double right' onClick={() => _switchSpeedFactor()} className='icon-control' />
          <div>{settings.duelSpeedFactor}</div>
        </Menu.Item>

        <Menu.Item className='button_duel' type='icon-vertical'>
          <IconClick name={isPlaying ? 'pause' : 'play'} onClick={() => clickPlay()} className='icon-control' />
        </Menu.Item>

        <Menu.Item className='button_duel' type='icon-vertical'>
          <IconClick name='plus'  onClick={() => clickStep()} className='icon-control' />
        </Menu.Item>

        <Menu.Item className='button_duel' type='icon-vertical'>
          <IconClick name='redo' onClick={() => clickReset()} className='icon-control' />
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
    // gameImpl?.playActorAnimation(actorId, key)
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

