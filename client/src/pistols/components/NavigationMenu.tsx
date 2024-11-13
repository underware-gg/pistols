import React, { useCallback } from 'react'
import { Grid, Dropdown } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { MenuLabels } from '@/pistols/utils/pistols'

function useExit() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { dispatchSetScene } = usePistolsScene()
  const exit = useCallback(() => {
    if (isConnected) {
      disconnect()
    }
    dispatchSetScene(SceneName.Gate)
  }, [isConnected, disconnect, dispatchSetScene])
  return {
    exit,
  }
}

export function NavigationMenu() {
  const { dispatchSetScene } = usePistolsScene()
  const { exit } = useExit()

  const _changeScene = (scene: SceneName) => {
    dispatchSetScene(scene)
  }

  const { settings, SettingsActions, dispatchSetting } = useSettings()
  const _musicToggle = () => {
    dispatchSetting(SettingsActions.MUSIC_ENABLED, !settings.musicEnabled)
  }

  return (
    <Dropdown
      className='icon huge'
      direction='left'
      icon='home'
      button
      simple
      closeOnEscape
    >
      <Dropdown.Menu>
        <Dropdown.Item icon={null} text={MenuLabels[SceneName.Tavern]} onClick={() => _changeScene(SceneName.Tavern)} />
        <Dropdown.Item icon={null} text={MenuLabels[SceneName.Duelists]} onClick={() => _changeScene(SceneName.Duelists)} />
        <Dropdown.Item icon={null} text={MenuLabels[SceneName.YourDuels]} onClick={() => _changeScene(SceneName.YourDuels)} />
        <Dropdown.Item icon={null} text={MenuLabels[SceneName.PastDuels]} onClick={() => _changeScene(SceneName.PastDuels)} />
        <Dropdown.Item icon={null} text={MenuLabels[SceneName.Profile]} onClick={() => _changeScene(SceneName.Profile)} />
        {/* <Dropdown.Item icon='music' text='Music' onClick={() => _musicToggle()} /> */}
        <Dropdown.Item icon='sign out' text={MenuLabels[SceneName.Gate]} onClick={() => exit()} />
      </Dropdown.Menu>
    </Dropdown>
  )
}
