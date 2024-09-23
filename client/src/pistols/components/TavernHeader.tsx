import React, { useCallback } from 'react'
import { Grid, Dropdown } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { MusicToggle } from '@/pistols/components/ui/Buttons'
import { IconClick } from '@/lib/ui/Icons'
import AccountHeader from '@/pistols/components/account/AccountHeader'

const Row = Grid.Row
const Col = Grid.Column

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

export function TavernHeader() {
  const { tableId } = useSettings()
  const { tableOpener } = usePistolsContext()
  const { description } = useTable(tableId)
  const { exit } = useExit()

  const _changeTable = () => {
    tableOpener.open()
  }

  return (
    <Grid stackable className='UIHeader NoSelection'>
      <Row>
        <Col width={2} textAlign='left' verticalAlign='middle'>
          <NavigationMenu />
        </Col>
        <Col width={6} textAlign='center' verticalAlign='top' className='TitleCase NoBreak Padded Relative'>
          <h2>Pistols at 10 Blocks</h2>
          <h3>
            <IconClick name='ticket' size={'small'} onClick={() => _changeTable()} />
            {' '}
            <b className='Smaller Important'>{description}</b>
          </h3>
        </Col>
        <Col width={2} textAlign='right' verticalAlign='top'>
        </Col>
        <Col width={6} textAlign='right' verticalAlign='top'>
          <AccountHeader />
        </Col>
      </Row>
    </Grid>
  )
}

function NavigationMenu() {
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
    <div className='PaddedDouble'>
      <Dropdown
        // icon='sidebar'
        icon='home'
        button
        className='icon huge'
        simple
        onClick={() => _changeScene(SceneName.Tavern)}
      >
        <Dropdown.Menu>
          <Dropdown.Item icon={null} text='Past Duels' onClick={() => _changeScene(SceneName.PastDuels)} />
          <Dropdown.Item icon={null} text='Your Duels' onClick={() => _changeScene(SceneName.YourDuels)} />
          <Dropdown.Item icon={null} text='Duelists' onClick={() => _changeScene(SceneName.Duelists)} />
          <Dropdown.Item icon={null} text='Account' onClick={() => _changeScene(SceneName.Profile)} />
          {/* <Dropdown.Item icon='music' text='Music' onClick={() => _musicToggle()} /> */}
          <Dropdown.Item icon='sign out' text='Exit' onClick={() => exit()} />
        </Dropdown.Menu>
      </Dropdown>

      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <MusicToggle size='big' />
    </div>
  )
}
