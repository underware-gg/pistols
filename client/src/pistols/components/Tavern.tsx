import React, { useMemo, useState } from 'react'
import { Container, Grid, Label, Menu } from 'semantic-ui-react'
import { MenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import AccountHeader from '@/pistols/components/account/AccountHeader'
import { ChallengeTableAll, ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
import { DuelistTable } from '@/pistols/components/DuelistTable'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import { useChallengeIdsByState } from '../hooks/useChallenge'
import { ChallengeState } from '../utils/pistols'

const Row = Grid.Row
const Col = Grid.Column

export default function Tavern() {
  const { atDuelists, atLiveDuels, atPastDuels } = usePistolsContext()

  return (
    <>
      <TavernMenu />
      {/* <AccountHeader /> */}

      <div className='TavernTitle'>
        <h1>The Tavern</h1>
        <h2>of Honourable Lords 👑</h2>
      </div>

      <Container text className=''>
        <div className='TableMain'>
          {atDuelists && <DuelistTable />}
          {atLiveDuels && <ChallengeTableLive />}
          {atPastDuels && <ChallengeTablePast />}
        </div>
        <DuelistModal />
        <ChallengeModal />
      </Container>
    </>
  )
}

function TavernMenu({
}) {
  const { menuKey, tavernMenuItems, dispatchSetMenu } = usePistolsContext()

  const { challengeIds: awaitingChallengeIds } = useChallengeIdsByState(ChallengeState.Awaiting)
  const { challengeIds: liveChallengeIds } = useChallengeIdsByState(ChallengeState.InProgress)

  const liveDuelsBubble = useMemo(() => {
    const count = awaitingChallengeIds.length + liveChallengeIds.length
    if (count > 0) {
      return (
        <Label color={liveChallengeIds.length > 0 ? 'green' : 'orange'} floating>
          {count}
        </Label>
      )
    }
    return null
  }, [awaitingChallengeIds, liveChallengeIds])
  
  const items = useMemo(() => {
    let result = []
    Object.keys(tavernMenuItems).forEach(k => {
      const key = parseInt(k)
      const label = tavernMenuItems[key]
      const bubble = (key == MenuKey.LiveDuels) ? liveDuelsBubble : null
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
  }, [menuKey, awaitingChallengeIds, liveChallengeIds])

  return (
    <Menu secondary className='TavernMenu' size='huge'>
      {items}

      <Menu.Menu position='right'>
        <AccountHeader />
      </Menu.Menu>

    </Menu>
  )
}