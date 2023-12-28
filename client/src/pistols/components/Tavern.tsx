import React, { useMemo, useState } from 'react'
import { Container, Grid, Label, Menu } from 'semantic-ui-react'
import { MenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useChallengeIdsByState, useChallengesByDuelist } from '@/pistols/hooks/useChallenge'
import { ChallengeTableYour, ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
import { DuelistTable } from '@/pistols/components/DuelistTable'
import AccountHeader from '@/pistols/components/account/AccountHeader'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import { ChallengeState } from '@/pistols/utils/pistols'
import { useDojoAccount } from '@/dojo/DojoContext'

const Row = Grid.Row
const Col = Grid.Column

export default function Tavern() {
  const { atDuelists, atYourDuels, atLiveDuels, atPastDuels } = usePistolsContext()

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
          {atYourDuels && <ChallengeTableYour />}
          {atLiveDuels && <ChallengeTableLive />}
          {atPastDuels && <ChallengeTablePast />}
        </div>
        <DuelistModal />
        <ChallengeModal />
      </Container>
    </>
  )
}

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

function TavernMenu({
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
    <Menu secondary className='TavernMenu' size='huge'>
      {items}

      <Menu.Menu position='right'>
        <AccountHeader />
      </Menu.Menu>

    </Menu>
  )
}