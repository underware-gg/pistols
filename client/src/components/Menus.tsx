import React from 'react'
import { Grid, Menu } from 'semantic-ui-react'
import { usePistolsScene, usePistolsContext } from '/src/hooks/PistolsContext'
import { useSettings } from '/src/hooks/SettingsContext'
import { IconClick } from '/src/components/ui/Icons'
import { makeDuelDataUrl } from '/src/utils/pistols'
import { SceneName } from '/src/data/assets'


export function MenuDuel({
  duelId,
} : {
  duelId: bigint
}) {
  const { dispatchSetting, settings, SettingsActions } = useSettings()
  const { dispatchSetDuel } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const _backToTavern = () => {
    dispatchSetScene(SceneName.Tavern)
    dispatchSetDuel(0n)
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
