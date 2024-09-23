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

export function Header({
  account = true,
  tables = true,
}: {
  account?: boolean
  tables?: boolean
}) {
  const { tableId } = useSettings()
  const { tableOpener } = usePistolsContext()
  const { description } = useTable(tableId)

  const _changeTable = () => {
    tableOpener.open()
  }

  return (
    <Grid stackable className='UIHeader NoSelection'>
      <Row>
        <Col width={6} verticalAlign='middle' className='Padded'>
          {account &&
            <AccountHeader />
          }
        </Col>
        <Col width={2}>
        </Col>

        <Col width={6} textAlign='center' verticalAlign='middle' className='TitleCase NoBreak Padded Relative'>
          {tables && <>
            <h1>Pistols at 10 Blocks</h1>
            <p className='AlignTop'>
              <IconClick name='ticket' size={'big'} onClick={() => _changeTable()} style={{ marginBottom: '0.4em' }} />
              {' '}<b className='Important H3 Anchor' onClick={() => _changeTable()}>{description}</b>
            </p>
          </>}
        </Col>
        <Col width={1} textAlign='right' verticalAlign='middle'>
          <MusicToggle size='big' />
        </Col>
        <Col width={1} textAlign='right' verticalAlign='middle' className='PaddedDouble'>
          <NavigationMenu />
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
    <Dropdown
      className='icon huge'
      direction='left'
      icon='home'
      button
      simple
      closeOnEscape
    >
      <Dropdown.Menu>
        <Dropdown.Item icon={null} text='Tavern' onClick={() => _changeScene(SceneName.Tavern)} />
        <Dropdown.Item icon={null} text='Past Duels' onClick={() => _changeScene(SceneName.PastDuels)} />
        <Dropdown.Item icon={null} text='Your Duels' onClick={() => _changeScene(SceneName.YourDuels)} />
        <Dropdown.Item icon={null} text='Duelists' onClick={() => _changeScene(SceneName.Duelists)} />
        <Dropdown.Item icon={null} text='Account' onClick={() => _changeScene(SceneName.Profile)} />
        {/* <Dropdown.Item icon='music' text='Music' onClick={() => _musicToggle()} /> */}
        <Dropdown.Item icon='sign out' text='Exit' onClick={() => exit()} />
      </Dropdown.Menu>
    </Dropdown>
  )
}
