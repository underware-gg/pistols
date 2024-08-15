import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Menu, Label, Tab, TabPane } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useQueryContext } from '@/pistols/hooks/QueryContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { ChallengeTableYour, ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
import { IRLTournamentTab } from '@/pistols/components/tournament/IRLTournamentTab'
import { DuelistTable } from '@/pistols/components/DuelistTable'
import { MusicToggle } from '@/pistols/components/ui/Buttons'
import { IconClick } from '@/lib/ui/Icons'
import AccountHeader from '@/pistols/components/account/AccountHeader'

const Row = Grid.Row
const Col = Grid.Column

const _makeBubble = (count) => {
  if (count > 0) {
    return (
      <Label floating>
        {count}
      </Label>
    )
  }
  return null
}

export function TavernMenu({
}) {
  const { tableId, isAnon } = useSettings()
  const { tavernMenuItems, tableOpener } = usePistolsContext()
  const { currentScene, dispatchSetScene } = usePistolsScene()
  const { description, isTournament, isIRLTournament } = useTable(tableId)

  const {
    queryLiveDuels: { liveCount: liveDuelsCount },
    queryYourDuels: { liveCount: yourDuelsCount },
  } = useQueryContext()

  const panes = useMemo(() => {
    let result = []
    tavernMenuItems.forEach(key => {
      if (key === SceneName.Tournament && !isTournament) return
      if (key === SceneName.IRLTournament && !isIRLTournament) return
      const bubble = (key == SceneName.YourDuels) ? _makeBubble(yourDuelsCount) : (key == SceneName.LiveDuels) ? _makeBubble(liveDuelsCount) : null
      result.push({
        key,
        menuItem: (
          <Menu.Item
            key={key}
            onClick={() => dispatchSetScene(key as SceneName)}
          >
            {key}
            {bubble}
          </Menu.Item>
        ),
        render: () => (
          <TabPane attached={true}>
            <div className='UIMenuTavernScroller'>
              {key === SceneName.Duelists && <DuelistTable />}
              {key === SceneName.YourDuels && <ChallengeTableYour />}
              {key === SceneName.LiveDuels && <ChallengeTableLive />}
              {key === SceneName.PastDuels && <ChallengeTablePast />}
              {key === SceneName.Tournament && <></>}
              {key === SceneName.IRLTournament && <IRLTournamentTab />}
            </div>
          </TabPane>
        )
      })
    })
    return result
  }, [tavernMenuItems, yourDuelsCount, liveDuelsCount, isTournament, isIRLTournament])

  const menuIndex = panes.findIndex(pane => (pane.key == currentScene))

  const _changeTable = () => {
    tableOpener.open()
  }

  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const _exit = () => {
    if (isConnected) {
      disconnect()
    }
    dispatchSetScene(SceneName.Gate)
  }

  return (
    <>
      <Grid>
        <Row className='ProfilePicHeight Unselectable'>
          <Col width={7} verticalAlign='top' className='TitleCase NoBreak Padded Relative'>
            <h2>Pistols at 10 Blocks</h2>
            <h3>
              <IconClick name='ticket' size={'small'} onClick={() => _changeTable()} />
              {' '}
              <b className='Smaller Important'>{description}</b>
            </h3>
          </Col>
          <Col width={9} textAlign='right'>
            <AccountHeader />
          </Col>
        </Row>
      </Grid>

      <div className='Relative'>

        <div className='AbsoluteRight PaddedDouble'>
          <MusicToggle />
          &nbsp;&nbsp;
          &nbsp;&nbsp;
          <IconClick name='sign out' size={'large'} onClick={() => _exit()} />
          &nbsp;&nbsp;&nbsp;
        </div>

        <Tab activeIndex={menuIndex} menu={{ secondary: true, pointing: true, attached: true }} panes={panes} />
      </div>
    </>
  )
}
